const ModbusRTU = require('modbus-serial');
const EventEmitter = require('events');
const config = require('../../config/config');
const logger = require('../utils/logger');

class ModbusClient extends EventEmitter {
    constructor() {
        super();
        this.client = new ModbusRTU();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
    }

    async connect() {
        try {
            logger.info(`Connecting to SPX5 at ${config.modbus.host}:${config.modbus.port}...`);
            this.client.setTimeout(config.modbus.timeout);
            await this.client.connectTCP(config.modbus.host, { port: config.modbus.port });
            this.client.setID(config.modbus.unitId);

            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.info('Modbus TCP connection established');
            this.emit('connected');

            this.client.on('close', () => this._handleDisconnect());
            this.client.on('error', (err) => this._handleError(err));

            return true;
        } catch (error) {
            logger.error(`Modbus connection error: ${error.message}`);
            this._scheduleReconnect();
            return false;
        }
    }

    _handleDisconnect() {
        if (this.isConnected) {
            this.isConnected = false;
            logger.warn('Modbus connection lost');
            this.emit('disconnected');
            this._scheduleReconnect();
        }
    }

    _handleError(error) {
        logger.error(`Modbus error: ${error.message}`);
        this.emit('error', error);
    }

    _scheduleReconnect() {
        if (this.reconnectTimer) return;

        if (this.reconnectAttempts >= config.modbus.maxRetries) {
            logger.error('Max retries reached. Stopping reconnection.');
            this.emit('maxRetriesReached');
            return;
        }

        this.reconnectAttempts++;
        logger.info(`Retrying in ${config.modbus.retryInterval}ms (attempt ${this.reconnectAttempts}/${config.modbus.maxRetries})...`);

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            await this.connect();
        }, config.modbus.retryInterval);
    }

    _checkConnection() {
        if (!this.isConnected) throw new Error('No active Modbus connection');
    }

    async readByConfig(registerConfig) {
        this._checkConnection();
        const { modbusType, modbusAddress, scaleFactor } = registerConfig;

        try {
            let data;
            switch (modbusType) {
                case 'coil':
                    data = (await this.client.readCoils(modbusAddress, 1)).data[0];
                    return data;
                case 'discreteInput':
                    data = (await this.client.readDiscreteInputs(modbusAddress, 1)).data[0];
                    return data;
                case 'holdingRegister':
                    data = (await this.client.readHoldingRegisters(modbusAddress, 1)).data[0];
                    return data * (scaleFactor || 1);
                case 'inputRegister':
                    data = (await this.client.readInputRegisters(modbusAddress, 1)).data[0];
                    return data * (scaleFactor || 1);
                default:
                    throw new Error(`Unsupported register type: ${modbusType}`);
            }
        } catch (error) {
            logger.error(`Error reading ${registerConfig.name}: ${error.message}`);
            throw error;
        }
    }

    async writeByConfig(registerConfig, value) {
        console.log("writeByConfig")
        this._checkConnection();
        const { modbusType, modbusAddress, scaleFactor, writable } = registerConfig;

        if (!writable) throw new Error(`Register ${registerConfig.name} is read-only`);

        try {
            switch (modbusType) {
                case 'coil':
                    await this.client.writeCoil(modbusAddress, Boolean(value));
                    break;
                case 'holdingRegister':
                    const scaledValue = Math.round(value / (scaleFactor || 1));
                    await this.client.writeRegisters(modbusAddress, [scaledValue]);
                    break;
                default:
                    throw new Error(`Cannot write to type: ${modbusType}`);
            }
            logger.info(`Written ${value} to ${registerConfig.name}`);
        } catch (error) {
            logger.error(`Error writing ${registerConfig.name}: ${error.message}`);
            throw error;
        }
    }

    async disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.isConnected) {
            await this.client.close();
            this.isConnected = false;
            logger.info('Modbus connection closed');
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            host: config.modbus.host,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = new ModbusClient();