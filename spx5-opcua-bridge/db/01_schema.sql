-- ═══════════════════════════════════════════════════════════════════════════════
-- ESQUEMA NORMALIZADO — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- La base de datos está dividida POR MÓDULOS, en espejo de los módulos de la API
-- del backend (FooterNav). Cada módulo es un esquema de PostgreSQL con sus tablas.
-- El esquema public queda vacío.
--
-- Esquemas:
--   core        : catálogos + mapa de dispositivos/variables + perfil (recetas)
--   dashboard   : estado de máquina, ciclo, KPIs, fases de ciclo
--   clamp       : molde (setpoints + perfiles de cierre/apertura)
--   injection   : husillo/servo (setpoints, lecturas, perfiles inyección/sostenimiento)
--   ejection    : perfil de eyección
--   heating     : zonas de calefacción (config + lecturas)
--   maintenance : señales I/O + alarmas
--
-- Todas las sentencias son idempotentes (IF NOT EXISTS) para poder ejecutarse
-- tanto en el arranque del bridge como en /docker-entrypoint-initdb.d.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Esquemas por módulo + search_path ────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS clamp;
CREATE SCHEMA IF NOT EXISTS injection;
CREATE SCHEMA IF NOT EXISTS ejection;
CREATE SCHEMA IF NOT EXISTS heating;
CREATE SCHEMA IF NOT EXISTS maintenance;

SET search_path = core, dashboard, clamp, injection, ejection, heating, maintenance, public;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CATÁLOGOS (core)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS core.modulo (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS core.tipo_dispositivo (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core.unidad (
    id          SERIAL PRIMARY KEY,
    simbolo     TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core.tipo_dato (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS core.severidad_alarma (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL,
    nivel       SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS core.fase_ciclo (
    id          SERIAL PRIMARY KEY,
    orden       SMALLINT NOT NULL UNIQUE,
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL,
    modulo_id   INTEGER REFERENCES core.modulo(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DISPOSITIVOS Y VARIABLES (core) — mapa Modbus normalizado
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS core.dispositivo (
    id                  SERIAL PRIMARY KEY,
    modulo_id           INTEGER NOT NULL REFERENCES core.modulo(id),
    tipo_dispositivo_id INTEGER NOT NULL REFERENCES core.tipo_dispositivo(id),
    codigo              TEXT NOT NULL UNIQUE,
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS core.variable (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    codigo          TEXT NOT NULL,
    descripcion     TEXT,
    unidad_id       INTEGER REFERENCES core.unidad(id),
    tipo_dato_id    INTEGER REFERENCES core.tipo_dato(id),
    modbus_tipo     TEXT,
    modbus_direccion INTEGER,
    factor_escala   DOUBLE PRECISION NOT NULL DEFAULT 1,
    leible          BOOLEAN NOT NULL DEFAULT TRUE,
    escribible      BOOLEAN NOT NULL DEFAULT FALSE,
    es_32bit        BOOLEAN NOT NULL DEFAULT FALSE,
    bit_posicion    TEXT,
    UNIQUE (dispositivo_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_variable_dispositivo ON core.variable(dispositivo_id);

CREATE TABLE IF NOT EXISTS core.servomotor (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    eje             TEXT,
    descripcion     TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SERIES DE TIEMPO — lecturas servomotor (injection)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS injection.servomotor_lectura (
    id              BIGSERIAL PRIMARY KEY,
    servomotor_id   INTEGER NOT NULL REFERENCES core.servomotor(id) ON DELETE CASCADE,
    velocidad       DOUBLE PRECISION,
    torque          DOUBLE PRECISION,
    posicion        DOUBLE PRECISION,
    corriente       DOUBLE PRECISION,
    voltaje         DOUBLE PRECISION,
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servo_lectura ON injection.servomotor_lectura(servomotor_id, capturado_en DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONFIGURACIÓN / SETPOINTS POR DISPOSITIVO
-- ─────────────────────────────────────────────────────────────────────────────

-- Husillo (injection)
CREATE TABLE IF NOT EXISTS injection.husillo_config (
    id                 SERIAL PRIMARY KEY,
    dispositivo_id     INTEGER NOT NULL UNIQUE REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    control_encendido  INTEGER NOT NULL DEFAULT 0,
    velocidad_husillo  DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_husillo     DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Molde / cierre (clamp)
CREATE TABLE IF NOT EXISTS clamp.molde_config (
    id                  SERIAL PRIMARY KEY,
    dispositivo_id      INTEGER NOT NULL UNIQUE REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    control_encendido   INTEGER NOT NULL DEFAULT 0,
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0,
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zonas de calefacción (heating)
CREATE TABLE IF NOT EXISTS heating.zona_calefaccion (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    nombre          TEXT NOT NULL,
    setpoint        DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_sup  DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_inf  DOUBLE PRECISION NOT NULL DEFAULT 0,
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS heating.zona_calefaccion_lectura (
    id              BIGSERIAL PRIMARY KEY,
    zona_id         INTEGER NOT NULL REFERENCES heating.zona_calefaccion(id) ON DELETE CASCADE,
    temperatura_pv  DOUBLE PRECISION,
    salida_ssr      DOUBLE PRECISION,
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zona_lectura ON heating.zona_calefaccion_lectura(zona_id, capturado_en DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PERFIL (RECETA, core) Y ETAPAS DE PROCESO (por módulo)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS core.perfil (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Etapas de inyección (injection)
CREATE TABLE IF NOT EXISTS injection.etapa_inyeccion (
    id            SERIAL PRIMARY KEY,
    perfil_id     INTEGER NOT NULL REFERENCES core.perfil(id) ON DELETE CASCADE,
    orden         SMALLINT NOT NULL,
    punto_inicio  DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad     DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Etapas de sostenimiento / compactación (injection)
CREATE TABLE IF NOT EXISTS injection.etapa_sostenimiento (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES core.perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    presion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tiempo      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Etapas de cierre del molde (clamp)
CREATE TABLE IF NOT EXISTS clamp.etapa_cierre (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES core.perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    inicio      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_max  DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Etapas de apertura del molde (clamp)
CREATE TABLE IF NOT EXISTS clamp.etapa_apertura (
    id             SERIAL PRIMARY KEY,
    perfil_id      INTEGER NOT NULL REFERENCES core.perfil(id) ON DELETE CASCADE,
    orden          SMALLINT NOT NULL,
    etiqueta       TEXT,
    posicion       DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad      DOUBLE PRECISION NOT NULL DEFAULT 0,
    aceleracion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Etapas de eyección / expulsor (ejection)
CREATE TABLE IF NOT EXISTS ejection.etapa_eyeccion (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES core.perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PROCESO / KPI / CICLO (dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboard.estado_maquina (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES core.dispositivo(id) ON DELETE CASCADE,
    modo_operacion  SMALLINT NOT NULL DEFAULT 1,
    comando_ciclo   TEXT NOT NULL DEFAULT 'stop',
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard.ciclo (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       INTEGER REFERENCES core.perfil(id),
    inicio          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin             TIMESTAMPTZ,
    tiempo_ciclo    DOUBLE PRECISION,
    modo_operacion  SMALLINT,
    resultado       TEXT
);

CREATE TABLE IF NOT EXISTS dashboard.kpi_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    ciclo_id            BIGINT REFERENCES dashboard.ciclo(id) ON DELETE SET NULL,
    tiempo_ciclo        DOUBLE PRECISION,
    conteo_produccion   DOUBLE PRECISION,
    objetivo_produccion DOUBLE PRECISION,
    rendimiento_calidad DOUBLE PRECISION,
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_lectura_fecha ON dashboard.kpi_lectura(capturado_en DESC);

CREATE TABLE IF NOT EXISTS dashboard.ciclo_fase (
    id          BIGSERIAL PRIMARY KEY,
    ciclo_id    BIGINT NOT NULL REFERENCES dashboard.ciclo(id) ON DELETE CASCADE,
    fase_id     INTEGER NOT NULL REFERENCES core.fase_ciclo(id),
    estado      TEXT NOT NULL DEFAULT 'pendiente',
    duracion    DOUBLE PRECISION,
    inicio      TIMESTAMPTZ,
    fin         TIMESTAMPTZ,
    UNIQUE (ciclo_id, fase_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. MANTENIMIENTO: SEÑALES I/O Y ALARMAS (maintenance)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance.senal_io (
    id          SERIAL PRIMARY KEY,
    modulo_id   INTEGER REFERENCES core.modulo(id),
    direccion   TEXT NOT NULL UNIQUE,
    etiqueta    TEXT NOT NULL,
    es_salida   BOOLEAN NOT NULL DEFAULT FALSE,
    grupo       TEXT
);

CREATE TABLE IF NOT EXISTS maintenance.senal_io_estado (
    id          BIGSERIAL PRIMARY KEY,
    senal_id    INTEGER NOT NULL REFERENCES maintenance.senal_io(id) ON DELETE CASCADE,
    activo      BOOLEAN NOT NULL,
    capturado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_senal_estado ON maintenance.senal_io_estado(senal_id, capturado_en DESC);

CREATE TABLE IF NOT EXISTS maintenance.alarma (
    id              SERIAL PRIMARY KEY,
    codigo          TEXT NOT NULL UNIQUE,
    severidad_id    INTEGER NOT NULL REFERENCES core.severidad_alarma(id),
    titulo          TEXT NOT NULL,
    descripcion     TEXT,
    modulo_id       INTEGER REFERENCES core.modulo(id)
);

CREATE TABLE IF NOT EXISTS maintenance.alarma_evento (
    id              BIGSERIAL PRIMARY KEY,
    alarma_id       INTEGER NOT NULL REFERENCES maintenance.alarma(id) ON DELETE CASCADE,
    ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado          TEXT NOT NULL DEFAULT 'active',
    reconocido_por  TEXT,
    reconocido_en   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alarma_evento ON maintenance.alarma_evento(alarma_id, ocurrido_en DESC);
