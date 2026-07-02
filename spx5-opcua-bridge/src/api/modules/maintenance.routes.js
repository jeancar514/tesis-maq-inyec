// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Mantenimiento / Configuración de direcciones Modbus
// Rutas: GET /api/registers, POST /api/registers/batch, PUT /api/registers/:name
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const registerManager = require('../../utils/registerManager');
const opcuaServer = require('../../opcua/opcuaServer');
const { ROUTES } = require('../constant');
const { validateRegisterPatch } = require('./_shared');

const router = express.Router();

router.get(ROUTES.REGISTERS, (req, res) => {
    try {
        const registers = registerManager.getAll().map(reg => ({
            ...reg,
            value: opcuaServer._getCachedValue(reg)
        }));
        res.json({ success: true, registers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Actualización por lotes: { changes: [{ name, modbusAddress, ... }] }
router.post(`${ROUTES.REGISTERS}/batch`, (req, res) => {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : null;
    if (!changes || changes.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "changes" (array no vacío)' });

    const results = [];
    for (const change of changes) {
        const { name, ...patch } = change || {};
        if (!name) { results.push({ name: null, error: 'falta name' }); continue; }
        const { error, clean } = validateRegisterPatch(patch);
        if (error) { results.push({ name, error }); continue; }
        const updated = registerManager.updateRegister(name, clean);
        if (!updated) { results.push({ name, error: 'registro no encontrado' }); continue; }
        results.push({ name, success: true, register: updated });
    }
    const allOk = results.every(r => r.success);
    res.status(allOk ? 200 : 207).json({ success: allOk, results });
});

// Actualización individual: PUT /api/registers/:name
router.put(`${ROUTES.REGISTERS}/:name`, (req, res) => {
    const { error, clean } = validateRegisterPatch(req.body || {});
    if (error) return res.status(400).json({ success: false, error });
    const updated = registerManager.updateRegister(req.params.name, clean);
    if (!updated) return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    res.json({ success: true, register: updated });
});

module.exports = router;
