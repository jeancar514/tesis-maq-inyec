const {
    OPCUAServer,
    Variant,
    DataType,
    StatusCodes,
    standardUnits,
    makeAccessLevelFlag
} = require('node-opcua');

const config = require('../../config/config');
const mqttClient = require('../mqtt/mqttClient');
const registerManager = require('../utils/registerManager');
const logger = require('../utils/logger');

class OPCUABridgeServer {
    constructor() {
        this.server = null;
        this.addressSpace = null;
        this.namespace = null;
        this.variableNodes = new Map();
        this._valueCache = new Map();
        this._writeProtection = new Map();
        this._writeProtectionMs = 5000;
    }

    async initialize() {
        logger.info('Initializing OPC UA Server...');
        this.server = new OPCUAServer({
            port: config.opcua.port,
            resourcePath: config.opcua.resourcePath,
            buildInfo: config.opcua.buildInfo,
            serverInfo: config.opcua.serverInfo,
            allowAnonymous: config.opcua.allowAnonymous
        });

        await this.server.initialize();
        this._constructAddressSpace();
        logger.info('OPC UA Server initialized');
    }

    _constructAddressSpace() {
        this.addressSpace = this.server.engine.addressSpace;
        this.namespace = this.addressSpace.getOwnNamespace();

        const deviceNode = this.namespace.addFolder(this.addressSpace.rootFolder.objects, {
            browseName: 'SPX5_Gateway',
            displayName: 'SPX5 Industrial Gateway'
        });

        const folders = {
            inputs: this.namespace.addFolder(deviceNode, { browseName: 'Inputs', displayName: 'Inputs' }),
            outputs: this.namespace.addFolder(deviceNode, { browseName: 'Outputs', displayName: 'Outputs' }),
            status: this.namespace.addFolder(deviceNode, { browseName: 'Status', displayName: 'Status' })
        };

        const registers = registerManager.getAll();
        for (const reg of registers) {
            this._createVariableNode(reg, folders);
        }

        this._createConnectionStatusNode(folders.status);
        logger.info(`${registers.length} OPC UA nodes created`);
    }

    _createVariableNode(reg, folders) {
        let parent = folders.inputs;
        if (reg.writable) parent = folders.outputs;

        const dataType = this._mapDataType(reg.opcuaDataType);
        const accessLevel = reg.writable ? makeAccessLevelFlag('CurrentRead | CurrentWrite') : makeAccessLevelFlag('CurrentRead');

        const variable = this.namespace.addVariable({
            componentOf: parent,
            nodeId: `s=${reg.name}`,
            browseName: reg.name,
            displayName: reg.name,
            dataType: dataType,
            accessLevel: accessLevel,
            value: {
                get: () => new Variant({ dataType, value: this._getCachedValue(reg) }),
                set: reg.writable ? (variant) => this._handleSetter(reg, variant) : undefined
            }
        });

        if (reg.unit) this._addEngineeringUnits(variable, reg.unit);
        this.variableNodes.set(reg.name, { node: variable, config: reg });
    }

    _handleSetter(reg, variant) {
        if (!mqttClient.isConnected) return StatusCodes.BadNotConnected;

        const value = variant.value;
        if (reg.minValue !== undefined && value < reg.minValue) return StatusCodes.BadOutOfRange;
        if (reg.maxValue !== undefined && value > reg.maxValue) return StatusCodes.BadOutOfRange;

        setImmediate(async () => {
            try {
                await mqttClient.writeByConfig(reg, value);
                this.updateCachedValue(reg.name, value);
                this.markAsWritten(reg.name);
            } catch (err) {
                logger.error(`Error writing to ${reg.name}: ${err.message}`);
            }
        });
        return StatusCodes.Good;
    }

    _createConnectionStatusNode(parent) {
        this.namespace.addVariable({
            componentOf: parent,
            nodeId: 's=ModbusConnectionStatus',
            browseName: 'BrokerConnectionStatus',
            dataType: DataType.Boolean,
            value: { get: () => new Variant({ dataType: DataType.Boolean, value: mqttClient.isConnected }) }
        });
    }

    _getCachedValue(reg) {
        return this._valueCache.get(reg.name) ?? this._getDefaultValue(reg.opcuaDataType);
    }

    updateCachedValue(name, value, fromPolling = false) {
        if (fromPolling && this._isWriteProtected(name)) {
            return;
        }
        const prev = this._valueCache.get(name);
        this._valueCache.set(name, value);

        // Solo guardar en DB si hubo cambio real
        const changed = prev !== value;

        try {
            const { REGISTER_TYPES } = require('../api/constant');
            const ApiServer = require('../api/apiServer');
            const reg = registerManager.getByName(name);
            if (!reg) return;

            // Broadcast siempre (el front necesita recibir el estado actual)
            switch (reg.type) {
                case REGISTER_TYPES.KPIS:
                    ApiServer.broadcastKpisUpdate?.();
                    break;
                case REGISTER_TYPES.SERVO:
                    ApiServer.broadcastServoUpdate?.();
                    break;
                case REGISTER_TYPES.OPERATION_MODE:
                    ApiServer.broadcastOperationModeUpdate?.(value);
                    break;
                case REGISTER_TYPES.CYCLE_COMMAND:
                    ApiServer.broadcastCycleCommandUpdate?.(value ? 'start' : 'stop');
                    break;
            }

            // DB solo si cambió
            if (changed) {
                const { saveOnChange } = require('../db/lecturaWatcher');
                saveOnChange();
            }
        } catch (e) {
            logger.error(`updateCachedValue broadcast error [${name}]: ${e.message}`);
        }
    }
    markAsWritten(name) {
        this._writeProtection.set(name, Date.now());
    }
    _isWriteProtected(name) {
        const writeTime = this._writeProtection.get(name);
        if (!writeTime) return false;
        if (Date.now() - writeTime > this._writeProtectionMs) {
            this._writeProtection.delete(name);
            return false;
        }
        return true;
    }

    _mapDataType(type) {
        const types = {
            'Boolean': DataType.Boolean,
            'Int16': DataType.Int16, 'UInt16': DataType.UInt16,
            'Int32': DataType.Int32, 'UInt32': DataType.UInt32,
            'Float': DataType.Float, 'Double': DataType.Double,
            'String': DataType.String
        };
        return types[type] || DataType.Double;
    }

    _getDefaultValue(type) {
        if (type === 'Boolean') return false;
        if (type === 'String') return '';
        return 0;
    }

    _addEngineeringUnits(variable, unit) {
        const unitMap = {
            '°C': standardUnits.degree_celsius,
            'Bar': standardUnits.bar,
            'L/min': standardUnits.litre_per_minute,
            '%': standardUnits.percent
        };
        if (unitMap[unit]) variable.euInformation = unitMap[unit];
    }

    async start() {
        await this.server.start();
        logger.info(`Server started at: ${this.getEndpointUrl()}`);
    }

    async stop() {
        if (this.server) {
            await this.server.shutdown();
            logger.info('OPC UA Server stopped');
        }
    }

    getEndpointUrl() {
        return this.server?.endpoints[0]?.endpointDescriptions()[0]?.endpointUrl || '';
    }
}

module.exports = new OPCUABridgeServer();