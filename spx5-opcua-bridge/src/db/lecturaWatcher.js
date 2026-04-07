const { insertLectura } = require('./dbClient');
const registerManager   = require('../utils/registerManager');
const opcuaServer       = require('../opcua/opcuaServer');
const logger            = require('../utils/logger');

let debounceTimer = null;

async function saveSnapshot() {
    try {
        const values = {};
        for (const reg of registerManager.getAll()) {
            values[reg.name] = opcuaServer._getCachedValue(reg);
        }
        await insertLectura(values);
        logger.info('Lectura guardada en DB');
    } catch (err) {
        logger.error(`Error guardando lectura en DB: ${err.message}`);
    }
}

// Llamado desde opcuaServer cada vez que cambia un valor.
// Debounce de 300ms para agrupar cambios simultáneos del polling.
function saveOnChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveSnapshot, 300);
}

function startWatching() {
    logger.info('LecturaWatcher activo: guardará en DB al detectar cambios');
}

module.exports = { startWatching, saveOnChange };
