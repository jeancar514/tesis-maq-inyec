# Guía de Graphify - Knowledge Graph para Proyectos

## ¿Qué es Graphify?

Graphify es una herramienta que convierte tu código fuente, documentación, esquemas SQL, PDFs e imágenes en un **grafo de conocimiento consultable**. En lugar de buscar información con `grep` o abriendo archivos uno por uno, construyes un mapa interactivo de todo el proyecto que puedes consultar en lenguaje natural.

### Características principales

- **🔒 100% local para código**: El código se procesa localmente con tree-sitter AST (sin enviar nada a ninguna API)
- **🎯 Sin vectores**: Es un grafo real que puedes recorrer, no un índice de embeddings
- **📊 Visualización interactiva**: HTML navegable con comunidades detectadas automáticamente
- **🔗 Trazabilidad completa**: Cada conexión está etiquetada como `EXTRACTED` (explícita en el código) o `INFERRED` (resuelta por graphify)
- **🗣️ Consultas en lenguaje natural**: Pregunta sobre el código y obtén subgrafos relevantes

---

## ¿En qué me puede ayudar?

### En tu proyecto de tesis (Máquina de Inyección)

1. **Entender la arquitectura completa**
   - Ver cómo se conectan los módulos frontend (React/TypeScript) con el backend (Node.js/Express)
   - Mapear el flujo desde componentes UI → repositorios → rutas API → base de datos
   - Identificar "God nodes" (conceptos centrales que conectan todo)

2. **Documentar para la tesis**
   - Generar diagramas automáticos de la arquitectura (`graph.html`, `callflow-html`)
   - Exportar el grafo a formatos académicos (SVG, GraphML, Mermaid)
   - Obtener métricas del proyecto (comunidades, complejidad, conexiones)

3. **Responder preguntas complejas**
   ```bash
   graphify query "¿cómo se conecta CarriageGeneralPage con la base de datos?"
   graphify path "CarriageControlRepository" "car_carro_lectura"
   graphify explain "lecturaWatcher"
   ```

4. **Acelerar el desarrollo con IA**
   - Integrado con Claude Code, Cursor, Copilot
   - El asistente consulta el grafo en lugar de leer archivos completos
   - **71× menos tokens** por consulta (según benchmarks oficiales)

---

## Instalación

### Requisitos previos

- **Python 3.10+**: Verificar con `python --version`
- **uv** (recomendado) o `pipx`

### Paso 1: Instalar la herramienta

```bash
# Opción 1: Con uv (recomendado)
uv tool install graphifyy

# Opción 2: Con pipx
pipx install graphifyy

# Opción 3: Con pip (requiere configurar PATH manualmente)
pip install graphifyy
```

> **Nota importante**: El paquete se llama `graphifyy` (doble 'y'), pero el comando es `graphify`.

### Paso 2: Registrar con tu asistente de IA

```bash
# Instalación global (en tu perfil de usuario)
graphify install

# O instalación por proyecto (archivos en .claude/, .agents/, etc.)
graphify install --project
```

### Paso 3: Verificar instalación

```bash
graphify --version
```

Si obtienes `command not found`, ejecuta:

```bash
# Con uv
uv tool update-shell

# Con pipx
pipx ensurepath

# Luego abre una nueva terminal
```

---

## Uso básico en tu proyecto

### 1. Generar el grafo por primera vez

```bash
cd c:\Users\jeanc\Documents\tesis\proyecto\tesis-maq-inyec

# Frontend (React/TypeScript)
cd frontend
graphify extract . --code-only

# Backend (Node.js)
cd ../spx5-opcua-bridge
graphify extract . --code-only
```

**Flag `--code-only`**: Procesa solo código (local, sin API key). Omítelo si quieres incluir documentación/PDFs.

### 2. Explorar el grafo

Se generan 3 archivos en `graphify-out/`:

```
graphify-out/
├── graph.html         # Abre en el navegador - interactivo, filtra, busca
├── GRAPH_REPORT.md    # Resumen: conceptos clave, conexiones sorprendentes
└── graph.json         # Grafo completo - consulta sin releer archivos
```

### 3. Hacer consultas desde terminal

```bash
# Consulta en lenguaje natural
graphify query "muéstrame el flujo de autenticación"

# Camino más corto entre dos conceptos
graphify path "CarriageGeneralPage" "car_carro_lectura"

# Explicar un concepto específico
graphify explain "lecturaWatcher"
```

### 4. Actualizar el grafo (después de cambios)

```bash
# Solo extrae archivos modificados
graphify extract . --update

# Forzar regeneración completa
graphify extract . --force
```

---

## Integración con tu entorno

### Git hooks (auto-actualizar en commits)

```bash
graphify hook install
```

Esto regenera el grafo automáticamente después de cada commit (solo AST, sin costo de API).

### Uso con tu asistente de IA

Si usas **Kiro** (tu entorno actual):

```bash
graphify kiro install
```

Escribe el skill en `.kiro/skills/graphify/` y `.kiro/steering/graphify.md`.

En tu asistente, escribe:

```
/graphify .
```

Y luego puedes preguntar directamente:

```
@graphify ¿cómo se conecta el frontend con el backend para el módulo de inyección?
```

---

## Comandos útiles para tu tesis

### Exportar diagramas

```bash
# HTML con Mermaid (arquitectura + call-flow)
graphify export callflow-html

# SVG para incluir en LaTeX
graphify extract . --svg

# GraphML (para Gephi/yEd - herramientas de análisis de grafos)
graphify extract . --graphml
```

### Generar wiki en Markdown

```bash
graphify extract . --wiki
```

Crea una wiki navegable en `graphify-out/wiki/` con páginas interconectadas.

### Análisis de comunidades

```bash
# Más comunidades (más granular)
graphify cluster-only . --resolution 1.5

# Excluir nodos ultra-conectados del ranking
graphify cluster-only . --exclude-hubs 99
```

---

## Configuración del proyecto

### Archivos a ignorar

Crea `.graphifyignore` en la raíz de cada proyecto:

```gitignore
# Frontend
node_modules/
dist/
build/
*.test.ts
*.test.tsx

# Backend
node_modules/
*.log
coverage/

# Común
.env
.env.local
```

### Qué commitear

En `.gitignore` **NO** agregues:

```gitignore
# Commitear para compartir con el equipo
graphify-out/graph.json
graphify-out/graph.html
graphify-out/GRAPH_REPORT.md

# Ignorar (local)
graphify-out/cost.json
graphify-out/cache/
```

**Ventaja**: Todo el equipo empieza con el mapa actualizado sin regenerarlo.

---

## Casos de uso específicos

### 1. Documentar la arquitectura para la tesis

```bash
# Generar reporte completo
graphify extract ./frontend --code-only
graphify extract ./spx5-opcua-bridge --code-only

# Exportar diagrama
graphify export callflow-html --output docs/arquitectura.html
```

Obtienes un diagrama interactivo con:
- Módulos principales
- Flujos de datos
- Comunidades detectadas (subsistemas)

### 2. Entender código heredado o complejo

```bash
# ¿Qué hace este archivo?
graphify explain "lecturaWatcher.js"

# ¿Cómo llego de A a B?
graphify path "CarriageGeneralPage" "insertCarroLectura"
```

### 3. Revisión de código con IA

```bash
# Instalar hook de revisión
graphify hook install

# En cada commit, el grafo se actualiza automáticamente
# Tu asistente ve cambios en contexto
```

---

## Troubleshooting

### `graphify: command not found`

```bash
# Con uv
uv tool update-shell

# Con pipx
pipx ensurepath

# Abrir nueva terminal
```

### `ModuleNotFoundError: No module named 'graphify'`

Usa `uv tool install` o `pipx install`, no `pip install`. Si ya lo instalaste con pip:

```bash
pip uninstall graphifyy
uv tool install graphifyy
```

### El grafo tiene menos nodos después de `--update`

Archivos borrados dejan nodos huérfanos. Usa `--force`:

```bash
graphify extract . --force
```

### PowerShell: "path not recognized"

En PowerShell, usa `graphify .` (sin la `/` inicial):

```bash
graphify .  # ✅ Correcto en PowerShell
/graphify . # ❌ Error en PowerShell
```

---

## Privacidad y seguridad

- **Código**: Procesado localmente con tree-sitter. **Nada sale de tu máquina**.
- **Documentación/PDFs**: Requieren llamada a API (Claude, Gemini, etc.) para extracción semántica.
- **Sin telemetría**: Graphify no envía métricas ni analytics.
- **Logs locales**: Todas las consultas se guardan en `~/.cache/graphify-queries.log` (puedes desactivarlo con `GRAPHIFY_QUERY_LOG_DISABLE=1`).

---

## Recursos adicionales

- **Sitio oficial**: https://graphify.com/
- **GitHub**: https://github.com/Graphify-Labs/graphify
- **Documentación completa**: [How it works](https://github.com/Graphify-Labs/graphify/blob/v8/docs/how-it-works.md)
- **Discord**: https://discord.gg/598Ad9zQZ

---

## Resumen de comandos clave

```bash
# Instalación
uv tool install graphifyy
graphify install

# Generar grafo (solo código, local)
graphify extract . --code-only

# Consultas
graphify query "tu pregunta"
graphify path "ConceptoA" "ConceptoB"
graphify explain "NombreClase"

# Actualizar
graphify extract . --update
graphify extract . --force

# Exportar para tesis
graphify export callflow-html
graphify extract . --svg
graphify extract . --wiki

# Integración
graphify hook install
graphify kiro install
```

---

## ¿Procedo con la instalación?

Antes de instalar, confirma:

1. ✅ Tienes Python 3.10+
2. ✅ Quieres instalar con `uv` (recomendado) o `pipx`
3. ✅ Entiendes que el código se procesa localmente (sin enviar a APIs)
4. ✅ Quieres commitear los grafos generados al repositorio

**Confirma para proceder con la instalación.**
