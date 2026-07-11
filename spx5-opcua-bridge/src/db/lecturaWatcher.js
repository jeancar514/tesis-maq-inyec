const {
    insertServoLectura,
    insertKpiLectura,
    upsertHusilloConfig,
    upsertMoldeConfig,
    upsertCarroConfig,
    upsertEyectorConfig,
    upsertModoOperacion,
    upsertComandoCiclo,
} = require('./dbClient');
const registerManager = require('../utils/registerManager');
const opcuaServer     = require('../opcua/opcuaServer');
const logger          = require('../utils/logger');
const { REGISTER_TYPES } = require('../api/constant');

let debounceTimer = null;

// Combina dos palabras de 16 bits en un entero de 32 bits (high<<16 | low).
function combine32(high, low) {
    const h = Number(high) || 0;
    const l = Number(low) || 0;
    return (h << 16) | (l & 0xffff);
}

// Construye un mapa {nombreRegistro: valor} con los valores cacheados actuales.
function snapshotValues() {
    const values = {};
    for (const reg of registerManager.getAll()) {
        values[reg.name] = opcuaServer._getCachedValue(reg);
    }
    return values;
}

async function saveSnapshot() {
    try {
        const v = snapshotValues();

        // Servomotor de inyección (registros tipo 'servo' del bridge actual).
        // Nota: el SPX5 solo expone hoy un único juego de registros Modbus tipo
        // "servo" (velocidad/torque/posición/corriente/voltaje), correspondiente
        // al eje de inyección. El servomotor de molde (clamp.vgn_servomotor_lectura)
        // no tiene aún registros físicos dedicados, por lo que no se alimenta desde
        // aquí para evitar duplicar la misma lectura bajo una identidad distinta.
        await insertServoLectura({
            velocidad: v.speed,
            torque:    v.torque,
            posicion:  v.position,
            corriente: v.current,
            voltaje:   v.voltage,
        });

        // KPIs de la máquina
        await insertKpiLectura({
            tiempoCiclo:        v.cycleTime,
            conteoProduccion:   v.productionCount,
            objetivoProduccion: v.productionTarget ?? 5000,
            rendimientoCalidad: v.qualityYield,
        });

        // Modo de operación (tabla: gen_modo_operacion)
        await upsertModoOperacion({
            modo: v.operationMode,
        });

        // Comando de ciclo (tabla: gen_comando_ciclo)
        const comando = typeof v.cycleCommand === 'boolean'
            ? (v.cycleCommand ? 'start' : 'stop')
            : (v.cycleCommand ? 'start' : 'stop');
        await upsertComandoCiclo({
            comando,
            activa: comando === 'start',
        });

        // Husillo (setpoints)
        await upsertHusilloConfig('husillo', {
            controlEncendido: v.controlEncendido,
            velocidadHusillo: combine32(v.velocidadHusilloHigh, v.velocidadHusilloLow),
            torqueHusillo:    v.torqueHusillo,
        });

        // Molde (setpoints)
        await upsertMoldeConfig('molde', {
            controlEncendido:  v.moldControlEncendido,
            torque:            v.moldTorque,
            cambioPosicion:    v.moldCambioPosicion,
            posicion1:         v.moldPosicion1,
            posicion2:         v.moldPosicion2,
            velocidadPosicion: v.moldVelocidadPosicion,
        });

        // Carro de inyección (setpoints)
        await upsertCarroConfig({
            controlEncendido:  v.carriageControlEncendido,
            torque:            v.carriageTorque,
            cambioPosicion:    v.carriageCambioPosicion,
            posicion1:         v.carriagePosicion1,
            posicion2:         v.carriagePosicion2,
            velocidadPosicion: v.carriageVelocidadPosicion,
        });

        // Eyector (setpoints)
        await upsertEyectorConfig({
            controlEncendido:  v.ejectorControlEncendido,
            torque:            v.ejectorTorque,
            cambioPosicion:    v.ejectorCambioPosicion,
            posicion1:         v.ejectorPosicion1,
            posicion2:         v.ejectorPosicion2,
            velocidadPosicion: v.ejectorVelocidadPosicion,
        });

        logger.info('Snapshot normalizado guardado en DB');
    } catch (err) {
        logger.error(`Error guardando lectura en DB: ${err.message}`);
    }
}

// Llamado desde opcuaServer cuando cambia un valor.
// Debounce de 300ms para agrupar cambios simultáneos del polling.
function saveOnChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSnapshot, 300);
}

function startWatching() {
    logger.info('LecturaWatcher activo: guardará en tablas normalizadas al detectar cambios');
}

module.exports = { startWatching, saveOnChange };
