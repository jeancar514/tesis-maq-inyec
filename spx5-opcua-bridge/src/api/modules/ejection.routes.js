// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Eyección (eyector + perfil de eyección)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const { attachMoveRoute, readValuesByType } = require('./_shared');

const router = express.Router();

// Eyector: control genérico (doble fuente db/modbus) + movimiento por posición.
// En modo 'db' el GET combina setpoints (eyc_eyector_config) + última lectura en tiempo real (eyc_eyector_lectura).
router.get(ROUTES.EJECTOR_CONTROL, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const [setpoints, lectura] = await Promise.all([
                dbClient.getEyectorConfig(),
                dbClient.getEyectorLectura(),
            ]);
            if (setpoints || lectura) {
                return res.json({ ...(setpoints || {}), ...(lectura || {}), _source: 'db' });
            }
        }
        res.json({ ...readValuesByType(REGISTER_TYPES.EJECTOR_CONTROL), _source: 'modbus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post(ROUTES.EJECTOR_CONTROL, async (req, res) => {
    const writableNames = registerManager.getAll()
        .filter(reg => reg.type === REGISTER_TYPES.EJECTOR_CONTROL && reg.writable)
        .map(reg => reg.name);
    const entries = Object.entries(req.body).filter(([k]) => writableNames.includes(k));
    if (entries.length === 0)
        return res.status(400).json({ error: `Body must include at least one of: ${writableNames.join(', ')}` });

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

// GET /api/ejector-control/lectura — última lectura en tiempo real del eyector (velocidad, posición, torque secundario).
router.get(`${ROUTES.EJECTOR_CONTROL}/lectura`, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const lectura = await dbClient.getEyectorLectura();
            if (lectura) return res.json({ ...lectura, _source: 'db' });
        }
        const vals = readValuesByType(REGISTER_TYPES.EJECTOR_CONTROL);
        res.json({
            ejectorVelocidad:        vals.ejectorVelocidad        ?? 0,
            ejectorPosicion:         vals.ejectorPosicion         ?? 0,
            ejectorTorqueSecundario: vals.ejectorTorqueSecundario ?? 0,
            _source: 'modbus',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

attachMoveRoute(router, `${ROUTES.EJECTOR_CONTROL}/move`, REGISTER_TYPES.EJECTOR_CONTROL);

// ── Perfil de Eyección (etapas, persistido en DB) ──────────────────────────
router.get(ROUTES.EJECTION_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getEjectionProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.EJECTION_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveEjectionProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
