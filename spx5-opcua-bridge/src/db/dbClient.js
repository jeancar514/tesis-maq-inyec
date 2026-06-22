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
};
