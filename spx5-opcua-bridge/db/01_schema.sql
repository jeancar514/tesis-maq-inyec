-- ═══════════════════════════════════════════════════════════════════════════════
-- ESQUEMA SIMPLIFICADO — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Todas las tablas viven en el esquema `public`.
-- Se agrupan por módulo usando un PREFIJO DE 3 LETRAS en el nombre:
--
--   (sin prefijo) : datos compartidos (dispositivo, servomotor, perfil, fase_ciclo)
--   gen_          : Dashboard General (KPIs, modo operación, comando ciclo, ciclo)
--   inj_          : Inyección (servomotor lecturas, husillo, etapas inyección/sostenimiento)
--   clp_          : Cierre / Molde (config molde, etapas cierre/apertura)
--   ejc_          : Eyección (etapas eyección)
--   hea_          : Calefacción (zonas + lecturas)
--   mnt_          : Mantenimiento (señales I/O, alarmas)
--
-- Idempotente: IF NOT EXISTS en todo.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DATOS COMPARTIDOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dispositivo (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    nombre      TEXT NOT NULL,
    tipo        TEXT NOT NULL DEFAULT 'maquina',
    modulo      TEXT,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS servomotor (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    eje             TEXT,
    descripcion     TEXT
);

CREATE TABLE IF NOT EXISTS fase_ciclo (
    id      SERIAL PRIMARY KEY,
    orden   SMALLINT NOT NULL UNIQUE,
    codigo  TEXT NOT NULL UNIQUE,
    nombre  TEXT NOT NULL,
    modulo  TEXT
);

CREATE TABLE IF NOT EXISTS perfil (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. gen_ — DASHBOARD GENERAL (KPIs, modo operación, comando ciclo)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gen_modo_operacion (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    modo            SMALLINT NOT NULL DEFAULT 1,  -- 1: manual, 2: automático
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gen_comando_ciclo (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    comando         TEXT NOT NULL DEFAULT 'stop',  -- 'start' | 'stop'
    activa          BOOLEAN NOT NULL DEFAULT FALSE,
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gen_ciclo (
    id              BIGSERIAL PRIMARY KEY,
    perfil_id       INTEGER REFERENCES perfil(id),
    inicio          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin             TIMESTAMPTZ,
    tiempo_ciclo    DOUBLE PRECISION,
    modo_operacion  SMALLINT,
    resultado       TEXT
);

CREATE TABLE IF NOT EXISTS gen_kpi_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    tiempo_ciclo        DOUBLE PRECISION,
    conteo_produccion   DOUBLE PRECISION,
    objetivo_produccion DOUBLE PRECISION,
    rendimiento_calidad DOUBLE PRECISION,
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_kpi_lectura_fecha ON gen_kpi_lectura(capturado_en DESC);

CREATE TABLE IF NOT EXISTS gen_ciclo_fase (
    id          BIGSERIAL PRIMARY KEY,
    ciclo_id    BIGINT NOT NULL REFERENCES gen_ciclo(id) ON DELETE CASCADE,
    fase_id     INTEGER NOT NULL REFERENCES fase_ciclo(id),
    estado      TEXT NOT NULL DEFAULT 'pendiente',
    duracion    DOUBLE PRECISION,
    inicio      TIMESTAMPTZ,
    fin         TIMESTAMPTZ,
    UNIQUE (ciclo_id, fase_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. inj_ — INYECCIÓN (servomotor lecturas, husillo, etapas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inj_servomotor_lectura (
    id              BIGSERIAL PRIMARY KEY,
    servomotor_id   INTEGER NOT NULL REFERENCES servomotor(id) ON DELETE CASCADE,
    velocidad       DOUBLE PRECISION,
    torque          DOUBLE PRECISION,
    posicion        DOUBLE PRECISION,
    corriente       DOUBLE PRECISION,
    voltaje         DOUBLE PRECISION,
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inj_servo_lectura ON inj_servomotor_lectura(servomotor_id, capturado_en DESC);

CREATE TABLE IF NOT EXISTS inj_husillo_config (
    id                 SERIAL PRIMARY KEY,
    dispositivo_id     INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    control_encendido  INTEGER NOT NULL DEFAULT 0,
    velocidad_husillo  DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_husillo     DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inj_etapa_inyeccion (
    id            SERIAL PRIMARY KEY,
    perfil_id     INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden         SMALLINT NOT NULL,
    punto_inicio  DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad     DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

CREATE TABLE IF NOT EXISTS inj_etapa_sostenimiento (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    presion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tiempo      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. clp_ — CIERRE / MOLDE (config + etapas cierre/apertura)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clp_molde_config (
    id                  SERIAL PRIMARY KEY,
    dispositivo_id      INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    control_encendido   INTEGER NOT NULL DEFAULT 0,
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0,
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clp_etapa_cierre (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    inicio      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_max  DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

CREATE TABLE IF NOT EXISTS clp_etapa_apertura (
    id             SERIAL PRIMARY KEY,
    perfil_id      INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden          SMALLINT NOT NULL,
    etiqueta       TEXT,
    posicion       DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad      DOUBLE PRECISION NOT NULL DEFAULT 0,
    aceleracion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ejc_ — EYECCIÓN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ejc_etapa_eyeccion (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. hea_ — CALEFACCIÓN (zonas + lecturas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hea_zona_calefaccion (
    id              SERIAL PRIMARY KEY,
    dispositivo_id  INTEGER NOT NULL UNIQUE REFERENCES dispositivo(id) ON DELETE CASCADE,
    nombre          TEXT NOT NULL,
    setpoint        DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_sup  DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_inf  DOUBLE PRECISION NOT NULL DEFAULT 0,
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS hea_zona_lectura (
    id              BIGSERIAL PRIMARY KEY,
    zona_id         INTEGER NOT NULL REFERENCES hea_zona_calefaccion(id) ON DELETE CASCADE,
    temperatura_pv  DOUBLE PRECISION,
    salida_ssr      DOUBLE PRECISION,
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hea_zona_lectura ON hea_zona_lectura(zona_id, capturado_en DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. mnt_ — MANTENIMIENTO (señales I/O + alarmas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mnt_senal_io (
    id          SERIAL PRIMARY KEY,
    modulo      TEXT,
    direccion   TEXT NOT NULL UNIQUE,
    etiqueta    TEXT NOT NULL,
    es_salida   BOOLEAN NOT NULL DEFAULT FALSE,
    grupo       TEXT
);

CREATE TABLE IF NOT EXISTS mnt_senal_io_estado (
    id           BIGSERIAL PRIMARY KEY,
    senal_id     INTEGER NOT NULL REFERENCES mnt_senal_io(id) ON DELETE CASCADE,
    activo       BOOLEAN NOT NULL,
    capturado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mnt_senal_estado ON mnt_senal_io_estado(senal_id, capturado_en DESC);

CREATE TABLE IF NOT EXISTS mnt_alarma (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    severidad   TEXT NOT NULL DEFAULT 'info',  -- 'critical' | 'warning' | 'info'
    titulo      TEXT NOT NULL,
    descripcion TEXT,
    modulo      TEXT
);

CREATE TABLE IF NOT EXISTS mnt_alarma_evento (
    id              BIGSERIAL PRIMARY KEY,
    alarma_id       INTEGER NOT NULL REFERENCES mnt_alarma(id) ON DELETE CASCADE,
    ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado          TEXT NOT NULL DEFAULT 'active',
    reconocido_por  TEXT,
    reconocido_en   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mnt_alarma_evento ON mnt_alarma_evento(alarma_id, ocurrido_en DESC);
