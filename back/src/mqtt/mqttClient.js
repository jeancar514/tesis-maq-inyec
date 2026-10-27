const mqtt = require('mqtt');
const EventEmitter = require('events');
const config = require('../../config/config');
const logger = require('../utils/logger');

class MqttClient extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this._latestValues = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const { host, port, username, password, baseTopic } = config.mqtt;
            const url = `mqtt://${host}:${port}`;

            logger.info(`Connecting to MQTT broker at ${url}...`);

            const options = {
                reconnectPeriod: config.mqtt.retryInterval || 3000,
                connectTimeout: config.mqtt.timeout || 5000,
                clean: true,
            };
            if (username) options.username = username;
            if (password) options.password = password;

            this.client = mqtt.connect(url, options);

            this.client.on('connect', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('MQTT connection established');

                // Suscribirse al topic base para recibir valores de registros
                // Formato esperado: spx5/registers/+  (ej: spx5/registers/cycleTime)
                const topic = `${baseTopic}/registers/+`;
                this.client.subscribe(topic, (err) => {
                    if (err) {
                        logger.error(`Error subscribing to ${topic}: ${err.message}`);
                    } else {
                        logger.info(`Subscribed to ${topic}`);
                    }
                });

                this.emit('connected');
                resolve(true);
            });

            this.client.on('message', (topic, message) => {
                try {
                    // topic: spx5/registers/<registerName>
                    const parts = topic.split('/');
                    const registerName = parts[parts.length - 1];
                    const payload = JSON.parse(message.toString());
                    const value = payload.value !== undefined ? payload.value : payload;
                    this._latestValues.set(registerName, value);
                } catch (err) {
                    logger.warn(`Error parsing MQTT message on ${topic}: ${err.message}`);
                }
            });

            this.client.on('reconnect', () => {
                this.reconnectAttempts++;
                logger.info(`MQTT reconnecting (attempt ${this.reconnectAttempts})...`);

                if (config.mqtt.maxRetries && this.reconnectAttempts >= config.mqtt.maxRetries) {
                    logger.error('MQTT max retries reached');
                    this.client.end();
                    this.emit('maxRetriesReached');
                }
            });

            this.client.on('close', () => {
                if (this.isConnected) {
                    this.isConnected = false;
                    logger.warn('MQTT connection lost');
                    this.emit('disconnected');
                }
            });

            this.client.on('error', (err) => {
                logger.error(`MQTT error: ${err.message}`);
                // Only emit 'error' if there are external listeners to avoid unhandled crash
                if (this.listenerCount('error') > 0) this.emit('error', err);
                if (!this.isConnected) reject(err);
            });
        });
    }

    /**
     * Lee el último valor recibido por MQTT para un registro.
     * Compatible con la interfaz de modbusClient.readByConfig()
     */
    async readByConfig(registerConfig) {
        this._checkConnection();
        const { name, scaleFactor } = registerConfig;
        const value = this._latestValues.get(name);

        if (value === undefined) {
            throw new Error(`No MQTT data received yet for ${name}`);
        }

        // Aplicar scaleFactor si aplica (mismo comportamiento que Modbus)
        if (typeof value === 'number' && scaleFactor) {
            return value * scaleFactor;
        }
        return value;
    }

    /**
     * Escribe un valor publicando en el topic de comandos MQTT.
     * Compatible con la interfaz de modbusClient.writeByConfig()
     */
    async writeByConfig(registerConfig, value) {
        this._checkConnection();
        const { name, writable } = registerConfig;

        if (!writable) throw new Error(`Register ${name} is read-only`);

        const { baseTopic } = config.mqtt;
        const topic = `${baseTopic}/commands/${name}`;
        const payload = JSON.stringify({ value, timestamp: Date.now() });

        return new Promise((resolve, reject) => {
            this.client.publish(topic, payload, { qos: 1 }, (err) => {
                if (err) {
                    logger.error(`Error writing ${name} via MQTT: ${err.message}`);
                    reject(err);
                } else {
                    logger.info(`Published ${value} to ${topic}`);
                    resolve();
                }
            });
        });
    }

    _checkConnection() {
        if (!this.isConnected) throw new Error('No active MQTT connection');
    }

    async disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
            logger.info('MQTT connection closed');
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            host: config.mqtt.host,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

module.exports = new MqttClient();
