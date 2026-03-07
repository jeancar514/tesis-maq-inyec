/**
 * CONFIGURACIÓN CENTRALIZADA DEL PUENTE SPX5
 */

module.exports = {
    // CONFIGURACIÓN DEL SPX5 (MODBUS TCP)
    modbus: {
        host: process.env.SPX5_HOST,
        port: parseInt(process.env.SPX5_PORT),
        unitId: parseInt(process.env.SPX5_UNIT_ID),
        timeout: 5000,
        retryInterval: 3000,
        maxRetries: 5
    },

    // CONFIGURACIÓN DE LA API REST
    api: {
        port: parseInt(process.env.API_PORT) || 3000
    },

    // CONFIGURACIÓN DEL SERVIDOR OPC UA
    opcua: {
        port: parseInt(process.env.OPCUA_PORT),
        resourcePath: '/UA/SPX5Bridge',
        buildInfo: {
            productName: 'SPX5 OPC UA Bridge',
            buildNumber: '1.0.0',
            buildDate: new Date()
        },
        serverInfo: {
            applicationUri: 'urn:SPX5:OPCUABridge',
            productUri: 'SPX5-Bridge',
            applicationName: { text: 'SPX5 OPC UA Bridge Server' }
        },
        allowAnonymous: true,
        securityMode: 'None',
        securityPolicy: 'None'
    },

    // CONFIGURACIÓN DE LOGGING
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            enabled: true,
            path: './logs/bridge.log',
            maxSize: '10m',
            maxFiles: 5
        },
        console: {
            enabled: true,
            colorize: true
        }
    },

    // CONFIGURACIÓN DE POLLING
    polling: {
        enabled: true,
        intervalMs: 1000,
        batchSize: 10
    }
};