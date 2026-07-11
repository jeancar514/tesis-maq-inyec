-- ═══════════════════════════════════════════════════════════════════════════════
-- ESQUEMA — MÁQUINA DE INYECCIÓN (SPX5)
-- ═══════════════════════════════════════════════════════════════════════════════
-- CONVENCIÓN:
--   * ESQUEMA  = módulo del FooterNav (nombre completo de la ruta):
--       dashboard | clamp | injection | ejection | heating | maintenance
--     (+ public para la receta compartida)
--   * TABLA     = <cod3>_<nombre>, donde <cod3> es un código de 3 letras que indica
--     a qué SECCIÓN del Sidebar pertenece la tabla:
--       vgn = Vista General      cie = Perfil de Cierre     ape = Perfil de Apertura
--       gen = General (inyección) hus = Husillo              iny = Perfil de Inyección
--       pey = Perfil de Eyección  zon = Zonas del Cilindro   iom = Monitor I/O
--       ala = Historial de Alarmas  rec = Gestión de Recetas
--
-- Diseño plano y con pocas relaciones:
--   * La máquina es única → configuraciones = tablas de UNA sola fila (id = 1).
--   * Las lecturas identifican su origen con un código de texto (no con FK).
--   * Solo se conservan FK con valor: etapas→rec_perfil, lecturas de zona,
--     estados de señal y eventos de alarma.
--
-- Idempotente: IF NOT EXISTS en todo.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS clamp;
CREATE SCHEMA IF NOT EXISTS injection;
CREATE SCHEMA IF NOT EXISTS ejection;
CREATE SCHEMA IF NOT EXISTS heating;
CREATE SCHEMA IF NOT EXISTS recipes;

-- ─────────────────────────────────────────────────────────────────────────────
-- recipes — Gestión de Recetas (perfil compartido por los perfiles de cada módulo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes.rec_perfil (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- dashboard — MAESTROS DE VALORES (catálogos de valores predeterminados) · cat_*
-- Definen los valores válidos que pueden tomar las columnas de estado/modo/etc.
-- Se referencian por FK desde las tablas operativas para forzar valores válidos.
-- ─────────────────────────────────────────────────────────────────────────────

-- Modo de operación: 1 = manual, 2 = automático
CREATE TABLE IF NOT EXISTS dashboard.cat_modo_operacion (
    codigo      SMALLINT PRIMARY KEY,
    etiqueta    TEXT NOT NULL,
    descripcion TEXT
);

-- Valor textual del modo: 'activo' | 'inactivo'
CREATE TABLE IF NOT EXISTS dashboard.cat_valor_modo (
    codigo   TEXT PRIMARY KEY,
    etiqueta TEXT NOT NULL
);

-- Comando de ciclo: 'start' | 'stop'
CREATE TABLE IF NOT EXISTS dashboard.cat_comando_ciclo (
    codigo   TEXT PRIMARY KEY,
    etiqueta TEXT NOT NULL
);

-- Estado de activación (booleano): true = activa, false = inactiva
CREATE TABLE IF NOT EXISTS dashboard.cat_activacion (
    codigo   BOOLEAN PRIMARY KEY,
    etiqueta TEXT NOT NULL
);

-- Estado de una fase del ciclo: 'completado' | 'activo' | 'pendiente' | 'bloqueado'
CREATE TABLE IF NOT EXISTS dashboard.cat_estado_fase (
    codigo   TEXT PRIMARY KEY,
    etiqueta TEXT NOT NULL,
    orden    SMALLINT NOT NULL DEFAULT 0,
    color    TEXT
);

-- ═════════════════════════════════════════════════════════════════════════════
-- dashboard — FooterNav "General"
-- ═════════════════════════════════════════════════════════════════════════════

-- Vista General · modo de operación (fila única: id = 1) → 1: manual, 2: automático
-- `valor` = estado textual del modo: 'activo' (automático) | 'inactivo' (manual)
CREATE TABLE IF NOT EXISTS dashboard.vgn_modo_operacion (
    id             SMALLINT PRIMARY KEY DEFAULT 1,
    modo           SMALLINT NOT NULL DEFAULT 1 REFERENCES dashboard.cat_modo_operacion(codigo),
    valor          TEXT NOT NULL DEFAULT 'inactivo' REFERENCES dashboard.cat_valor_modo(codigo),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista General · comando de ciclo (fila única: id = 1) → 'start' | 'stop'
CREATE TABLE IF NOT EXISTS dashboard.vgn_comando_ciclo (
    id             SMALLINT PRIMARY KEY DEFAULT 1,
    comando        TEXT NOT NULL DEFAULT 'stop' REFERENCES dashboard.cat_comando_ciclo(codigo),
    activa         BOOLEAN NOT NULL DEFAULT FALSE REFERENCES dashboard.cat_activacion(codigo),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista General · KPIs (histórico de snapshots)
CREATE TABLE IF NOT EXISTS dashboard.vgn_kpi_lectura (
    id                  BIGSERIAL PRIMARY KEY,
    tiempo_ciclo        DOUBLE PRECISION,
    conteo_produccion   DOUBLE PRECISION,
    objetivo_produccion DOUBLE PRECISION,
    rendimiento_calidad DOUBLE PRECISION,
    capturado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_vgn_kpi_fecha ON dashboard.vgn_kpi_lectura(capturado_en DESC);

-- Ciclo de Pasos · secuencia de fases del ciclo (12 pasos) + estado en vivo
-- estado: 'completado' | 'activo' | 'pendiente' | 'bloqueado'
CREATE TABLE IF NOT EXISTS dashboard.cip_fase (
    id             SERIAL PRIMARY KEY,
    orden          SMALLINT NOT NULL UNIQUE,
    nombre         TEXT NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'pendiente' REFERENCES dashboard.cat_estado_fase(codigo),
    duracion       DOUBLE PRECISION NOT NULL DEFAULT 0,   -- segundos
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monitor de Tiempo · tiempo programado vs real por fase
CREATE TABLE IF NOT EXISTS dashboard.mdt_fase_tiempo (
    id                 SERIAL PRIMARY KEY,
    orden              SMALLINT NOT NULL UNIQUE,
    nombre             TEXT NOT NULL,
    tiempo_programado  DOUBLE PRECISION NOT NULL DEFAULT 0,   -- segundos
    tiempo_real        DOUBLE PRECISION NOT NULL DEFAULT 0,   -- segundos
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- clamp — FooterNav "Molde"
-- ═════════════════════════════════════════════════════════════════════════════

-- Vista General · setpoints del molde (fila única: id = 1)
CREATE TABLE IF NOT EXISTS clamp.vgn_molde_config (
    id                  SMALLINT PRIMARY KEY DEFAULT 1,
    control_encendido   INTEGER NOT NULL DEFAULT 0,
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0,
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista General · lecturas del servomotor de cierre/molde (eje único: servomotor_2)
CREATE TABLE IF NOT EXISTS clamp.vgn_servomotor_lectura (
    id            BIGSERIAL PRIMARY KEY,
    velocidad     DOUBLE PRECISION,
    torque        DOUBLE PRECISION,
    posicion      DOUBLE PRECISION,
    corriente     DOUBLE PRECISION,
    voltaje       DOUBLE PRECISION,
    capturado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clamp_vgn_servo_fecha ON clamp.vgn_servomotor_lectura(capturado_en DESC);

-- Perfil de Cierre · etapas
CREATE TABLE IF NOT EXISTS clamp.cie_etapa_cierre (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES recipes.rec_perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    inicio      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_max  DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Perfil de Apertura · etapas
CREATE TABLE IF NOT EXISTS clamp.ape_etapa_apertura (
    id             SERIAL PRIMARY KEY,
    perfil_id      INTEGER NOT NULL REFERENCES recipes.rec_perfil(id) ON DELETE CASCADE,
    orden          SMALLINT NOT NULL,
    etiqueta       TEXT,
    posicion       DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad      DOUBLE PRECISION NOT NULL DEFAULT 0,
    aceleracion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- injection — FooterNav "Inyección"
-- ═════════════════════════════════════════════════════════════════════════════

-- General · lecturas del servomotor de inyección (eje único: servomotor_1)
CREATE TABLE IF NOT EXISTS injection.gen_servomotor_lectura (
    id            BIGSERIAL PRIMARY KEY,
    velocidad     DOUBLE PRECISION,
    torque        DOUBLE PRECISION,
    posicion      DOUBLE PRECISION,
    corriente     DOUBLE PRECISION,
    voltaje       DOUBLE PRECISION,
    capturado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injection_gen_servo_fecha ON injection.gen_servomotor_lectura(capturado_en DESC);

-- Husillo · setpoints (fila única: id = 1)
CREATE TABLE IF NOT EXISTS injection.hus_husillo_config (
    id                 SMALLINT PRIMARY KEY DEFAULT 1,
    control_encendido  INTEGER NOT NULL DEFAULT 0,
    velocidad_husillo  DOUBLE PRECISION NOT NULL DEFAULT 0,
    torque_husillo     DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil de Inyección · etapas
CREATE TABLE IF NOT EXISTS injection.iny_etapa_inyeccion (
    id            SERIAL PRIMARY KEY,
    perfil_id     INTEGER NOT NULL REFERENCES recipes.rec_perfil(id) ON DELETE CASCADE,
    orden         SMALLINT NOT NULL,
    punto_inicio  DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad     DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Husillo · etapas de sostenimiento (ruta /injection/holding)
CREATE TABLE IF NOT EXISTS injection.hus_etapa_sostenimiento (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES recipes.rec_perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    presion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    tiempo      DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- Carro de Inyección · setpoints (fila única: id = 1)
CREATE TABLE IF NOT EXISTS injection.car_carro_config (
    id                  SMALLINT PRIMARY KEY DEFAULT 1,
    control_encendido   INTEGER NOT NULL DEFAULT 0,
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0,
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- ejection — FooterNav "Eyección"
-- ═════════════════════════════════════════════════════════════════════════════

-- Eyector · setpoints (fila única: id = 1)
CREATE TABLE IF NOT EXISTS ejection.eyc_eyector_config (
    id                  SMALLINT PRIMARY KEY DEFAULT 1,
    control_encendido   INTEGER NOT NULL DEFAULT 0,
    torque              DOUBLE PRECISION NOT NULL DEFAULT 0,
    cambio_posicion     DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion1           DOUBLE PRECISION NOT NULL DEFAULT 0,
    posicion2           DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad_posicion  DOUBLE PRECISION NOT NULL DEFAULT 0,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil de Eyección · etapas
CREATE TABLE IF NOT EXISTS ejection.pey_etapa_eyeccion (
    id          SERIAL PRIMARY KEY,
    perfil_id   INTEGER NOT NULL REFERENCES recipes.rec_perfil(id) ON DELETE CASCADE,
    orden       SMALLINT NOT NULL,
    etiqueta    TEXT,
    posicion    DOUBLE PRECISION NOT NULL DEFAULT 0,
    velocidad   DOUBLE PRECISION NOT NULL DEFAULT 0,
    UNIQUE (perfil_id, orden)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- heating — FooterNav "Temp."
-- ═════════════════════════════════════════════════════════════════════════════

-- Zonas del Cilindro · definición de zonas
CREATE TABLE IF NOT EXISTS heating.zon_zona_calefaccion (
    id              SERIAL PRIMARY KEY,
    codigo          TEXT NOT NULL UNIQUE,       -- p.ej. 'zona_1' .. 'zona_5'
    nombre          TEXT NOT NULL,
    setpoint        DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_sup  DOUBLE PRECISION NOT NULL DEFAULT 0,
    tolerancia_inf  DOUBLE PRECISION NOT NULL DEFAULT 0,
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Zonas del Cilindro · lecturas en tiempo real
CREATE TABLE IF NOT EXISTS heating.zon_zona_lectura (
    id              BIGSERIAL PRIMARY KEY,
    zona_id         INTEGER NOT NULL REFERENCES heating.zon_zona_calefaccion(id) ON DELETE CASCADE,
    temperatura_pv  DOUBLE PRECISION,
    salida_ssr      DOUBLE PRECISION,
    capturado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heating_zon_lectura ON heating.zon_zona_lectura(zona_id, capturado_en DESC);

-- Nota: el módulo "Configuración/Mantenimiento" (Monitor I/O, Historial de Alarmas)
-- se gestiona en el frontend vía registerManager (registers.json), sin tablas propias.
