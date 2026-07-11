// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Molde / Cierre (control del molde + perfiles de cierre y apertura)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const logger = require('../../utils/logger');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const { readValuesByType, attachMoveRoute } = require('./_shared');

const router = express.Router();

// GET /api/mold-control — respeta el origen de datos (config.dataSource).
router.get(ROUTES.MOLD_CONTROL, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const dbValues = await dbClient.getMoldeConfig('molde');
            if (dbValues) return res.json({ ...dbValues, _source: 'db' });
            logger.warn('mold-control: sin datos en DB, usando caché Modbus');
        }
        res.json({ ...readValuesByType(REGISTER_TYPES.MOLD_CONTROL), _source: 'modbus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/mold-control — escribir registros de control del molde.
router.post(ROUTES.MOLD_CONTROL, async (req, res) => {
    const allowed = ['moldControlEncendido', 'moldTorque', 'moldCambioPosicion', 'moldPosicion1', 'moldPosicion2', 'moldVelocidadPosicion'];
    const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (entries.length === 0)
        return res.status(400).json({ error: `Body must include at least one of: ${allowed.join(', ')}` });

    const results = {};
    for (const [name, value] of entries) {
        const reg = registerManager.getAll().find(r => r.name === name);
        if (!reg) { results[name] = { error: 'register not found' }; continue; }
        if (!reg.writable) { results[name] = { error: 'read-only' }; continue; }
        try {
            await modbusClient.writeByConfig(reg, Number(value));
            opcuaServer.updateCachedValue(reg.name, Number(value));
            opcuaServer.markAsWritten(reg.name);
            results[name] = { success: true, value: Number(value) };
        } catch (err) {
            results[name] = { error: err.message };
        }
    }
    res.json(results);
});

attachMoveRoute(router, `${ROUTES.MOLD_CONTROL}/move`, REGISTER_TYPES.MOLD_CONTROL);

// GET /api/mold-control/servo — lecturas del servomotor de cierre/molde (servomotor_2).
// Nota: el SPX5 solo expone un único juego de registros Modbus tipo "servo"
// (velocidad/torque/posición/corriente/voltaje). En modo 'db' se lee el
// servomotor_2 real (persistido por el bridge); en modo 'modbus' se usa la
// caché de registros como aproximación, ya que el PLC no discrimina por eje.
router.get(ROUTES.MOLD_SERVO, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const servo = await dbClient.getMoldServoLectura();
            if (servo) return res.json({ ...servo, _source: 'db' });
        }
        res.json({ ...readValuesByType(REGISTER_TYPES.SERVO), _source: 'modbus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Perfil de Cierre (etapas, persistido en DB) ────────────────────────────
router.get(ROUTES.CLAMP_CLOSING_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getClosingProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.CLAMP_CLOSING_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveClosingProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Perfil de Apertura (etapas, persistido en DB) ──────────────────────────
router.get(ROUTES.CLAMP_OPENING_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getOpeningProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.CLAMP_OPENING_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveOpeningProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
