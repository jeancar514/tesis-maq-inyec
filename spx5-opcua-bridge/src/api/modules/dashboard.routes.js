// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Dashboard / General (KPIs, modo de operación, comando de ciclo)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const realtimeBus = require('../realtimeBus');

const router = express.Router();

router.get(ROUTES.KPIS, (req, res) => {
    try {
        const kpiRegisters = registerManager.getAll().filter(reg =>
            [REGISTER_TYPES.KPIS, REGISTER_TYPES.CYCLE_COMMAND, REGISTER_TYPES.OPERATION_MODE].includes(reg.type));
        const kpiValues = {};
        kpiRegisters.forEach(reg => { kpiValues[reg.name] = opcuaServer._getCachedValue(reg); });
        res.json(kpiValues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post(ROUTES.OPERATION_MODE, async (req, res) => {
    const { mode } = req.body; // 1: manual, 2: automático
    const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.OPERATION_MODE);
    if (!reg) return res.status(404).json({ error: 'Operation mode register not found' });
    if (!reg.writable) return res.status(403).json({ error: 'Operation mode is read-only' });
    if (![1, 2].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
    try {
        await modbusClient.writeByConfig(reg, mode);
        opcuaServer.updateCachedValue(reg.name, mode);
        opcuaServer.markAsWritten(reg.name);
        realtimeBus.operationMode(mode);
        res.json({ success: true, mode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post(ROUTES.CYCLE_COMMAND, async (req, res) => {
    const { command } = req.body; // 'start' | 'stop'
    const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.CYCLE_COMMAND);
    if (!reg) return res.status(404).json({ error: 'Cycle command register not found' });
    if (!reg.writable) return res.status(403).json({ error: 'Cycle command is read-only' });
    if (!['start', 'stop'].includes(command)) return res.status(400).json({ error: 'Invalid command' });
    const value = command === 'start' ? 1 : 0;
    try {
        await modbusClient.writeByConfig(reg, value);
        opcuaServer.updateCachedValue(reg.name, value);
        opcuaServer.markAsWritten(reg.name);
        realtimeBus.cycleCommand(command);
        res.json({ success: true, command });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
