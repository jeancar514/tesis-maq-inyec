// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Dashboard / General (KPIs, modo de operación, comando de ciclo)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const realtimeBus = require('../realtimeBus');

const router = express.Router();

router.get(ROUTES.KPIS, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const kpiFromDb = await dbClient.getKpiLectura();
            const estadoFromDb = await dbClient.getEstadoMaquina();
            return res.json({
                cycleTime: kpiFromDb?.cycleTime ?? 0,
                productionCount: kpiFromDb?.productionCount ?? 0,
                productionTarget: kpiFromDb?.productionTarget ?? 5000,
                qualityYield: kpiFromDb?.qualityYield ?? 0,
                operationMode: estadoFromDb?.mode ?? 1,
                cycleCommand: estadoFromDb?.command === 'start' ? 1 : 0,
                _source: 'db',
            });
        }
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
    if (![1, 2].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
    try {
        if (config.dataSource === 'db') {
            await dbClient.updateModoOperacion(mode);
            realtimeBus.operationMode(mode);
            return res.json({ success: true, mode, _source: 'db' });
        }
        const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.OPERATION_MODE);
        if (!reg) return res.status(404).json({ error: 'Operation mode register not found' });
        if (!reg.writable) return res.status(403).json({ error: 'Operation mode is read-only' });
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
    if (!['start', 'stop'].includes(command)) return res.status(400).json({ error: 'Invalid command' });
    try {
        if (config.dataSource === 'db') {
            await dbClient.updateComandoCiclo(command);
            realtimeBus.cycleCommand(command);
            return res.json({ success: true, command, _source: 'db' });
        }
        const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.CYCLE_COMMAND);
        if (!reg) return res.status(404).json({ error: 'Cycle command register not found' });
        if (!reg.writable) return res.status(403).json({ error: 'Cycle command is read-only' });
        const value = command === 'start' ? 1 : 0;
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
