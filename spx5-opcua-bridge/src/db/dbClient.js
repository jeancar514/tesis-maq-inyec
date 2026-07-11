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

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN DEL ESQUEMA
// ─────────────────────────────────────────────────────────────────────────────
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
    logger.info('Esquema simplificado listo en PostgreSQL');
}

// Compatibilidad con el arranque anterior
async function initTable() {
    await initSchema();
}

// ─────────────────────────────────────────────────────────────────────────────
// injection · gen — SERVOMOTOR DE INYECCIÓN (servomotor_1) — lecturas en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
async function insertServoLectura(v) {
    await pool.query(
        `INSERT INTO injection.gen_servomotor_lectura (velocidad, torque, posicion, corriente, voltaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [v.velocidad ?? null, v.torque ?? null, v.posicion ?? null, v.corriente ?? null, v.voltaje ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// clamp · vgn — SERVOMOTOR DE CIERRE/MOLDE (servomotor_2) — lecturas en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
async function insertMoldServoLectura(v) {
    await pool.query(
        `INSERT INTO clamp.vgn_servomotor_lectura (velocidad, torque, posicion, corriente, voltaje)
         VALUES ($1, $2, $3, $4, $5)`,
        [v.velocidad ?? null, v.torque ?? null, v.posicion ?? null, v.corriente ?? null, v.voltaje ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — KPIs — snapshots
// ─────────────────────────────────────────────────────────────────────────────
async function insertKpiLectura(v) {
    await pool.query(
        `INSERT INTO dashboard.vgn_kpi_lectura (tiempo_ciclo, conteo_produccion, objetivo_produccion, rendimiento_calidad)
         VALUES ($1, $2, $3, $4)`,
        [v.tiempoCiclo ?? null, v.conteoProduccion ?? null, v.objetivoProduccion ?? null, v.rendimientoCalidad ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// inj_ — HUSILLO — setpoints (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertHusilloConfig(_codigo, v) {
    await pool.query(
        `INSERT INTO injection.hus_husillo_config (id, control_encendido, velocidad_husillo, torque_husillo, actualizado_en)
         VALUES (1, $1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET
            control_encendido = EXCLUDED.control_encendido,
            velocidad_husillo = EXCLUDED.velocidad_husillo,
            torque_husillo    = EXCLUDED.torque_husillo,
            actualizado_en    = NOW()`,
        [v.controlEncendido ?? 0, v.velocidadHusillo ?? 0, v.torqueHusillo ?? 0]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// clp_ — MOLDE — setpoints (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertMoldeConfig(_codigo, v) {
    await pool.query(
        `INSERT INTO clamp.vgn_molde_config
            (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion, actualizado_en)
         VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
            control_encendido  = EXCLUDED.control_encendido,
            torque             = EXCLUDED.torque,
            cambio_posicion    = EXCLUDED.cambio_posicion,
            posicion1          = EXCLUDED.posicion1,
            posicion2          = EXCLUDED.posicion2,
            velocidad_posicion = EXCLUDED.velocidad_posicion,
            actualizado_en     = NOW()`,
        [v.controlEncendido ?? 0, v.torque ?? 0, v.cambioPosicion ?? 0,
         v.posicion1 ?? 0, v.posicion2 ?? 0, v.velocidadPosicion ?? 0]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// injection · car — CARRO DE INYECCIÓN — setpoints (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertCarroConfig(v) {
    await pool.query(
        `INSERT INTO injection.car_carro_config
            (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion, actualizado_en)
         VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
            control_encendido  = EXCLUDED.control_encendido,
            torque             = EXCLUDED.torque,
            cambio_posicion    = EXCLUDED.cambio_posicion,
            posicion1          = EXCLUDED.posicion1,
            posicion2          = EXCLUDED.posicion2,
            velocidad_posicion = EXCLUDED.velocidad_posicion,
            actualizado_en     = NOW()`,
        [v.controlEncendido ?? 0, v.torque ?? 0, v.cambioPosicion ?? 0,
         v.posicion1 ?? 0, v.posicion2 ?? 0, v.velocidadPosicion ?? 0]
    );
}

async function getCarroConfig() {
    const { rows } = await pool.query(
        `SELECT control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion
         FROM injection.car_carro_config WHERE id = 1`
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        carriageControlEncendido:  Number(r.control_encendido) || 0,
        carriageTorque:            Number(r.torque) || 0,
        carriageCambioPosicion:    Number(r.cambio_posicion) || 0,
        carriagePosicion1:         Number(r.posicion1) || 0,
        carriagePosicion2:         Number(r.posicion2) || 0,
        carriageVelocidadPosicion: Number(r.velocidad_posicion) || 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// ejection · eyc — EYECTOR — setpoints (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertEyectorConfig(v) {
    await pool.query(
        `INSERT INTO ejection.eyc_eyector_config
            (id, control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion, actualizado_en)
         VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
            control_encendido  = EXCLUDED.control_encendido,
            torque             = EXCLUDED.torque,
            cambio_posicion    = EXCLUDED.cambio_posicion,
            posicion1          = EXCLUDED.posicion1,
            posicion2          = EXCLUDED.posicion2,
            velocidad_posicion = EXCLUDED.velocidad_posicion,
            actualizado_en     = NOW()`,
        [v.controlEncendido ?? 0, v.torque ?? 0, v.cambioPosicion ?? 0,
         v.posicion1 ?? 0, v.posicion2 ?? 0, v.velocidadPosicion ?? 0]
    );
}

async function getEyectorConfig() {
    const { rows } = await pool.query(
        `SELECT control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion
         FROM ejection.eyc_eyector_config WHERE id = 1`
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        ejectorControlEncendido:  Number(r.control_encendido) || 0,
        ejectorTorque:            Number(r.torque) || 0,
        ejectorCambioPosicion:    Number(r.cambio_posicion) || 0,
        ejectorPosicion1:         Number(r.posicion1) || 0,
        ejectorPosicion2:         Number(r.posicion2) || 0,
        ejectorVelocidadPosicion: Number(r.velocidad_posicion) || 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — MODO DE OPERACIÓN — tabla gen_modo_operacion (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertModoOperacion(v) {
    const modo = v.modo ?? null;
    const valor = Number(modo) === 2 ? 'activo' : 'inactivo';
    await pool.query(
        `INSERT INTO dashboard.vgn_modo_operacion (id, modo, valor, actualizado_en)
         VALUES (1, $1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET
            modo           = COALESCE(EXCLUDED.modo, vgn_modo_operacion.modo),
            valor          = CASE WHEN EXCLUDED.modo IS NULL THEN vgn_modo_operacion.valor ELSE EXCLUDED.valor END,
            actualizado_en = NOW()`,
        [modo, valor]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — COMANDO DE CICLO — tabla gen_comando_ciclo (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertComandoCiclo(v) {
    await pool.query(
        `INSERT INTO dashboard.vgn_comando_ciclo (id, comando, activa, actualizado_en)
         VALUES (1, $1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET
            comando        = COALESCE(EXCLUDED.comando, vgn_comando_ciclo.comando),
            activa         = COALESCE(EXCLUDED.activa, vgn_comando_ciclo.activa),
            actualizado_en = NOW()`,
        [v.comando ?? null, v.activa ?? false]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// hea_ — ZONA DE CALEFACCIÓN — lecturas en tiempo real (origen por código)
// ─────────────────────────────────────────────────────────────────────────────
async function insertZonaLectura(codigoZona, v) {
    await pool.query(
        `INSERT INTO heating.zon_zona_lectura (zona_id, temperatura_pv, salida_ssr)
         SELECT id, $2, $3 FROM heating.zon_zona_calefaccion WHERE codigo = $1`,
        [codigoZona, v.temperaturaPv ?? null, v.salidaSsr ?? null]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// clp_ — MOLDE — lectura de setpoints (fila única id = 1)
// ─────────────────────────────────────────────────────────────────────────────
async function getMoldeConfig(_codigo = 'molde') {
    const { rows } = await pool.query(
        `SELECT control_encendido, torque, cambio_posicion, posicion1, posicion2, velocidad_posicion
         FROM clamp.vgn_molde_config WHERE id = 1`
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
// PERFIL ACTIVO
// ─────────────────────────────────────────────────────────────────────────────
async function getActivePerfilId() {
    const { rows } = await pool.query(
        `SELECT id FROM recipes.rec_perfil WHERE activo = TRUE ORDER BY id LIMIT 1`
    );
    if (rows.length) return rows[0].id;
    const any = await pool.query(`SELECT id FROM recipes.rec_perfil ORDER BY id LIMIT 1`);
    return any.rows.length ? any.rows[0].id : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// clp_ — PERFIL DE CIERRE — etapas cierre/apertura
// ─────────────────────────────────────────────────────────────────────────────
async function getClosingProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, etiqueta, inicio, velocidad, torque_max
         FROM clamp.cie_etapa_cierre WHERE perfil_id = $1 ORDER BY orden`,
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
                `INSERT INTO clamp.cie_etapa_cierre
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
         FROM clamp.ape_etapa_apertura WHERE perfil_id = $1 ORDER BY orden`,
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
                `INSERT INTO clamp.ape_etapa_apertura
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
// inj_ — PERFIL DE INYECCIÓN — etapas
// ─────────────────────────────────────────────────────────────────────────────
async function getInjectionProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, punto_inicio, velocidad
         FROM injection.iny_etapa_inyeccion WHERE perfil_id = $1 ORDER BY orden`,
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
                `INSERT INTO injection.iny_etapa_inyeccion (perfil_id, orden, punto_inicio, velocidad)
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
// inj_ — PERFIL DE SOSTENIMIENTO — etapas
// ─────────────────────────────────────────────────────────────────────────────
async function getHoldingProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, presion, tiempo, velocidad, posicion
         FROM injection.hus_etapa_sostenimiento WHERE perfil_id = $1 ORDER BY orden`,
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
                `INSERT INTO injection.hus_etapa_sostenimiento (perfil_id, orden, presion, tiempo, velocidad, posicion)
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
// ejc_ — PERFIL DE EYECCIÓN — etapas
// ─────────────────────────────────────────────────────────────────────────────
async function getEjectionProfile() {
    const perfilId = await getActivePerfilId();
    if (!perfilId) return [];
    const { rows } = await pool.query(
        `SELECT orden, etiqueta, posicion, velocidad
         FROM ejection.pey_etapa_eyeccion WHERE perfil_id = $1 ORDER BY orden`,
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
                `INSERT INTO ejection.pey_etapa_eyeccion (perfil_id, orden, etiqueta, posicion, velocidad)
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
// hea_ — ZONAS DE CALEFACCIÓN — setpoints/tolerancias
// ─────────────────────────────────────────────────────────────────────────────
async function getHeatingZones() {
    const { rows } = await pool.query(
        `SELECT id, codigo, nombre, setpoint, tolerancia_sup, tolerancia_inf, activa
         FROM heating.zon_zona_calefaccion ORDER BY id`
    );
    return rows.map(r => ({
        id:           r.id,
        codigo:       r.codigo,
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
                `UPDATE heating.zon_zona_calefaccion SET
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

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — KPIs desde DB
// ─────────────────────────────────────────────────────────────────────────────
async function getKpiLectura() {
    const { rows } = await pool.query(
        `SELECT tiempo_ciclo, conteo_produccion, objetivo_produccion, rendimiento_calidad
         FROM dashboard.vgn_kpi_lectura ORDER BY capturado_en DESC LIMIT 1`
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        cycleTime:        Number(r.tiempo_ciclo) || 0,
        productionCount:  Number(r.conteo_produccion) || 0,
        productionTarget: Number(r.objetivo_produccion) || 5000,
        qualityYield:     Number(r.rendimiento_calidad) || 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — MODO DE OPERACIÓN desde DB
// ─────────────────────────────────────────────────────────────────────────────
async function getModoOperacion() {
    const { rows } = await pool.query(
        `SELECT modo FROM dashboard.vgn_modo_operacion WHERE id = 1`
    );
    if (!rows.length) return null;
    return { mode: Number(rows[0].modo) || 1 };
}

async function updateModoOperacion(mode) {
    const valor = Number(mode) === 2 ? 'activo' : 'inactivo';
    await pool.query(
        `INSERT INTO dashboard.vgn_modo_operacion (id, modo, valor, actualizado_en)
         VALUES (1, $1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET
            modo = EXCLUDED.modo, valor = EXCLUDED.valor, actualizado_en = NOW()`,
        [mode, valor]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// gen_ — COMANDO DE CICLO desde DB
// ─────────────────────────────────────────────────────────────────────────────
async function getComandoCiclo() {
    const { rows } = await pool.query(
        `SELECT comando, activa FROM dashboard.vgn_comando_ciclo WHERE id = 1`
    );
    if (!rows.length) return null;
    return {
        command: rows[0].comando || 'stop',
        active:  rows[0].activa ?? false,
    };
}

async function updateComandoCiclo(command) {
    const activa = command === 'start';
    await pool.query(
        `INSERT INTO dashboard.vgn_comando_ciclo (id, comando, activa, actualizado_en)
         VALUES (1, $1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET
            comando = EXCLUDED.comando, activa = EXCLUDED.activa, actualizado_en = NOW()`,
        [command, activa]
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// dashboard · cip — CICLO DE PASOS (secuencia de fases del ciclo)
// ─────────────────────────────────────────────────────────────────────────────
async function getStepCyclePhases() {
    const { rows } = await pool.query(
        `SELECT orden, nombre, estado, duracion
         FROM dashboard.cip_fase ORDER BY orden`
    );
    return rows.map(r => ({
        orden:    r.orden,
        nombre:   r.nombre,
        estado:   r.estado,
        duracion: Number(r.duracion) || 0,
    }));
}

async function saveStepCyclePhases(phases) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const p of phases) {
            if (p.orden === undefined || p.orden === null) continue;
            await client.query(
                `INSERT INTO dashboard.cip_fase (orden, nombre, estado, duracion, actualizado_en)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (orden) DO UPDATE SET
                    nombre         = COALESCE(EXCLUDED.nombre, cip_fase.nombre),
                    estado         = COALESCE(EXCLUDED.estado, cip_fase.estado),
                    duracion       = COALESCE(EXCLUDED.duracion, cip_fase.duracion),
                    actualizado_en = NOW()`,
                [p.orden, p.nombre ?? null, p.estado ?? null, p.duracion ?? null]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getStepCyclePhases();
}

// ─────────────────────────────────────────────────────────────────────────────
// dashboard · mdt — MONITOR DE TIEMPO (programado vs real por fase)
// ─────────────────────────────────────────────────────────────────────────────
async function getPhaseTimings() {
    const { rows } = await pool.query(
        `SELECT orden, nombre, tiempo_programado, tiempo_real
         FROM dashboard.mdt_fase_tiempo ORDER BY orden`
    );
    return rows.map(r => ({
        orden:            r.orden,
        nombre:           r.nombre,
        tiempoProgramado: Number(r.tiempo_programado) || 0,
        tiempoReal:       Number(r.tiempo_real) || 0,
    }));
}

async function savePhaseTimings(fases) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const f of fases) {
            if (f.orden === undefined || f.orden === null) continue;
            await client.query(
                `INSERT INTO dashboard.mdt_fase_tiempo (orden, nombre, tiempo_programado, tiempo_real, actualizado_en)
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT (orden) DO UPDATE SET
                    nombre            = COALESCE(EXCLUDED.nombre, mdt_fase_tiempo.nombre),
                    tiempo_programado = COALESCE(EXCLUDED.tiempo_programado, mdt_fase_tiempo.tiempo_programado),
                    tiempo_real       = COALESCE(EXCLUDED.tiempo_real, mdt_fase_tiempo.tiempo_real),
                    actualizado_en    = NOW()`,
                [f.orden, f.nombre ?? null, f.tiempoProgramado ?? null, f.tiempoReal ?? null]
            );
        }
        await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    return getPhaseTimings();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAESTROS DE VALORES (dashboard.cat_*) — catálogos de valores predeterminados
// ─────────────────────────────────────────────────────────────────────────────
async function getCatalogos() {
    const [modo, valor, comando, activacion, estadoFase] = await Promise.all([
        pool.query(`SELECT codigo, etiqueta, descripcion FROM dashboard.cat_modo_operacion ORDER BY codigo`),
        pool.query(`SELECT codigo, etiqueta FROM dashboard.cat_valor_modo ORDER BY codigo`),
        pool.query(`SELECT codigo, etiqueta FROM dashboard.cat_comando_ciclo ORDER BY codigo`),
        pool.query(`SELECT codigo, etiqueta FROM dashboard.cat_activacion ORDER BY codigo`),
        pool.query(`SELECT codigo, etiqueta, orden, color FROM dashboard.cat_estado_fase ORDER BY orden`),
    ]);
    return {
        modoOperacion: modo.rows.map(r => ({ codigo: Number(r.codigo), etiqueta: r.etiqueta, descripcion: r.descripcion })),
        valorModo:     valor.rows.map(r => ({ codigo: r.codigo, etiqueta: r.etiqueta })),
        comandoCiclo:  comando.rows.map(r => ({ codigo: r.codigo, etiqueta: r.etiqueta })),
        activacion:    activacion.rows.map(r => ({ codigo: r.codigo, etiqueta: r.etiqueta })),
        estadoFase:    estadoFase.rows.map(r => ({ codigo: r.codigo, etiqueta: r.etiqueta, orden: r.orden, color: r.color })),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// heating · ON-OFF — diagnóstico por zona (config + última lectura PV/SSR)
// ─────────────────────────────────────────────────────────────────────────────
async function getHeatingDiagnostic() {
    const { rows } = await pool.query(
        `SELECT z.id, z.codigo, z.nombre, z.setpoint, z.tolerancia_sup, z.tolerancia_inf,
                l.temperatura_pv, l.salida_ssr
         FROM heating.zon_zona_calefaccion z
         LEFT JOIN LATERAL (
             SELECT temperatura_pv, salida_ssr
             FROM heating.zon_zona_lectura
             WHERE zona_id = z.id
             ORDER BY capturado_en DESC
             LIMIT 1
         ) l ON TRUE
         ORDER BY z.id`
    );
    return rows.map(r => {
        const pv = r.temperatura_pv !== null ? Number(r.temperatura_pv) : null;
        const sp = Number(r.setpoint) || 0;
        const ssr = r.salida_ssr !== null ? Number(r.salida_ssr) : null;
        return {
            codigo:        r.codigo,
            nombre:        r.nombre,
            setpoint:      sp,
            toleranciaSup: Number(r.tolerancia_sup) || 0,
            toleranciaInf: Number(r.tolerancia_inf) || 0,
            temperaturaPv: pv,
            salidaSsr:     ssr,
            error:         pv !== null ? Number((pv - sp).toFixed(2)) : null,
            estado:        (ssr ?? 0) > 0 ? 'on' : 'off',
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// injection · gen — SERVOMOTOR DE INYECCIÓN — última lectura (GET /api/servo en modo db)
// ─────────────────────────────────────────────────────────────────────────────
async function getServoLectura() {
    const { rows } = await pool.query(
        `SELECT velocidad, torque, posicion, corriente, voltaje
         FROM injection.gen_servomotor_lectura
         ORDER BY capturado_en DESC
         LIMIT 1`
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        speed:    Number(r.velocidad) || 0,
        torque:   Number(r.torque) || 0,
        position: Number(r.posicion) || 0,
        current:  Number(r.corriente) || 0,
        voltage:  Number(r.voltaje) || 0,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// clamp · vgn — SERVOMOTOR DE MOLDE — última lectura (GET /api/mold-control/servo en modo db)
// ─────────────────────────────────────────────────────────────────────────────
async function getMoldServoLectura() {
    const { rows } = await pool.query(
        `SELECT velocidad, torque, posicion, corriente, voltaje
         FROM clamp.vgn_servomotor_lectura
         ORDER BY capturado_en DESC
         LIMIT 1`
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        speed:    Number(r.velocidad) || 0,
        torque:   Number(r.torque) || 0,
        position: Number(r.posicion) || 0,
        current:  Number(r.corriente) || 0,
        voltage:  Number(r.voltaje) || 0,
    };
}

// Función de conveniencia — combina modo + comando (para GET /api/kpis)
async function getEstadoMaquina() {
    const modoOp = await getModoOperacion();
    const cmdCiclo = await getComandoCiclo();
    return {
        mode:    modoOp?.mode ?? 1,
        command: cmdCiclo?.command ?? 'stop',
        active:  cmdCiclo?.active ?? false,
    };
}

module.exports = {
    pool,
    initSchema,
    initTable,
    insertServoLectura,
    insertMoldServoLectura,
    insertKpiLectura,
    upsertHusilloConfig,
    upsertMoldeConfig,
    getCarroConfig,
    upsertCarroConfig,
    getEyectorConfig,
    upsertEyectorConfig,
    upsertModoOperacion,
    upsertComandoCiclo,
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
    getKpiLectura,
    getModoOperacion,
    updateModoOperacion,
    getComandoCiclo,
    updateComandoCiclo,
    getEstadoMaquina,
    getServoLectura,
    getMoldServoLectura,
    getCatalogos,
    getHeatingDiagnostic,
    getStepCyclePhases,
    saveStepCyclePhases,
    getPhaseTimings,
    savePhaseTimings,
};
