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
        this.wss = null;
        this.kpiClients = new Set();
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
                const kpiRegisters = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.KPIS);
                const kpiValues = {};
                kpiRegisters.forEach(reg => {
                    kpiValues[reg.name] = opcuaServer._getCachedValue(reg);
                });

                res.json(kpiValues);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
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

            // WebSocket server para KPIS
            this.wss = new WebSocket.Server({ server: this.server, path: '/ws/kpis' });
            this.wss.on('connection', ws => {
                this.kpiClients.add(ws);
                ws.on('close', () => this.kpiClients.delete(ws));
            });

            // WebSocket para modo de operación
            this.wssOperationMode = new WebSocket.Server({ server: this.server, path: '/ws/operation-mode' });
            this.operationModeClients = new Set();
            this.wssOperationMode.on('connection', ws => {
                this.operationModeClients.add(ws);
                ws.on('close', () => this.operationModeClients.delete(ws));
            });

            // WebSocket para comandos de ciclo
            this.wssCycleCommand = new WebSocket.Server({ server: this.server, path: '/ws/cycle-command' });
            this.cycleCommandClients = new Set();
            this.wssCycleCommand.on('connection', ws => {
                this.cycleCommandClients.add(ws);
                ws.on('close', () => this.cycleCommandClients.delete(ws));
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

    async stop() {
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            return new Promise(resolve => this.server.close(resolve));
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
}

module.exports = new ApiServer();