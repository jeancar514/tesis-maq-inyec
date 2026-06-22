-- ═══════════════════════════════════════════════════════════════════════════════
-- ESQUEMA NORMALIZADO — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Modelo relacional en 3NF organizado por ELEMENTOS / DISPOSITIVOS.
--
-- Capas:
--   1. Catálogos        : modulo, tipo_dispositivo, unidad, tipo_dato,
--                         severidad_alarma, fase_ciclo
--   2. Dispositivos      : dispositivo (registro genérico) + variable (mapa Modbus)
--                         + especializaciones (servomotor, husillo, molde, zona)
--   3. Series de tiempo  : *_lectura (datos en tiempo real por dispositivo)
--   4. Configuración     : perfil + etapas (inyección/sostenimiento/cierre/
--                         apertura/eyección), zona_calefaccion
--   5. Proceso / KPI     : estado_maquina, ciclo, kpi_lectura, ciclo_fase
--   6. Mantenimiento     : senal_io (+estado), alarma (+evento)
--
-- Todas las sentencias son idempotentes (IF NOT EXISTS) para poder ejecutarse
-- tanto en el arranque del bridge como en /docker-entrypoint-initdb.d.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CATÁLOGOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS modulo (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,          -- inyeccion, cierre, calefaccion...
    nombre      TEXT NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS tipo_dispositivo (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,          -- servomotor, husillo, molde, zona...
    nombre      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS unidad (
    id          SERIAL PRIMARY KEY,
    simbolo     TEXT NOT NULL UNIQUE,          -- RPM, Nm, mm, %, bar, °C...
    nombre      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tipo_dato (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE           -- Boolean, Int16, Int32, Double...
);

CREATE TABLE IF NOT EXISTS severidad_alarma (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,          -- critical, warning, info
    nombre      TEXT NOT NULL,
    nivel       SMALLINT NOT NULL DEFAULT 0    -- orden de gravedad
);

CREATE TABLE IF NOT EXISTS fase_ciclo (
    id          SERIAL PRIMARY KEY,
    orden       SMALLINT NOT NULL UNIQUE,      -- 1..12
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL,
    modulo_id   INTEGER REFERENCES modulo(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DISPOSITIVOS Y VARIABLES (mapa Modbus normalizado)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dispositivo (
    id                  SERIAL PRIMARY KEY,
    modulo_id           INTEGER NOT NULL REFERENCES modulo(id),
    tipo_dispositivo_id INTEGER NOT NULL REFERENCES tipo_dispositivo(id),
    codigo              TEXT NOT NULL UNIQUE,  -- servomotor_1, husillo, molde, zona_1
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

-- Definición de cada variable/registro asociada a un dispositivo (de registers.json)
CREATE TABLE IF NOT EXISTS variable (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    codigo          TEXT NOT NULL,             -- speed, torque, moldTorque...
    descripcion     TEXT,
    unidad_id       INTEGER REFERENCES unidad(id),
    tipo_dato_id    INTEGER REFERENCES tipo_dato(id),
    modbus_tipo     TEXT,                      -- inputRegister, holdingRegister, coil
    modbus_direccion INTEGER,
    factor_escala   DOUBLE PRECISION NOT NULL DEFAULT 1,
    leible          BOOLEAN NOT NULL DEFAULT TRUE,
    escribible      BOOLEAN NOT NULL DEFAULT FALSE,
    es_32bit        BOOLEAN NOT NULL DEFAULT FALSE,
    bit_posicion    TEXT,                      -- low | high (para 32 bit)
    UNIQUE (dispositivo_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_variable_dispositivo ON variable(dispositivo_id);

-- Especialización: servomotor (1:1 con dispositivo). Aquí viven Servomotor 1 y 2.
CREATE TABLE IF NOT EXISTS servomotor (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    eje             TEXT,                      -- inyeccion | cierre
    descripcion     TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SERIES DE TIEMPO (LECTURAS EN TIEMPO REAL)
-- ─────────────────────────────────────────────────────────────────────────────

-- Datos generales comunes a CUALQUIER servomotor (1 y 2). El servomotor se
-- distingue por servomotor_id => sustituye a "tabla servomotor 1 / servomotor 2"
-- de forma normalizada (sin duplicar estructura).
CREATE TABLE IF NOT EXISTS servomotor_lectura (
    id              BIGSERIAL PRIMARY KEY,
    servomotor_id   INTEGER NOT NULL REFERENCES servomotor(id) ON DELETE CASCADE,
    velocidad       DOUBLE PRECISION,          -- RPM
    torque          DOUBLE PRECISION,          -- Nm
    posicion        DOUBLE PRECISION,          -- °
    corriente       DOUBLE PRECISION,          -- A
    voltaje         DOUBLE PRECISION,          -- V
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servo_lectura ON servomotor_lectura(servomotor_id, capturado_en DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONFIGURACIÓN / SETPOINTS POR DISPOSITIVO
-- ─────────────────────────────────────────────────────────────────────────────

-- Control del husillo (setpoints actuales). 1 fila por dispositivo husillo.
CREATE TABLE IF NOT EXISTS husillo_config (
    id                 SERIAL PRIMARY KEY,
    dispositivo_id     INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    control_encendido  INTEGER NOT NULL DEFAULT 0,   -- 0 apagado / 37 encendido
    velocidad_husillo  DOUBLE PRECISION NOT NULL DEFAULT 0, -- RPM
    torque_husillo     DOUBLE PRECISION NOT NULL DEFAULT 0, -- Nm
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Control del molde / cierre (setpoints actuales). 1 fila por dispositivo molde.
CREATE TABLE IF NOT EXISTS molde_config (
    id                  SERIAL PRIMARY KEY,
    dispositivo_id      INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    control_encendido   INTEGER NOT NULL DEFAULT 0,  -- 0 / 37
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0, -- %
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zonas de calefacción del cañón (configuración por zona).
CREATE TABLE IF NOT EXISTS zona_calefaccion (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    nombre          TEXT NOT NULL,
    setpoint        DOUBLE PRECISION NOT NULL DEFAULT 0, -- °C
    tolerancia_sup  DOUBLE PRECISION NOT NULL DEFAULT 0, -- °C
    tolerancia_inf  DOUBLE PRECISION NOT NULL DEFAULT 0, -- °C
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Lecturas en tiempo real de cada zona (PV y salida SSR).
CREATE TABLE IF NOT EXISTS zona_calefaccion_lectura (
    id              BIGSERIAL PRIMARY KEY,
    zona_id         INTEGER NOT NULL REFERENCES zona_calefaccion(id) ON DELETE CASCADE,
    temperatura_pv  DOUBLE PRECISION,          -- °C (valor real)
    salida_ssr      DOUBLE PRECISION,          -- %
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zona_lectura ON zona_calefaccion_lectura(zona_id, capturado_en DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PERFIL (RECETA) Y ETAPAS DE PROCESO
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS perfil (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Etapas de inyección: punto de inicio + velocidad.
CREATE TABLE IF NOT EXISTS etapa_inyeccion (
    id            SERIAL PRIMARY KEY,
    perfil_id     INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden         SMALLINT NOT NULL,
    punto_inicio  DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    velocidad     DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    UNIQUE (perfil_id, orden)
);

-- Etapas de sostenimiento / compactación.
CREATE TABLE IF NOT EXISTS etapa_sostenimiento (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    presion     DOUBLE PRECISION NOT NULL DEFAULT 0, -- bar
    tiempo      DOUBLE PRECISION NOT NULL DEFAULT 0, -- s
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    UNIQUE (perfil_id, orden)
);

-- Etapas de cierre del molde.
CREATE TABLE IF NOT EXISTS etapa_cierre (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    inicio      DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    torque_max  DOUBLE PRECISION NOT NULL DEFAULT 0, -- %
    UNIQUE (perfil_id, orden)
);

-- Etapas de apertura del molde.
CREATE TABLE IF NOT EXISTS etapa_apertura (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    aceleracion DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s²
    UNIQUE (perfil_id, orden)
);

-- Etapas de eyección / expulsor.
CREATE TABLE IF NOT EXISTS etapa_eyeccion (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0, -- mm/s
    UNIQUE (perfil_id, orden)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PROCESO / KPI / CICLO
-- ─────────────────────────────────────────────────────────────────────────────

-- Estado global de la máquina (modo de operación + comando de ciclo). 1 fila.
CREATE TABLE IF NOT EXISTS estado_maquina (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    modo_operacion  SMALLINT NOT NULL DEFAULT 1,   -- 1 manual / 2 automatico
    comando_ciclo   TEXT NOT NULL DEFAULT 'stop',  -- start / stop
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cada ejecución de ciclo productivo.
CREATE TABLE IF NOT EXISTS ciclo (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       INTEGER REFERENCES perfil(id),
    inicio          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin             TIMESTAMPTZ,
    tiempo_ciclo    DOUBLE PRECISION,              -- s
    modo_operacion  SMALLINT,
    resultado       TEXT                           -- ok / scrap / abortado
);

-- Snapshots de KPIs en el tiempo.
CREATE TABLE IF NOT EXISTS kpi_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    ciclo_id            BIGINT REFERENCES ciclo(id) ON DELETE SET NULL,
    tiempo_ciclo        DOUBLE PRECISION,          -- s
    conteo_produccion   DOUBLE PRECISION,          -- unidades
    objetivo_produccion DOUBLE PRECISION,          -- unidades
    rendimiento_calidad DOUBLE PRECISION,          -- %
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_lectura_fecha ON kpi_lectura(capturado_en DESC);

-- Ejecución de cada fase dentro de un ciclo (secuencia de proceso).
CREATE TABLE IF NOT EXISTS ciclo_fase (
    id          BIGSERIAL PRIMARY KEY,
    ciclo_id    BIGINT NOT NULL REFERENCES ciclo(id) ON DELETE CASCADE,
    fase_id     INTEGER NOT NULL REFERENCES fase_ciclo(id),
    estado      TEXT NOT NULL DEFAULT 'pendiente', -- completado/activo/pendiente/bloqueado
    duracion    DOUBLE PRECISION,                  -- s
    inicio      TIMESTAMPTZ,
    fin         TIMESTAMPTZ,
    UNIQUE (ciclo_id, fase_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. MANTENIMIENTO: SEÑALES I/O Y ALARMAS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS senal_io (
    id          SERIAL PRIMARY KEY,
    modulo_id   INTEGER REFERENCES modulo(id),
    direccion   TEXT NOT NULL UNIQUE,          -- %IX0.0, %QX0.1
    etiqueta    TEXT NOT NULL,
    es_salida   BOOLEAN NOT NULL DEFAULT FALSE, -- false=entrada (DI), true=salida (DO)
    grupo       TEXT                           -- SEGURIDAD, CIERRE, INYECCION...
);

CREATE TABLE IF NOT EXISTS senal_io_estado (
    id          BIGSERIAL PRIMARY KEY,
    senal_id    INTEGER NOT NULL REFERENCES senal_io(id) ON DELETE CASCADE,
    activo      BOOLEAN NOT NULL,
    capturado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_senal_estado ON senal_io_estado(senal_id, capturado_en DESC);

-- Definición de alarmas.
CREATE TABLE IF NOT EXISTS alarma (
    id              SERIAL PRIMARY KEY,
    codigo          TEXT NOT NULL UNIQUE,      -- ALM_502, ALM_104...
    severidad_id    INTEGER NOT NULL REFERENCES severidad_alarma(id),
    titulo          TEXT NOT NULL,
    descripcion     TEXT,
    modulo_id       INTEGER REFERENCES modulo(id)
);

-- Ocurrencias / historial de alarmas.
CREATE TABLE IF NOT EXISTS alarma_evento (
    id              BIGSERIAL PRIMARY KEY,
    alarma_id       INTEGER NOT NULL REFERENCES alarma(id) ON DELETE CASCADE,
    ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado          TEXT NOT NULL DEFAULT 'active', -- active/acknowledged/resolved
    reconocido_por  TEXT,
    reconocido_en   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alarma_evento ON alarma_evento(alarma_id, ocurrido_en DESC);
