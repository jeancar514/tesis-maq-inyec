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
        // Para valores de 32 bits, se recomponen desde High/Low words
        this.app.get(ROUTES.SCREW_CONTROL, (req, res) => {
            try {
                const regs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.SCREW_CONTROL);
                const values = {};

                // Agrupar registros High/Low para valores de 32 bits
                const processed = new Set();

                regs.forEach(reg => {
                    // Si es parte de un valor de 32 bits, recomponer
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
                        // Ya procesado con el High
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

        // POST /api/screw-control — escribir uno o varios registros de control
        // Body: { controlEncendido?: 0|1, velocidadHusillo?: number, torqueHusillo?: number }
        // Para valores de 32 bits (velocidadHusillo, torqueHusillo), se dividen en High/Low words
        this.app.post(ROUTES.SCREW_CONTROL, async (req, res) => {
            const allowed = ['controlEncendido', 'velocidadHusillo', 'torqueHusillo'];
            const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
            if (entries.length === 0)
                return res.status(400).json({ error: `Body must include at least one of: ${allowed.join(', ')}` });

            const results = {};
            for (const [name, value] of entries) {
                // Buscar registros High/Low para valores de 32 bits
                const highReg = registerManager.getAll().find(r => r.name === `${name}High`);
                const lowReg = registerManager.getAll().find(r => r.name === `${name}Low`);

                if (highReg && lowReg) {
                    // Valor de 32 bits: dividir en High Word y Low Word
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
                    // Valor de 16 bits normal
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

        // GET /api/mold-control — leer valores actuales de los registros de control del molde
        this.app.get(ROUTES.MOLD_CONTROL, (req, res) => {
            try {
                const regs = registerManager.getAll().filter(reg => reg.type === REGISTER_TYPES.MOLD_CONTROL);
                const values = {};
                regs.forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
                res.json(values);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // POST /api/mold-control — escribir uno o varios registros de control del molde
        // Body: { moldControlEncendido?, moldTorque?, moldCambioPosicion?, moldPosicion1?, moldPosicion2?, moldVelocidadPosicion? }
        this.app.post(ROUTES.MOLD_CONTROL, async (req, res) => {
            const allowed = ['moldControlEncendido', 'moldTorque', 'moldCambioPosicion', 'moldPosicion1', 'moldPosicion2', 'moldVelocidadPosicion'];
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

        // ── Carro de Inyección y Eyector ──────────────────────────────────
        // Ambos comparten la misma lógica de control por posición que el molde.
        // Se registran de forma genérica: GET devuelve todos los registros del
        // tipo; POST escribe únicamente los registros writable de ese tipo.
        const registerControlRoutes = (route, regType) => {
            this.app.get(route, (req, res) => {
                try {
                    const regs = registerManager.getAll().filter(reg => reg.type === regType);
                    const values = {};
                    regs.forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
                    res.json(values);
                } catch (err) {
                    res.status(500).json({ error: err.message });
                }
            });

            this.app.post(route, async (req, res) => {
                const writableNames = registerManager.getAll()
                    .filter(reg => reg.type === regType && reg.writable)
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
        };

        registerControlRoutes(ROUTES.CARRIAGE_CONTROL, REGISTER_TYPES.CARRIAGE_CONTROL);
        registerControlRoutes(ROUTES.EJECTOR_CONTROL, REGISTER_TYPES.EJECTOR_CONTROL);

        // ── Movimiento por posición (Pos1/Pos2 + disparo de Cambio de Posición) ──
        // La asignación de posiciones ocurre EXACTAMENTE al pulsar "Ir":
        //   1. Lee la posición real del PLC en ese instante (Y).
        //   2. Escribe Y en Posición 1.
        //   3. Escribe X (objetivo) en Posición 2.
        //   4. Dispara la variable Cambio de Posición.
        // Así el PLC evalúa posiciones estáticas exactas, sin lecturas desfasadas.
        const POSITION_MOVE = {
            [REGISTER_TYPES.MOLD_CONTROL]:     { pos1: 'moldPosicion1',     pos2: 'moldPosicion2',     cambio: 'moldCambioPosicion',     current: 'moldPosicion1' },
            [REGISTER_TYPES.CARRIAGE_CONTROL]: { pos1: 'carriagePosicion1', pos2: 'carriagePosicion2', cambio: 'carriageCambioPosicion', current: 'carriagePosicion' },
            [REGISTER_TYPES.EJECTOR_CONTROL]:  { pos1: 'ejectorPosicion1',  pos2: 'ejectorPosicion2',  cambio: 'ejectorCambioPosicion',  current: 'ejectorPosicion' },
        };

        const registerMoveRoute = (route, regType) => {
            this.app.post(route, async (req, res) => {
                const cfg = POSITION_MOVE[regType];
                if (!cfg) return res.status(400).json({ error: 'Move not supported for this type' });

                const target = Number(req.body.target);
                if (Number.isNaN(target)) return res.status(400).json({ error: 'Field "target" (number) is required' });

                const all = registerManager.getAll();
                const pos1Reg = all.find(r => r.name === cfg.pos1);
                const pos2Reg = all.find(r => r.name === cfg.pos2);
                const cambioReg = all.find(r => r.name === cfg.cambio);
                const currentReg = all.find(r => r.name === cfg.current);
                if (!pos1Reg || !pos2Reg || !cambioReg) return res.status(404).json({ error: 'Position registers not found' });

                try {
                    // 1 ─ Leer la posición REAL del PLC en este instante (Y)
                    let current;
                    try {
                        current = await modbusClient.readByConfig(currentReg);
                    } catch {
                        current = opcuaServer._getCachedValue(currentReg) || 0;
                    }
                    current = Math.round(Number(current) || 0);

                    // 2 ─ Escribir Y en Posición 1
                    await modbusClient.writeByConfig(pos1Reg, current);
                    opcuaServer.updateCachedValue(pos1Reg.name, current);
                    opcuaServer.markAsWritten(pos1Reg.name);

                    // 3 ─ Escribir X (objetivo) en Posición 2
                    await modbusClient.writeByConfig(pos2Reg, target);
                    opcuaServer.updateCachedValue(pos2Reg.name, target);
                    opcuaServer.markAsWritten(pos2Reg.name);

                    // 4 ─ Disparar Cambio de Posición (trigger)
                    const triggerVal = req.body.cambio !== undefined
                        ? Number(req.body.cambio)
                        : (Number(opcuaServer._getCachedValue(cambioReg)) || 1);
                    await modbusClient.writeByConfig(cambioReg, triggerVal);
                    opcuaServer.updateCachedValue(cambioReg.name, triggerVal);
                    opcuaServer.markAsWritten(cambioReg.name);

                    res.json({ success: true, currentPosition: current, target, trigger: triggerVal });
                } catch (err) {
                    res.status(500).json({ error: err.message });
                }
            });
        };

        registerMoveRoute(`${ROUTES.MOLD_CONTROL}/move`, REGISTER_TYPES.MOLD_CONTROL);
        registerMoveRoute(`${ROUTES.CARRIAGE_CONTROL}/move`, REGISTER_TYPES.CARRIAGE_CONTROL);
        registerMoveRoute(`${ROUTES.EJECTOR_CONTROL}/move`, REGISTER_TYPES.EJECTOR_CONTROL);

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