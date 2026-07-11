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
const dbClient = require('../db/dbClient');

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
        this.moldServoClients = new Set();
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
                this.wssMain.handleUpgrade(request, socket, head, async (ws) => {
                    if (url === '/ws/kpis') {
                        this.kpiClients.add(ws);
                        ws.on('close', () => this.kpiClients.delete(ws));
                        // Estado inicial: en modo 'db' se envían los valores persistidos
                        // (mismo shape que GET /api/kpis); en 'modbus', la caché de registros.
                        const kpis = await this._buildKpiPayload();
                        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ kpis }));

                    } else if (url === '/ws/servo') {
                        this.servoClients.add(ws);
                        ws.on('close', () => this.servoClients.delete(ws));
                        const servo = await this._buildServoPayload();
                        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ servo }));

                    } else if (url === '/ws/mold-servo') {
                        this.moldServoClients.add(ws);
                        ws.on('close', () => this.moldServoClients.delete(ws));
                        const servo = await this._buildMoldServoPayload();
                        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ servo }));

                    } else if (url === '/ws/operation-mode') {
                        this.operationModeClients.add(ws);
                        ws.on('close', () => this.operationModeClients.delete(ws));
                        // Estado inicial del modo de operación desde el DB.
                        if (config.dataSource === 'db') {
                            const estado = await dbClient.getEstadoMaquina();
                            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ mode: estado?.mode ?? 1 }));
                        }

                    } else if (url === '/ws/cycle-command') {
                        this.cycleCommandClients.add(ws);
                        ws.on('close', () => this.cycleCommandClients.delete(ws));
                        // Estado inicial del comando de ciclo desde el DB.
                        if (config.dataSource === 'db') {
                            const estado = await dbClient.getEstadoMaquina();
                            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ command: estado?.command ?? 'stop' }));
                        }

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

    // Construye el payload de KPIs según el origen de datos configurado.
    //   'db'     → valores persistidos (mismo shape que GET /api/kpis)
    //   'modbus' → caché de registros del polling
    async _buildKpiPayload() {
        if (config.dataSource === 'db') {
            const kpi = await dbClient.getKpiLectura();
            const estado = await dbClient.getEstadoMaquina();
            return {
                cycleTime: kpi?.cycleTime ?? 0,
                productionCount: kpi?.productionCount ?? 0,
                productionTarget: kpi?.productionTarget ?? 5000,
                qualityYield: kpi?.qualityYield ?? 0,
                operationMode: estado?.mode ?? 1,
                cycleCommand: estado?.command === 'start' ? 1 : 0,
            };
        }
        const kpiRegs = registerManager.getAll().filter(reg =>
            [REGISTER_TYPES.KPIS, REGISTER_TYPES.CYCLE_COMMAND, REGISTER_TYPES.OPERATION_MODE].includes(reg.type));
        const vals = {};
        kpiRegs.forEach(reg => { vals[reg.name] = opcuaServer._getCachedValue(reg); });
        return vals;
    }

    async broadcastKpisUpdate() {
        const kpis = await this._buildKpiPayload();
        const message = JSON.stringify({ kpis });
        for (const ws of this.kpiClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    // Construye el payload del servo de inyección (servomotor_1). En modo 'db'
    // lee injection.gen_servomotor_lectura; en 'modbus' usa la caché de registros.
    async _buildServoPayload() {
        if (config.dataSource === 'db') {
            const lectura = await dbClient.getServoLectura();
            if (lectura) return lectura;
        }
        const servoRegs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SERVO);
        const vals = {};
        servoRegs.forEach(reg => { vals[reg.name] = opcuaServer._getCachedValue(reg); });
        return vals;
    }

    // Construye el payload del servo de cierre/molde (servomotor_2). En modo 'db'
    // lee clamp.vgn_servomotor_lectura; en 'modbus' el PLC no expone registros
    // dedicados a este eje, así que se aproxima con la misma caché de "servo".
    async _buildMoldServoPayload() {
        if (config.dataSource === 'db') {
            const lectura = await dbClient.getMoldServoLectura();
            if (lectura) return lectura;
        }
        const servoRegs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SERVO);
        const vals = {};
        servoRegs.forEach(reg => { vals[reg.name] = opcuaServer._getCachedValue(reg); });
        return vals;
    }

    async broadcastServoUpdate() {
        if (!this.servoClients) return;
        const servo = await this._buildServoPayload();
        const message = JSON.stringify({ servo });
        for (const ws of this.servoClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    async broadcastMoldServoUpdate() {
        if (!this.moldServoClients) return;
        const servo = await this._buildMoldServoPayload();
        const message = JSON.stringify({ servo });
        for (const ws of this.moldServoClients) {
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
