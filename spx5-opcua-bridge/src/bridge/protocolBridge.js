const config = require('../../config/config');
const mqttClient = require('../mqtt/mqttClient');
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
        logger.info('Starting SPX5 OPC UA Bridge (MQTT)...');
        try {
            // Inicializar DB primero (independiente de Modbus/OPC UA)
            await initTable(registerManager.getAll());
            startWatching();

            await opcuaServer.initialize();
            await mqttClient.connect();
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
        if (!mqttClient.isConnected) return;

        const registers = registerManager.getAll();
        for (const reg of registers) {
            if (!reg.readable) continue;

            try {
                const value = await mqttClient.readByConfig(reg);
                opcuaServer.updateCachedValue(reg.name, value, true);
            } catch (error) {
                // Silenciar "No MQTT data received yet" ya que es normal al inicio
                if (!error.message.includes('No MQTT data')) {
                    logger.warn(`Error polling ${reg.name}: ${error.message}`);
                }
            }
        }
    }

    _setupEventHandlers() {
        mqttClient.on('connected', () => logger.info('MQTT reconnected'));
        mqttClient.on('disconnected', () => logger.warn('MQTT disconnected'));
        mqttClient.on('error', (err) => logger.error(`MQTT error: ${err.message}`));
        mqttClient.on('maxRetriesReached', () => logger.error('MQTT max retries reached'));

        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    async stop() {
        logger.info('Stopping bridge...');
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        await mqttClient.disconnect();
        await opcuaServer.stop();
        await apiServer.stop();

        this.isRunning = false;
        logger.info('Bridge stopped');
        process.exit(0);
    }
}

module.exports = new ProtocolBridge();