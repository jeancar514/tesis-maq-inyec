const config = require('../../config/config');
const modbusClient = require('../modbus/modbusClient');
const opcuaServer = require('../opcua/opcuaServer');
const apiServer = require('../api/apiServer');
const registerManager = require('../utils/registerManager');
const logger = require('../utils/logger');
const { initTable } = require('../db/dbClient');
const { startWatching } = require('../db/lecturaWatcher');

class ProtocolBridge {
    constructor() {
        this.pollingInterval = null;
        this.isRunning = false;
    }

    async start() {
        logger.info('Starting SPX5 OPC UA Bridge...');
        try {
            // Inicializar DB primero (independiente de Modbus/OPC UA)
            await initTable(registerManager.getAll());
            startWatching();

            await opcuaServer.initialize();

            // Modbus no es crítico para el API — si falla, el servidor sigue corriendo
            try {
                await modbusClient.connect();
            } catch (modbusErr) {
                logger.warn(`Modbus no disponible al arrancar: ${modbusErr.message} — reintentando en background`);
            }

            await opcuaServer.start();
            await apiServer.start();

            this._startPolling();
            this._setupEventHandlers();

            this.isRunning = true;
            logger.info('Bridge started successfully');
        } catch (error) {
            logger.error(`Fatal error starting bridge: ${error.message}`);
            throw error;
        }
    }

    _startPolling() {
        if (!config.polling.enabled) {
            logger.info('Polling disabled');
            return;
        }

        logger.info(`Polling started (every ${config.polling.intervalMs}ms)`);
        this.pollingInterval = setInterval(() => this._pollAllRegisters(), config.polling.intervalMs);
    }

    async _pollAllRegisters() {
        if (!modbusClient.isConnected) return;

        const registers = registerManager.getAll();
        for (const reg of registers) {
            if (!reg.readable) continue;

            try {
                const value = await modbusClient.readByConfig(reg);
                opcuaServer.updateCachedValue(reg.name, value, true);
            } catch (error) {
                logger.warn(`Error polling ${reg.name}: ${error.message}`);
            }
        }
    }

    _setupEventHandlers() {
        modbusClient.on('connected', () => logger.info('Modbus reconnected'));
        modbusClient.on('disconnected', () => logger.warn('Modbus disconnected'));
        modbusClient.on('error', (err) => logger.error(`Modbus error: ${err.message}`));
        modbusClient.on('maxRetriesReached', () => logger.error('Modbus max retries reached'));

        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    async stop() {
        logger.info('Stopping bridge...');
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        await modbusClient.disconnect();
        await opcuaServer.stop();
        await apiServer.stop();

        this.isRunning = false;
        logger.info('Bridge stopped');
        process.exit(0);
    }
}

module.exports = new ProtocolBridge();