<#
    db.ps1 — Gestión de la base de datos PostgreSQL del proyecto (Docker).

    Uso:   .\db.ps1 <comando>

      up       Levanta PostgreSQL. Si el volumen está vacío (primera vez),
               Docker ejecuta solo db/01_schema.sql y db/02_seed.sql.
      tables   Aplica los scripts SQL sobre una base YA levantada.
               Es seguro repetirlo: todo es CREATE TABLE IF NOT EXISTS /
               INSERT ... ON CONFLICT DO NOTHING.
      status   Muestra el estado del contenedor y lista las tablas creadas.
      psql     Abre una consola psql interactiva dentro del contenedor.
      logs     Sigue los logs de PostgreSQL (Ctrl+C para salir).
      down     Detiene el contenedor (CONSERVA los datos).
      reset    BORRA el volumen y recrea la base desde cero. Pide confirmación.
#>

$ErrorActionPreference = 'Stop'

# Todos los comandos se ejecutan desde la raíz del proyecto (donde está docker-compose.yml)
Set-Location -Path $PSScriptRoot

$DB_USER = if ($env:DB_ADMIN_USER) { $env:DB_ADMIN_USER } else { 'tesis' }
$DB_NAME = if ($env:DB_NAME)       { $env:DB_NAME }       else { 'postgres' }
$SVC     = 'postgres'

function Wait-ForDb {
    Write-Host "Esperando a que PostgreSQL acepte conexiones..." -ForegroundColor Cyan
    for ($i = 1; $i -le 30; $i++) {
        docker compose exec -T $SVC pg_isready -U $DB_USER -d $DB_NAME *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL listo." -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "PostgreSQL no respondió tras 60s. Revisa: docker compose logs $SVC"
}

function Invoke-SqlFile([string]$File) {
    Write-Host "  -> $File" -ForegroundColor DarkGray
    # El directorio db/ está montado dentro del contenedor en /docker-entrypoint-initdb.d
    docker compose exec -T $SVC psql -v ON_ERROR_STOP=1 -U $DB_USER -d $DB_NAME `
        -f "/docker-entrypoint-initdb.d/$File"
    if ($LASTEXITCODE -ne 0) { throw "Falló la ejecución de $File" }
}

switch ($args[0]) {

    'up' {
        docker compose up -d
        Wait-ForDb
        Write-Host ""
        Write-Host "Base de datos disponible en localhost:5432 (db: $DB_NAME, user: $DB_USER)" -ForegroundColor Green
        Write-Host "Si es la primera vez, las tablas ya se crearon automáticamente." -ForegroundColor Gray
        Write-Host "Si la base ya existía y faltan tablas, ejecuta:  .\db.ps1 tables" -ForegroundColor Gray
    }

    'tables' {
        Wait-ForDb
        Write-Host "Aplicando scripts SQL..." -ForegroundColor Cyan
        Invoke-SqlFile '01_schema.sql'
        Invoke-SqlFile '02_seed.sql'
        Write-Host "Tablas y datos base aplicados correctamente." -ForegroundColor Green
    }

    'status' {
        docker compose ps
        Write-Host ""
        Write-Host "Tablas por esquema:" -ForegroundColor Cyan
        docker compose exec -T $SVC psql -U $DB_USER -d $DB_NAME -c `
            "SELECT schemaname AS esquema, COUNT(*) AS tablas
               FROM pg_tables
              WHERE schemaname IN ('dashboard','clamp','injection','ejection','heating','recipes')
              GROUP BY schemaname ORDER BY schemaname;"
    }

    'psql' {
        docker compose exec -it $SVC psql -U $DB_USER -d $DB_NAME
    }

    'logs' {
        docker compose logs -f $SVC
    }

    'down' {
        docker compose down
        Write-Host "Contenedor detenido. Los datos se conservan en el volumen." -ForegroundColor Green
    }

    'reset' {
        Write-Host "ADVERTENCIA: esto BORRA todos los datos de la base." -ForegroundColor Red
        $ok = Read-Host "Escribe 'si' para continuar"
        if ($ok -ne 'si') { Write-Host "Cancelado."; break }
        docker compose down -v
        docker compose up -d
        Wait-ForDb
        Write-Host "Base recreada desde cero con schema + seed." -ForegroundColor Green
    }

    default {
        Write-Host "Uso: .\db.ps1 <up|tables|status|psql|logs|down|reset>" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  up       Levanta PostgreSQL (crea las tablas si la base está vacía)"
        Write-Host "  tables   Aplica schema + seed sobre una base ya levantada (idempotente)"
        Write-Host "  status   Estado del contenedor y conteo de tablas por esquema"
        Write-Host "  psql     Consola psql interactiva"
        Write-Host "  logs     Sigue los logs de PostgreSQL"
        Write-Host "  down     Detiene el contenedor (conserva datos)"
        Write-Host "  reset    Borra el volumen y recrea todo desde cero"
    }
}
