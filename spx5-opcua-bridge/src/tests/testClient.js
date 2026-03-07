/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CLIENTE DE PRUEBA OPC UA
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    DataType
} = require('node-opcua');

const endpointUrl = 'opc.tcp://localhost:4840/UA/SPX5Bridge';

async function main() {
    console.log('🔌 Conectando al servidor OPC UA...');

    const client = OPCUAClient.create({
        applicationName: 'SPX5TestClient',
        connectionStrategy: {
            initialDelay: 1000,
            maxRetry: 3
        },
        securityMode: MessageSecurityMode.None,
        securityPolicy: SecurityPolicy.None,
        endpointMustExist: false
    });

    try {
        // Conectar
        await client.connect(endpointUrl);
        console.log('✅ Conectado!\n');

        // Crear sesión
        const session = await client.createSession();
        console.log('📋 Sesión creada\n');

        // ═══════════════════════════════════════════════════════════════════
        // LEER VALORES
        // ═══════════════════════════════════════════════════════════════════
        console.log('📖 LEYENDO VALORES:');
        console.log('─'.repeat(50));

        const nodesToRead = [
            'ns=1;s=Temperature',
            'ns=1;s=Pressure',
            'ns=1;s=TemperatureSetpoint',
            'ns=1;s=PumpRunning',
            'ns=1;s=ModbusConnectionStatus'
        ];

        for (const nodeId of nodesToRead) {
            try {
                const dataValue = await session.read({
                    nodeId: nodeId,
                    attributeId: AttributeIds.Value
                });
                console.log(`  ${nodeId.split(';s=')[1]}: ${dataValue.value.value}`);
            } catch (e) {
                console.log(`  ${nodeId}: Error - ${e.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // ESCRIBIR VALORES
        // ═══════════════════════════════════════════════════════════════════
        console.log('\n✏️ ESCRIBIENDO VALORES:');
        console.log('─'.repeat(50));

        // Escribir setpoint de temperatura
        const writeResult = await session.write({
            nodeId: 'ns=1;s=TemperatureSetpoint',
            attributeId: AttributeIds.Value,
            value: {
                value: {
                    dataType: DataType.Double,
                    value: 25.5
                }
            }
        });
        console.log(`  TemperatureSetpoint = 25.5: ${writeResult.name}`);

        // Escribir estado de bomba
        const writeResult2 = await session.write({
            nodeId: 'ns=1;s=PumpRunning',
            attributeId: AttributeIds.Value,
            value: {
                value: {
                    dataType: DataType.Boolean,
                    value: true
                }
            }
        });
        console.log(`  PumpRunning = true: ${writeResult2.name}`);

        // ═══════════════════════════════════════════════════════════════════
        // SUSCRIPCIÓN A CAMBIOS
        // ═══════════════════════════════════════════════════════════════════
        console.log('\n📡 SUSCRIPCIÓN (10 segundos):');
        console.log('─'.repeat(50));

        const subscription = await session.createSubscription2({
            requestedPublishingInterval: 1000,
            requestedMaxKeepAliveCount: 10,
            publishingEnabled: true
        });

        const monitoredItem = await subscription.monitor(
            { nodeId: 'ns=1;s=Temperature', attributeId: AttributeIds.Value },
            { samplingInterval: 1000, discardOldest: true, queueSize: 10 },
            2 // TimestampsToReturn.Both
        );

        monitoredItem.on('changed', (dataValue) => {
            console.log(`  📊 Temperature cambió: ${dataValue.value.value}`);
        });

        // Esperar 10 segundos
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Cerrar
        await subscription.terminate();
        await session.close();
        await client.disconnect();

        console.log('\n✅ Prueba completada!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();