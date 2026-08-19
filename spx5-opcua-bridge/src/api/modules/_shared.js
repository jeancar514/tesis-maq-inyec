// ─────────────────────────────────────────────────────────────────────────────
// Helpers compartidos entre los routers por módulo.
// Centraliza la lógica común de lectura/escritura de registros y de movimiento
// por posición (Pos1/Pos2 + disparo de Cambio de Posición).
// ─────────────────────────────────────────────────────────────────────────────
const modbusClient = require('../../modbus/modbusClient');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const config = require('../../../config/config');
const { REGISTER_TYPES } = require('../constant');

const VALID_MODBUS_TYPES = ['inputRegister', 'holdingRegister', 'coil', 'discreteInput'];

function validateRegisterPatch(patch) {
    const clean = {};
    if (patch.modbusType !== undefined) {
        if (!VALID_MODBUS_TYPES.includes(patch.modbusType))
            return { error: `modbusType inválido. Use: ${VALID_MODBUS_TYPES.join(', ')}` };
        clean.modbusType = patch.modbusType;
    }
    if (patch.modbusAddress !== undefined) {
        const addr = Number(patch.modbusAddress);
        if (!Number.isInteger(addr) || addr < 0 || addr > 65535)
            return { error: 'modbusAddress debe ser un entero entre 0 y 65535' };
        clean.modbusAddress = addr;
    }
    if (patch.opcuaDataType !== undefined) {
        if (typeof patch.opcuaDataType !== 'string' || !patch.opcuaDataType.trim())
            return { error: 'opcuaDataType debe ser un texto válido' };
        clean.opcuaDataType = patch.opcuaDataType;
    }
    if (patch.scaleFactor !== undefined) {
        const sf = Number(patch.scaleFactor);
        if (Number.isNaN(sf) || sf === 0) return { error: 'scaleFactor debe ser un número distinto de 0' };
        clean.scaleFactor = sf;
    }
    if (patch.unit !== undefined) clean.unit = String(patch.unit);
    if (patch.description !== undefined) clean.description = String(patch.description);
    if (patch.readable !== undefined) clean.readable = Boolean(patch.readable);
    if (patch.writable !== undefined) clean.writable = Boolean(patch.writable);
    if (patch.is32Bit !== undefined) clean.is32Bit = Boolean(patch.is32Bit);
    if (patch.bitPosition !== undefined) clean.bitPosition = patch.bitPosition;
    return { clean };
}

// Devuelve { nombreRegistro: valorCacheado } para un tipo de registro.
function readValuesByType(regType) {
    const values = {};
    registerManager.getAll()
        .filter(reg => reg.type === regType)
        .forEach(reg => { values[reg.name] = opcuaServer._getCachedValue(reg); });
    return values;
}

// GET/POST genérico de control por tipo (lectura de caché + escritura de writables).
// dbGetter (opcional): función async que devuelve los setpoints desde la DB; si se
// provee y config.dataSource === 'db', el GET responde con esos valores (doble fuente).
function attachControlRoutes(router, route, regType, dbGetter) {
    router.get(route, async (req, res) => {
        try {
            if (dbGetter && config.dataSource === 'db') {
                const dbValues = await dbGetter();
                if (dbValues) return res.json({ ...dbValues, _source: 'db' });
            }
            res.json({ ...readValuesByType(regType), _source: 'modbus' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post(route, async (req, res) => {
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
}

// "Cambio de Posición" es un SELECTOR, no un pulso genérico: solo admite 1 o 2,
// indicando a cuál de las dos posiciones configuradas (Pos1 o Pos2) debe moverse
// el eje. Por defecto/en reposo vale 2 (equivale a "Posición 2" como destino).
const CAMBIO_POSICION = { POS1: 1, POS2: 2, DEFAULT: 2 };

// Mapa de registros de posición por tipo, usado por el movimiento "Ir a posición".
const POSITION_MOVE = {
    [REGISTER_TYPES.MOLD_CONTROL]:     { pos1: 'moldPosicion1',     pos2: 'moldPosicion2',     cambio: 'moldCambioPosicion',     current: 'moldPosicion' },
    [REGISTER_TYPES.CARRIAGE_CONTROL]: { pos1: 'carriagePosicion1', pos2: 'carriagePosicion2', cambio: 'carriageCambioPosicion', current: 'carriagePosicion' },
    [REGISTER_TYPES.EJECTOR_CONTROL]:  { pos1: 'ejectorPosicion1',  pos2: 'ejectorPosicion2',  cambio: 'ejectorCambioPosicion',  current: 'ejectorPosicion' },
};

// Movimiento por posición: lee posición real (Y) → Pos1=Y, Pos2=X(objetivo) → dispara Cambio.
// El front SOLO envía "target" (la posición destino). "Cambio de Posición" es
// pura responsabilidad del backend: nunca se lee ni se acepta desde el body,
// para que no dependa de un valor manual/obsoleto que haya quedado cargado
// en algún formulario del front.
function attachMoveRoute(router, route, regType) {
    router.post(route, async (req, res) => {
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
            let current;
            try {
                current = await modbusClient.readByConfig(currentReg);
            } catch {
                current = opcuaServer._getCachedValue(currentReg) || 0;
            }
            current = Math.round(Number(current) || 0);

            await modbusClient.writeByConfig(pos1Reg, current);
            opcuaServer.updateCachedValue(pos1Reg.name, current);
            opcuaServer.markAsWritten(pos1Reg.name);

            await modbusClient.writeByConfig(pos2Reg, target);
            opcuaServer.updateCachedValue(pos2Reg.name, target);
            opcuaServer.markAsWritten(pos2Reg.name);

            // Disparo de "Cambio de Posición": siempre calculado por el backend
            // (nunca desde req.body). En este flujo el destino ("target") siempre
            // se escribe en Posición 2 (arriba), así que el selector debe ser 2
            // ("moverse a Posición 2") — su valor por defecto/de reposo.
            const triggerVal = CAMBIO_POSICION.POS2;
            await modbusClient.writeByConfig(cambioReg, triggerVal);
            opcuaServer.updateCachedValue(cambioReg.name, triggerVal);
            opcuaServer.markAsWritten(cambioReg.name);

            res.json({ success: true, currentPosition: current, target, trigger: triggerVal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

// POST genérico de control por tipo (Encendido, Torque, Posición 1, Posición 2,
// Velocidad en Posición, etc. — todo lo que venga en el body y sea writable).
// "Cambio de Posición" es la única excepción: nunca se acepta en el body (se
// descarta aunque el cliente lo mande) y, en cambio, se dispara automáticamente
// por el backend cuando la petición actualiza Posición 1 y/o Posición 2 — que es
// justamente lo que ese registro representa: la orden de ir hacia las posiciones
// que se acaban de fijar. Así, tanto el botón "IR" (attachMoveRoute) como el
// botón "Aplicar cambios" (esta función) comparten la misma regla: el front
// jamás decide el valor de Cambio de Posición.
function attachControlPostRoute(router, route, regType) {
    const moveCfg = POSITION_MOVE[regType];

    router.post(route, async (req, res) => {
        const writableNames = registerManager.getAll()
            .filter(reg => reg.type === regType && reg.writable)
            .map(reg => reg.name)
            .filter(name => !moveCfg || name !== moveCfg.cambio);

        const entries = Object.entries(req.body).filter(([k]) => writableNames.includes(k));
        if (entries.length === 0)
            return res.status(400).json({ error: `Body must include at least one of: ${writableNames.join(', ')}` });

        const results = {};
        let touchedPos1 = false;
        let touchedPos2 = false;
        for (const [name, value] of entries) {
            const reg = registerManager.getAll().find(r => r.name === name);
            if (!reg) { results[name] = { error: 'register not found' }; continue; }
            if (!reg.writable) { results[name] = { error: 'read-only' }; continue; }
            try {
                await modbusClient.writeByConfig(reg, Number(value));
                opcuaServer.updateCachedValue(reg.name, Number(value));
                opcuaServer.markAsWritten(reg.name);
                results[name] = { success: true, value: Number(value) };
                if (moveCfg && name === moveCfg.pos1) touchedPos1 = true;
                if (moveCfg && name === moveCfg.pos2) touchedPos2 = true;
            } catch (err) {
                results[name] = { error: err.message };
            }
        }

        // "Cambio de Posición" solo admite 1 o 2 (selector de a cuál de las dos
        // posiciones moverse). Si se tocó Posición 2 (o ambas), el selector es 2
        // — su valor por defecto —; si solo se tocó Posición 1, el selector es 1.
        if ((touchedPos1 || touchedPos2) && moveCfg) {
            const cambioReg = registerManager.getAll().find(r => r.name === moveCfg.cambio);
            if (cambioReg) {
                const triggerVal = touchedPos2 ? CAMBIO_POSICION.POS2 : CAMBIO_POSICION.POS1;
                try {
                    await modbusClient.writeByConfig(cambioReg, triggerVal);
                    opcuaServer.updateCachedValue(cambioReg.name, triggerVal);
                    opcuaServer.markAsWritten(cambioReg.name);
                    results[cambioReg.name] = { success: true, value: triggerVal, auto: true };
                } catch (err) {
                    results[cambioReg.name] = { error: err.message };
                }
            }
        }

        res.json(results);
    });
}

module.exports = {
    VALID_MODBUS_TYPES,
    validateRegisterPatch,
    readValuesByType,
    attachControlRoutes,
    attachControlPostRoute,
    attachMoveRoute,
    POSITION_MOVE,
    CAMBIO_POSICION,
};
