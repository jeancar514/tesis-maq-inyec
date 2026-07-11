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

router.get(ROUTES.OPERATION_MODE, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const estado = await dbClient.getEstadoMaquina();
            return res.json({ mode: estado?.mode ?? 1, _source: 'db' });
        }
        const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.OPERATION_MODE);
        const value = reg ? opcuaServer._getCachedValue(reg) : 1;
        res.json({ mode: Number(value) || 1 });
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

router.get(ROUTES.CYCLE_COMMAND, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const estado = await dbClient.getEstadoMaquina();
            return res.json({ command: estado?.command ?? 'stop', _source: 'db' });
        }
        const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.CYCLE_COMMAND);
        const value = reg ? opcuaServer._getCachedValue(reg) : 0;
        res.json({ command: value ? 'start' : 'stop' });
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

// ─────────────────────────────────────────────────────────────────────────────
// Ciclo de Pasos (sección del Sidebar) — secuencia de fases del ciclo
// ─────────────────────────────────────────────────────────────────────────────
// Lee el valor cacheado de un registro por nombre (0 si no existe).
function cachedReg(name) {
    const reg = registerManager.getAll().find(r => r.name === name);
    return reg ? Number(opcuaServer._getCachedValue(reg)) || 0 : 0;
}

router.get(ROUTES.STEP_CYCLE, async (req, res) => {
    try {
        // Nombres/orden de las fases: configuración (siempre desde DB).
        const dbPhases = await dbClient.getStepCyclePhases();

        if (config.dataSource !== 'db') {
            // Modbus: estado derivado del paso actual leído del SPX5.
            const pasoActual = cachedReg('pasoActual');
            const phases = dbPhases.map(p => ({
                orden: p.orden,
                nombre: p.nombre,
                estado: p.orden < pasoActual ? 'completado' : p.orden === pasoActual ? 'activo' : 'pendiente',
                duracion: 0,
            }));
            return res.json({ success: true, source: 'modbus', phases });
        }
        res.json({ success: true, source: 'db', phases: dbPhases });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put(ROUTES.STEP_CYCLE, async (req, res) => {
    const { phases } = req.body;
    if (!Array.isArray(phases) || phases.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "phases" (array no vacío)' });
    try {
        const saved = await dbClient.saveStepCyclePhases(phases);
        res.json({ success: true, phases: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Monitor de Tiempo (sección del Sidebar) — tiempo programado vs real por fase
// ─────────────────────────────────────────────────────────────────────────────
router.get(ROUTES.PHASE_TIMING, async (req, res) => {
    try {
        // Tiempos programados por fase: configuración (siempre desde DB).
        const dbPhases = await dbClient.getPhaseTimings();

        if (config.dataSource !== 'db') {
            // Modbus: el tiempo real total (SPX5) se distribuye proporcionalmente
            // al tiempo programado de cada fase (no hay tiempo real por fase en el PLC).
            const realTotal = cachedReg('tiempoCicloReal');
            const totalProg = dbPhases.reduce((a, p) => a + p.tiempoProgramado, 0) || 1;
            const phases = dbPhases.map(p => ({
                orden: p.orden,
                nombre: p.nombre,
                tiempoProgramado: p.tiempoProgramado,
                tiempoReal: Number((realTotal * (p.tiempoProgramado / totalProg)).toFixed(2)),
            }));
            return res.json({ success: true, source: 'modbus', phases });
        }
        res.json({ success: true, source: 'db', phases: dbPhases });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put(ROUTES.PHASE_TIMING, async (req, res) => {
    const { phases } = req.body;
    if (!Array.isArray(phases) || phases.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "phases" (array no vacío)' });
    try {
        const saved = await dbClient.savePhaseTimings(phases);
        res.json({ success: true, phases: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
