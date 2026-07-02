const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USER     || 'tesis',
    password: process.env.DB_PASSWORD || 'tesis',
    database: process.env.DB_NAME     || 'postgres',
    // Esquemas por módulo (espejo de los módulos del backend). Todas las tablas
    // viven en estos esquemas; el esquema public queda vacío. El search_path
    // permite seguir usando nombres de tabla sin calificar.
    options: `-c search_path=${process.env.DB_SEARCH_PATH || 'core,dashboard,clamp,injection,ejection,heating,maintenance,public'}`,
});

pool.on('error', (err) => logger.error(`PostgreSQL pool error: ${err.message}`));

const DB_DIR = path.resolve(__dirname, '../../db');

// Cache de ids de dispositivo por código para no consultarlos en cada inserción
const _dispositivoCache = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DEL ESQUEMA NORMALIZADO
// ─────────────────────────────────────────────────────────────────────────────
// Ejecuta los scripts SQL idempotentes (01_schema.sql + 02_seed.sql). Funciona
// tanto si la DB se creó vacía como si ya existían las tablas.
async function initSchema() {
    const files = ['01_schema.sql', '02_seed.sql'];
    for (const file of files) {
        const fullPath = path.join(DB_DIR, file);
        if (!fs.existsSync(fullPath)) {
            logger.warn(`Script SQL no encontrado: ${fullPath}`);
            continue;
        }
        const sql = fs.readFileSync(fullPath, 'utf8');
        await pool.query(sql);
        logger.info(`Script SQL ejecutado: ${file}`);
    }
    logger.info('Esquema normalizado listo en PostgreSQL');
}

// Compatibilidad con el arranque anterior (protocolBridge llamaba initTable).
async function initTable() {
    await initSchema();
}

async function getDispositivoId(codigo) {
    if (_dispositivoCache.has(codigo)) return _dispositivoCache.get(codigo);
    const { rows } = await pool.query('SELECT id FROM dispositivo WHERE codigo = $1', [codigo]);
    if (!rows.length) return null;
    _dispositivoCache.set(codigo, rows[0].id);
    return rows[0].id;
}

async function getServomotorId(codigoDispositivo) {
    const { rows } = await pool.query(
        `SELECT s.id FROM servomotor s
         JOIN dispositivo d ON d.id = s.dispositivo_id
         WHERE d.codigo = $1`,
        [codigoDispositivo]
    );
    return rows.length ? rows[0].id : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVOMOTOR — lecturas en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
async function insertServoLectura(codigoDispositivo, v) {
    const servoId = await getServomotorId(codigoDispositivo);
    if (!servoId) {
        logger.warn(`Servomotor no encontrado: ${codigoDispositivo}`);
        return;
    }
    await pool.query(
        `INSERT INTO servomotor_lectura (servomotor_id, velocidad, torque, posicion, corriente, voltaje)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [servoId, v.velocidad ?? null, v.torque ?? null, v.posicion ?? null, v.corriente ?? null, v.voltaje ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPIs — snapshots
// ─────────────────────────────────────────────────────────────────────────────
async function insertKpiLectura(v) {
    await pool.query(
        `INSERT INTO kpi_lectura (tiempo_ciclo, conteo_produccion, objetivo_produccion, rendimiento_calidad)
         VALUES ($1, $2, $3, $4)`,
        [v.tiempoCiclo ?? null, v.conteoProduccion ?? null, v.objetivoProduccion ?? null, v.rendimientoCalidad ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUSILLO — setpoints (upsert por dispositivo)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertHusilloConfig(codigoDispositivo, v) {
    const dispId = await getDispositivoId(codigoDispositivo);
    if (!dispId) return;
    await pool.query(
        `INSERT INTO husillo_config (dispositivo_id, control_encendido, velocidad_husillo, torque_husillo, actualizado_en)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (dispositivo_id) DO UPDATE SET
            control_encendido = EXCLUDED.control_encendido,
            velocidad_husillo = EXCLUDED.velocidad_husillo,
            torque_husillo    = EXCLUDED.torque_husillo,
            actualizado_en    = NOW()`,
        [dispId, v.controlEncendido ?? 0, v.velocidadHusillo ?? 0, v.torqueHusillo ?? 0]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOLDE — setpoints (upsert por dispositivo)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertMoldeConfig(codigoDispositivo, v) {
    const dispId = await getDispositivoId(codigoDispositivo);
    if (!dispId) return;
    await pool.query(
        `INSERT INTO molde_config
            (dispositivo_id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (dispositivo_id) DO UPDATE SET
            control_encendido  = EXCLUDED.control_encendido,
            torque             = EXCLUDED.torque,
            cambio_posicion    = EXCLUDED.cambio_posicion,
            posicion1          = EXCLUDED.posicion1,
            posicion2          = EXCLUDED.posicion2,
            velocidad_posicion = EXCLUDED.velocidad_posicion,
            actualizado_en     = NOW()`,
        [dispId, v.controlEncendido ?? 0, v.torque ?? 0, v.cambioPosicion ?? 0,
         v.posicion1 ?? 0, v.posicion2 ?? 0, v.velocidadPosicion ?? 0]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DE LA MÁQUINA — modo de operación + comando de ciclo
// ─────────────────────────────────────────────────────────────────────────────
async function upsertEstadoMaquina(v) {
    const dispId = await getDispositivoId('maquina');
    if (!dispId) return;
    await pool.query(
        `INSERT INTO estado_maquina (dispositivo_id, modo_operacion, comando_ciclo, actualizado_en)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (dispositivo_id) DO UPDATE SET
            modo_operacion = COALESCE(EXCLUDED.modo_operacion, estado_maquina.modo_operacion),
            comando_ciclo  = COALESCE(EXCLUDED.comando_ciclo, estado_maquina.comando_ciclo),
            actualizado_en = NOW()`,
        [dispId, v.modoOperacion ?? null, v.comandoCiclo ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONA DE CALEFACCIÓN — lecturas en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
async function insertZonaLectura(codigoDispositivo, v) {
    const { rows } = await pool.query(
        `SELECT z.id FROM zona_calefaccion z
         JOIN dispositivo d ON d.id = z.dispositivo_id
         WHERE d.codigo = $1`,
        [codigoDispositivo]
    );
    if (!rows.length) return;
    await pool.query(
        `INSERT INTO zona_calefaccion_lectura (zona_id, temperatura_pv, salida_ssr)
         VALUES ($1, $2, $3)`,
        [rows[0].id, v.temperaturaPv ?? null, v.salidaSsr ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOLDE — lectura de setpoints (para modo de origen de datos = 'db')
// ─────────────────────────────────────────────────────────────────────────────
async function getMoldeConfig(codigoDispositivo = 'molde') {
    const { rows } = await pool.query(
        `SELECT control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion
         FROM molde_config mc JOIN dispositivo d ON d.id = mc.dispositivo_id
         WHERE d.codigo = $1`,
        [codigoDispositivo]
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        moldControlEncendido:  Number(r.control_encendido) || 0,
        moldTorque:            Number(r.torque) || 0,
        moldCambioPosicion:    Number(r.cambio_posicion) || 0,
        moldPosicion1:         Number(r.posicion1) || 0,
        moldPosicion2:         Number(r.posicion2) || 0,
        moldVelocidadPosicion: Number(r.velocidad_posicion) || 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFILES DEL MOLDE — etapas de cierre y apertura (lectura/escritura en DB)
// ─────────────────────────────────────────────────────────────────────────────
async function getActivePerfilId() {
    const { rows } = await pool.query(
        `SELECT id FROM perfil WHERE activo = TRUE ORDER BY id LIMIT 1`
    );
    if (rows.length) return rows[0].id;
    const any = await pool.query(`SELECT id FROM perfil ORDER BY id LIMIT 1`);
    return any.rows.length ? any.rows[0].id : null;
}

async function getClosingProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, etiqueta, inicio, velocidad, torque_max
         FROM etapa_cierre WHERE perfil_id = $1 ORDER BY orden`,
        [perfilId]
    );
    return rows.map(r => ({
        orden:     r.orden,
        etiqueta:  r.etiqueta,
        inicio:    Number(r.inicio) || 0,
        velocidad: Number(r.velocidad) || 0,
        torqueMax: Number(r.torque_max) || 0,
    }));
}

async function saveClosingProfile(stages) {
    const perfilId = await getActivePerfilId();
    if (!perfilId) throw new Error('No hay perfil activo en la base de datos');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const s of stages) {
            await client.query(
                `INSERT INTO etapa_cierre
                    (perfil_id, orden, etiqueta, inicio, velocidad, torque_max)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (perfil_id, orden) DO UPDATE SET
                    etiqueta    = EXCLUDED.etiqueta,
                    inicio      = EXCLUDED.inicio,
                    velocidad   = EXCLUDED.velocidad,
                    torque_max  = EXCLUDED.torque_max`,
                [perfilId, s.orden, s.etiqueta ?? null, s.inicio ?? 0, s.velocidad ?? 0, s.torqueMax ?? 0]
            );
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    return getClosingProfile();
}

async function getOpeningProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, etiqueta, posicion, velocidad, aceleracion
         FROM etapa_apertura WHERE perfil_id = $1 ORDER BY orden`,
        [perfilId]
    );
    return rows.map(r => ({
        orden:       r.orden,
        etiqueta:    r.etiqueta,
        posicion:    Number(r.posicion) || 0,
        velocidad:   Number(r.velocidad) || 0,
        aceleracion: Number(r.aceleracion) || 0,
    }));
}

async function saveOpeningProfile(stages) {
    const perfilId = await getActivePerfilId();
    if (!perfilId) throw new Error('No hay perfil activo en la base de datos');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const s of stages) {
            await client.query(
                `INSERT INTO etapa_apertura
                    (perfil_id, orden, etiqueta, posicion, velocidad, aceleracion)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (perfil_id, orden) DO UPDATE SET
                    etiqueta    = EXCLUDED.etiqueta,
                    posicion    = EXCLUDED.posicion,
                    velocidad   = EXCLUDED.velocidad,
                    aceleracion = EXCLUDED.aceleracion`,
                [perfilId, s.orden, s.etiqueta ?? null, s.posicion ?? 0, s.velocidad ?? 0, s.aceleracion ?? 0]
            );
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    return getOpeningProfile();
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL DE INYECCIÓN — etapa_inyeccion
// ─────────────────────────────────────────────────────────────────────────────
async function getInjectionProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, punto_inicio, velocidad
         FROM etapa_inyeccion WHERE perfil_id = $1 ORDER BY orden`,
        [perfilId]
    );
    return rows.map(r => ({
        orden:       r.orden,
        puntoInicio: Number(r.punto_inicio) || 0,
        velocidad:   Number(r.velocidad) || 0,
    }));
}

async function saveInjectionProfile(stages) {
    const perfilId = await getActivePerfilId();
    if (!perfilId) throw new Error('No hay perfil activo en la base de datos');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const s of stages) {
            await client.query(
                `INSERT INTO etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad)
                 VALUES ($1,$2,$3,$4)
                 ON CONFLICT (perfil_id, orden) DO UPDATE SET
                    punto_inicio = EXCLUDED.punto_inicio,
                    velocidad    = EXCLUDED.velocidad`,
                [perfilId, s.orden, s.puntoInicio ?? 0, s.velocidad ?? 0]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getInjectionProfile();
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL DE SOSTENIMIENTO / COMPACTACIÓN — etapa_sostenimiento
// ─────────────────────────────────────────────────────────────────────────────
async function getHoldingProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, presion, tiempo, velocidad, posicion
         FROM etapa_sostenimiento WHERE perfil_id = $1 ORDER BY orden`,
        [perfilId]
    );
    return rows.map(r => ({
        orden:     r.orden,
        presion:   Number(r.presion) || 0,
        tiempo:    Number(r.tiempo) || 0,
        velocidad: Number(r.velocidad) || 0,
        posicion:  Number(r.posicion) || 0,
    }));
}

async function saveHoldingProfile(stages) {
    const perfilId = await getActivePerfilId();
    if (!perfilId) throw new Error('No hay perfil activo en la base de datos');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const s of stages) {
            await client.query(
                `INSERT INTO etapa_sostenimiento (perfil_id, orden, presion, tiempo, velocidad, posicion)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (perfil_id, orden) DO UPDATE SET
                    presion   = EXCLUDED.presion,
                    tiempo    = EXCLUDED.tiempo,
                    velocidad = EXCLUDED.velocidad,
                    posicion  = EXCLUDED.posicion`,
                [perfilId, s.orden, s.presion ?? 0, s.tiempo ?? 0, s.velocidad ?? 0, s.posicion ?? 0]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getHoldingProfile();
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFIL DE EYECCIÓN — etapa_eyeccion
// ─────────────────────────────────────────────────────────────────────────────
async function getEjectionProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, etiqueta, posicion, velocidad
         FROM etapa_eyeccion WHERE perfil_id = $1 ORDER BY orden`,
        [perfilId]
    );
    return rows.map(r => ({
        orden:     r.orden,
        etiqueta:  r.etiqueta,
        posicion:  Number(r.posicion) || 0,
        velocidad: Number(r.velocidad) || 0,
    }));
}

async function saveEjectionProfile(stages) {
    const perfilId = await getActivePerfilId();
    if (!perfilId) throw new Error('No hay perfil activo en la base de datos');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const s of stages) {
            await client.query(
                `INSERT INTO etapa_eyeccion (perfil_id, orden, etiqueta, posicion, velocidad)
                 VALUES ($1,$2,$3,$4,$5)
                 ON CONFLICT (perfil_id, orden) DO UPDATE SET
                    etiqueta  = EXCLUDED.etiqueta,
                    posicion  = EXCLUDED.posicion,
                    velocidad = EXCLUDED.velocidad`,
                [perfilId, s.orden, s.etiqueta ?? null, s.posicion ?? 0, s.velocidad ?? 0]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getEjectionProfile();
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONAS DE CALEFACCIÓN — setpoints/tolerancias (zona_calefaccion)
// ─────────────────────────────────────────────────────────────────────────────
async function getHeatingZones() {
    const { rows } = await pool.query(
        `SELECT id, nombre, setpoint, tolerancia_sup, tolerancia_inf, activa
         FROM zona_calefaccion ORDER BY id`
    );
    return rows.map(r => ({
        id:           r.id,
        nombre:       r.nombre,
        setpoint:     Number(r.setpoint) || 0,
        toleranciaSup: Number(r.tolerancia_sup) || 0,
        toleranciaInf: Number(r.tolerancia_inf) || 0,
        activa:       r.activa,
    }));
}

async function saveHeatingZones(zones) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const z of zones) {
            if (z.id === undefined || z.id === null) continue;
            await client.query(
                `UPDATE zona_calefaccion SET
                    nombre         = COALESCE($2, nombre),
                    setpoint       = $3,
                    tolerancia_sup = $4,
                    tolerancia_inf = $5,
                    activa         = $6
                 WHERE id = $1`,
                [z.id, z.nombre ?? null, z.setpoint ?? 0, z.toleranciaSup ?? 0, z.toleranciaInf ?? 0, z.activa ?? true]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getHeatingZones();
}

module.exports = {
    pool,
    initSchema,
    initTable,            // alias de compatibilidad
    getDispositivoId,
    getServomotorId,
    insertServoLectura,
    insertKpiLectura,
    upsertHusilloConfig,
    upsertMoldeConfig,
    upsertEstadoMaquina,
    insertZonaLectura,
    getMoldeConfig,
    getActivePerfilId,
    getClosingProfile,
    saveClosingProfile,
    getOpeningProfile,
    saveOpeningProfile,
    getInjectionProfile,
    saveInjectionProfile,
    getHoldingProfile,
    saveHoldingProfile,
    getEjectionProfile,
    saveEjectionProfile,
    getHeatingZones,
    saveHeatingZones,
};

// (esquemas por módulo: search_path configurado en el Pool)
