const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const config = require('../../config/config');
const modbusClient = require('../modbus/modbusClient');
const opcuaServer = require('../opcua/opcuaServer');
const registerManager = require('../utils/registerManager');
const logger = require('../utils/logger');
const { ROUTES, REGISTER_TYPES } = require('./constant');

const WebSocket = require('ws');

class ApiServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wssMain = null;
        this.kpiClients = new Set();
        this.servoClients = new Set();
        this.operationModeClients = new Set();
        this.cycleCommandClients = new Set();
        this.app.use(cors());
        this.app.use(express.json());
        this._setupSwagger();
        this._setupRoutes();
    }

    _setupSwagger() {
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    _setupRoutes() {
        this.app.get('/api/registers', (req, res) => {
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

        this.app.get(ROUTES.KPIS, (req, res) => {
            try {
                const kpiRegisters = registerManager.getAll().filter(reg => [REGISTER_TYPES.KPIS,REGISTER_TYPES.CYCLE_COMMAND,REGISTER_TYPES.OPERATION_MODE].includes(reg.type));
                const kpiValues = {};
                kpiRegisters.forEach(reg => {
                    kpiValues[reg.name] = opcuaServer._getCachedValue(reg);
                });

                res.json(kpiValues);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        this.app.get(ROUTES.SERVO, (req, res) => {
            try {
                const regs = registerManager.getAll().filter(reg =>
                    reg.type === REGISTER_TYPES.SERVO || reg.type === REGISTER_TYPES.SCREW_CONTROL
                );
                const values = {};
                regs.forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
                res.json(values);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // GET /api/screw-control — leer valores actuales de los 3 registros de control
        this.app.get(ROUTES.SCREW_CONTROL, (req, res) => {
            try {
                const regs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SCREW_CONTROL);
                const values = {};
                regs.forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
                res.json(values);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // POST /api/screw-control — escribir uno o varios registros de control
        // Body: { controlEncendido?: 0|1, velocidadHusillo?: number, torqueHusillo?: number }
        this.app.post(ROUTES.SCREW_CONTROL, async (req, res) => {
            const allowed = ['controlEncendido', 'velocidadHusillo', 'torqueHusillo'];
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

        this.app.post(ROUTES.OPERATION_MODE, async (req, res) => {
            const { mode } = req.body; // 1: manual, 2: automático
            const reg = registerManager.getAll().find(r => r.type === REGISTER_TYPES.OPERATION_MODE);
            if (!reg) return res.status(404).json({ error: 'Operation mode register not found' });
            if (!reg.writable) return res.status(403).json({ error: 'Operation mode is read-only' });
            if (![1, 2].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });
            try {
                await modbusClient.writeByConfig(reg, mode);
                opcuaServer.updateCachedValue(reg.name, mode);
                opcuaServer.markAsWritten(reg.name);
                this.broadcastOperationModeUpdate(mode);
                res.json({ success: true, mode });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        this.app.post(ROUTES.CYCLE_COMMAND, async (req, res) => {
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
                this.broadcastCycleCommandUpdate(command);
                res.json({ success: true, command });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(config.api.port, () => {
                logger.info(`API started at http://localhost:${config.api.port}`);
                resolve();
            });
            this.server.on('error', reject);

            // Un solo WS server sin path — routing manual por URL
            this.wssMain = new WebSocket.Server({ noServer: true });

            this.server.on('upgrade', (request, socket, head) => {
                const url = request.url;
                logger.info(`WS upgrade request: ${url}`);
                this.wssMain.handleUpgrade(request, socket, head, (ws) => {
                    if (url === '/ws/kpis') {
                        this.kpiClients.add(ws);
                        const kpiRegs = registerManager.getAll().filter(r => [REGISTER_TYPES.KPIS, REGISTER_TYPES.CYCLE_COMMAND, REGISTER_TYPES.OPERATION_MODE].includes(r.type));
                        const vals = {};
                        kpiRegs.forEach(r => { vals[r.name] = opcuaServer._getCachedValue(r); });
                        ws.send(JSON.stringify({ kpis: vals }));
                        ws.on('close', () => this.kpiClients.delete(ws));

                    } else if (url === '/ws/servo') {
                        this.servoClients.add(ws);
                        const servoRegs = registerManager.getAll().filter(r => r.type === REGISTER_TYPES.SERVO);
                        const vals = {};
                        servoRegs.forEach(r => { vals[r.name] = opcuaServer._getCachedValue(r); });
                        ws.send(JSON.stringify({ servo: vals }));
                        ws.on('close', () => this.servoClients.delete(ws));

                    } else if (url === '/ws/operation-mode') {
                        this.operationModeClients.add(ws);
                        ws.on('close', () => this.operationModeClients.delete(ws));

                    } else if (url === '/ws/cycle-command') {
                        this.cycleCommandClients.add(ws);
                        ws.on('close', () => this.cycleCommandClients.delete(ws));

                    } else {
                        socket.destroy();
                    }
                });
            });
        });
    }

    broadcastOperationModeUpdate(mode) {
        if (!this.operationModeClients) return;
        const message = JSON.stringify({ mode });
        for (const ws of this.operationModeClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    broadcastCycleCommandUpdate(command) {
        if (!this.cycleCommandClients) return;
        const message = JSON.stringify({ command });
        for (const ws of this.cycleCommandClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    broadcastKpisUpdate() {
        const kpiRegisters = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.KPIS);
        const kpiValues = {};
        kpiRegisters.forEach(reg => {
            kpiValues[reg.name] = opcuaServer._getCachedValue(reg);
        });
        const message = JSON.stringify({ kpis: kpiValues });
        for (const ws of this.kpiClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    broadcastServoUpdate() {
        if (!this.servoClients) return;
        const servoRegisters = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SERVO);
        const servoValues = {};
        servoRegisters.forEach(reg => {
            servoValues[reg.name] = opcuaServer._getCachedValue(reg);
        });
        const message = JSON.stringify({ servo: servoValues });
        for (const ws of this.servoClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    async stop() {
        if (this.wssMain) this.wssMain.close();
        if (this.server) {
            return new Promise(resolve => this.server.close(resolve));
        }
    }
}

module.exports = new ApiServer();