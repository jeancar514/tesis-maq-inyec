const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const config = require('../../config/config');
const opcuaServer = require('../opcua/opcuaServer');
const registerManager = require('../utils/registerManager');
const logger = require('../utils/logger');
const { REGISTER_TYPES } = require('./constant');
const realtimeBus = require('./realtimeBus');

// Routers por módulo (espejo de los módulos del FooterNav del frontend)
const dashboardRoutes = require('./modules/dashboard.routes');
const clampRoutes = require('./modules/clamp.routes');
const injectionRoutes = require('./modules/injection.routes');
const ejectionRoutes = require('./modules/ejection.routes');
const heatingRoutes = require('./modules/heating.routes');
const maintenanceRoutes = require('./modules/maintenance.routes');
const configRoutes = require('./modules/config.routes');

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

        // El bus de tiempo real desacopla los routers del servidor WebSocket.
        realtimeBus.operationMode = (mode) => this.broadcastOperationModeUpdate(mode);
        realtimeBus.cycleCommand = (command) => this.broadcastCycleCommandUpdate(command);

        this._setupSwagger();
        this._setupRoutes();
    }

    _setupSwagger() {
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    _setupRoutes() {
        // Montaje de routers por módulo. Cada router define rutas absolutas
        // (/api/...), por lo que se montan en la raíz.
        this.app.use(configRoutes);
        this.app.use(maintenanceRoutes);
        this.app.use(dashboardRoutes);
        this.app.use(clampRoutes);
        this.app.use(injectionRoutes);
        this.app.use(ejectionRoutes);
        this.app.use(heatingRoutes);
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
