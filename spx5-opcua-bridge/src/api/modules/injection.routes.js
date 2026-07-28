// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Inyección (servo, husillo, carro de inyección, perfiles)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const { attachControlRoutes, attachMoveRoute } = require('./_shared');

const router = express.Router();

// GET /api/servo — lecturas del servomotor (doble fuente db/modbus)
router.get(ROUTES.SERVO, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const servo = await dbClient.getServoLectura();
            if (servo) return res.json({ ...servo, _source: 'db' });
        }
        const regs = registerManager.getAll().filter(reg =>
            reg.type === REGISTER_TYPES.SERVO || reg.type === REGISTER_TYPES.SCREW_CONTROL);
        const values = {};
        regs.forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
        res.json(values);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/screw-control — recompone valores de 32 bits (High/Low)
router.get(ROUTES.SCREW_CONTROL, (req, res) => {
    try {
        const regs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SCREW_CONTROL);
        const values = {};
        const processed = new Set();

        regs.forEach(reg => {
            if (reg.is32Bit && reg.bitPosition === 'high') {
                const baseName = reg.name.replace('High', '');
                const lowReg = regs.find(r => r.name === `${baseName}Low`);
                if (lowReg && !processed.has(baseName)) {
                    const highWord = opcuaServer._getCachedValue(reg) || 0;
                    const lowWord = opcuaServer._getCachedValue(lowReg) || 0;
                    const fullValue = ((highWord & 0xFFFF) << 16) | (lowWord & 0xFFFF);
                    values[baseName] = fullValue;
                    processed.add(baseName);
                }
            } else if (reg.is32Bit && reg.bitPosition === 'low') {
                return;
            } else if (!processed.has(reg.name)) {
                values[reg.name] = opcuaServer._getCachedValue(reg);
                processed.add(reg.name);
            }
        });

        res.json(values);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/screw-control — divide valores de 32 bits en High/Low words
router.post(ROUTES.SCREW_CONTROL, async (req, res) => {
    const allowed = ['controlEncendido', 'velocidadHusillo', 'torqueHusillo'];
    const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (entries.length === 0)
        return res.status(400).json({ error: `Body must include at least one of: ${allowed.join(', ')}` });

    const results = {};
    for (const [name, value] of entries) {
        const highReg = registerManager.getAll().find(r => r.name === `${name}High`);
        const lowReg = registerManager.getAll().find(r => r.name === `${name}Low`);

        if (highReg && lowReg) {
            const numValue = Number(value);
            const intValue = Math.round(numValue);
            const highWord = (intValue >> 16) & 0xFFFF;
            const lowWord = intValue & 0xFFFF;
            try {
                await modbusClient.writeByConfig(highReg, highWord);
                await modbusClient.writeByConfig(lowReg, lowWord);
                opcuaServer.updateCachedValue(`${name}High`, highWord);
                opcuaServer.updateCachedValue(`${name}Low`, lowWord);
                opcuaServer.markAsWritten(`${name}High`);
                opcuaServer.markAsWritten(`${name}Low`);
                results[name] = { success: true, value: numValue, highWord, lowWord };
            } catch (err) {
                results[name] = { error: err.message };
            }
        } else {
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
    }
    res.json(results);
});

// Carro de inyección: control genérico (doble fuente db/modbus) + movimiento por posición.
// En modo 'db' el GET combina setpoints (car_carro_config) + última lectura en tiempo real (car_carro_lectura).
const { readValuesByType } = require('./_shared');

router.get(ROUTES.CARRIAGE_CONTROL, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const [setpoints, lectura] = await Promise.all([
                dbClient.getCarroConfig(),
                dbClient.getCarroLectura(),
            ]);
            if (setpoints || lectura) {
                return res.json({ ...(setpoints || {}), ...(lectura || {}), _source: 'db' });
            }
        }
        res.json({ ...readValuesByType(REGISTER_TYPES.CARRIAGE_CONTROL), _source: 'modbus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post(ROUTES.CARRIAGE_CONTROL, async (req, res) => {
    const writableNames = registerManager.getAll()
        .filter(reg => reg.type === REGISTER_TYPES.CARRIAGE_CONTROL && reg.writable)
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

// GET /api/carriage-control/lectura — última lectura en tiempo real del carro (velocidad, posición, torque secundario).
router.get(`${ROUTES.CARRIAGE_CONTROL}/lectura`, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const lectura = await dbClient.getCarroLectura();
            if (lectura) return res.json({ ...lectura, _source: 'db' });
        }
        const vals = readValuesByType(REGISTER_TYPES.CARRIAGE_CONTROL);
        res.json({
            carriageVelocidad:        vals.carriageVelocidad        ?? 0,
            carriagePosicion:         vals.carriagePosicion         ?? 0,
            carriageTorqueSecundario: vals.carriageTorqueSecundario ?? 0,
            _source: 'modbus',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

attachMoveRoute(router, `${ROUTES.CARRIAGE_CONTROL}/move`, REGISTER_TYPES.CARRIAGE_CONTROL);

// ── Perfil de Inyección (etapas, persistido en DB) ─────────────────────────
router.get(ROUTES.INJECTION_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getInjectionProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.INJECTION_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveInjectionProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Perfil de Sostenimiento / Compactación (Husillo) ───────────────────────
router.get(ROUTES.HOLDING_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getHoldingProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.HOLDING_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveHoldingProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
