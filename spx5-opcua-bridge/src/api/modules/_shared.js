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
// Los pares de 32 bits (is32Bit + bitPosition 'low'/'high') se recomponen bajo
// su nombre base (p.ej. "moldPosicion1Low"/"moldPosicion1High" → "moldPosicion1"),
// igual que hace GET /api/screw-control para velocidadHusillo/torqueHusillo.
function readValuesByType(regType) {
    const values = {};
    const regs = registerManager.getAll().filter(reg => reg.type === regType);
    const processed = new Set();

    regs.forEach(reg => {
        if (reg.is32Bit && reg.bitPosition === 'high') {
            const baseName = reg.name.replace(/High$/, '');
            const lowReg = regs.find(r => r.name === `${baseName}Low`);
            if (lowReg && !processed.has(baseName)) {
                const highWord = opcuaServer._getCachedValue(reg) || 0;
                const lowWord = opcuaServer._getCachedValue(lowReg) || 0;
                values[baseName] = ((highWord & 0xFFFF) << 16) | (lowWord & 0xFFFF);
                processed.add(baseName);
            }
        } else if (reg.is32Bit && reg.bitPosition === 'low') {
            // Se compone junto a su High de arriba; nada que hacer aquí.
        } else if (!processed.has(reg.name)) {
            values[reg.name] = opcuaServer._getCachedValue(reg);
            processed.add(reg.name);
        }
    });

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

// Las posiciones son enteros CON SIGNO de 32 bits (rango -2147483648 a
// 2147483647). Cada dirección Modbus solo admite 16 bits, así que cada
// posición se reparte entre dos registros consecutivos: el nombre base
// (p.ej. "moldPosicion1") mapea a "moldPosicion1Low" (palabra baja, bits
// 0-15) y "moldPosicion1High" (palabra alta, bits 16-31) — el mismo patrón
// ya usado en registers.json para velocidadHusillo/torqueHusillo y en
// GET/POST /api/screw-control (injection.routes.js).
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

function clampInt32(rawValue) {
    let value = Math.round(Number(rawValue) || 0);
    if (value > INT32_MAX) value = INT32_MAX;
    if (value < INT32_MIN) value = INT32_MIN;
    return value;
}

// Busca el par de registros Low/High para un nombre base dado.
function get32BitPair(baseName) {
    const all = registerManager.getAll();
    const lowReg = all.find(r => r.name === `${baseName}Low` && r.is32Bit && r.bitPosition === 'low');
    const highReg = all.find(r => r.name === `${baseName}High` && r.is32Bit && r.bitPosition === 'high');
    return (lowReg && highReg) ? { lowReg, highReg } : null;
}

// Rango que cabe en un registro Modbus de 16 bits con signo.
const INT16_MIN = -32768;
const INT16_MAX = 32767;

// Lee y recompone (desde caché) un valor de 32 bits con signo a partir de su
// par Low/High. Devuelve null si el par no existe.
function read32BitValue(baseName) {
    const pair = get32BitPair(baseName);
    if (!pair) return null;
    const highWord = opcuaServer._getCachedValue(pair.highReg) || 0;
    const lowWord = opcuaServer._getCachedValue(pair.lowReg) || 0;
    return ((highWord & 0xFFFF) << 16) | (lowWord & 0xFFFF);
}

// Escribe una posición de hasta 32 bits con signo. Si el valor CABE en 16
// bits se escribe en una sola dirección Modbus (la base/low); si la SUPERA,
// se divide en palabra alta/baja y se escribe en las dos direcciones
// (base = low, base+1 = high).
// Nota: en el caso de 1 sola dirección, el registro "high" NO se toca — si
// antes se había escrito ahí un valor grande (>16 bits) para esta misma
// posición, ese registro conserva ese valor viejo hasta que se vuelva a
// escribir un valor que también supere los 16 bits. Se deja así porque así
// se pidió explícitamente (menos escrituras Modbus), pero es importante
// tenerlo presente si el SPX5 llega a recomponer high+low en el PLC.
async function write32BitValue(baseName, rawValue) {
    const pair = get32BitPair(baseName);
    if (!pair) throw new Error(`Register pair not found for ${baseName}`);

    const intValue = clampInt32(rawValue);
    const fitsInOneRegister = intValue >= INT16_MIN && intValue <= INT16_MAX;

    if (fitsInOneRegister) {
        const lowWord = intValue & 0xFFFF;
        await modbusClient.writeByConfig(pair.lowReg, lowWord);
        opcuaServer.updateCachedValue(pair.lowReg.name, lowWord);
        opcuaServer.markAsWritten(pair.lowReg.name);
        return { value: intValue, highWord: null, lowWord, registersUsed: 1 };
    }

    const highWord = (intValue >> 16) & 0xFFFF;
    const lowWord = intValue & 0xFFFF;
    await modbusClient.writeByConfig(pair.highReg, highWord);
    await modbusClient.writeByConfig(pair.lowReg, lowWord);
    opcuaServer.updateCachedValue(pair.highReg.name, highWord);
    opcuaServer.updateCachedValue(pair.lowReg.name, lowWord);
    opcuaServer.markAsWritten(pair.highReg.name);
    opcuaServer.markAsWritten(pair.lowReg.name);

    return { value: intValue, highWord, lowWord, registersUsed: 2 };
}

// Mapa de registros de posición por tipo, usado por el movimiento "Ir a posición".
// pos1/pos2/current son NOMBRES BASE de pares de 32 bits (ver arriba).
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

        const cambioReg = registerManager.getAll().find(r => r.name === cfg.cambio);
        const pos1Pair = get32BitPair(cfg.pos1);
        const pos2Pair = get32BitPair(cfg.pos2);
        if (!pos1Pair || !pos2Pair || !cambioReg) return res.status(404).json({ error: 'Position registers not found' });

        try {
            // Posición actual (Y): se intenta leer en vivo por Modbus (Low +
            // High); si falla, se usa el último par cacheado.
            const currentPair = get32BitPair(cfg.current);
            let current;
            if (currentPair) {
                try {
                    const lowVal = await modbusClient.readByConfig(currentPair.lowReg);
                    const highVal = await modbusClient.readByConfig(currentPair.highReg);
                    current = ((Number(highVal) & 0xFFFF) << 16) | (Number(lowVal) & 0xFFFF);
                } catch {
                    current = read32BitValue(cfg.current) || 0;
                }
            } else {
                current = 0;
            }
            current = clampInt32(current);

            const pos1Written = await write32BitValue(cfg.pos1, current);
            const pos2Written = await write32BitValue(cfg.pos2, target);

            // Disparo de "Cambio de Posición": siempre calculado por el backend
            // (nunca desde req.body). En este flujo el destino ("target") siempre
            // se escribe en Posición 2 (arriba), así que el selector debe ser 2
            // ("moverse a Posición 2") — su valor por defecto/de reposo.
            const triggerVal = CAMBIO_POSICION.POS2;
            await modbusClient.writeByConfig(cambioReg, triggerVal);
            opcuaServer.updateCachedValue(cambioReg.name, triggerVal);
            opcuaServer.markAsWritten(cambioReg.name);

            res.json({
                success: true,
                currentPosition: current,
                target,
                trigger: triggerVal,
                // Detalle de cómo quedó escrito cada valor (1 registro si cabía
                // en 16 bits, 2 si se dividió en palabra alta/baja).
                words: {
                    pos1: { high: pos1Written.highWord, low: pos1Written.lowWord, registersUsed: pos1Written.registersUsed },
                    pos2: { high: pos2Written.highWord, low: pos2Written.lowWord, registersUsed: pos2Written.registersUsed },
                },
            });
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
        const allRegs = registerManager.getAll().filter(reg => reg.type === regType);

        // Nombres "planos" (registros normales de 16 bits) escribibles.
        const plainWritableNames = allRegs
            .filter(reg => reg.writable && !reg.is32Bit)
            .map(reg => reg.name)
            .filter(name => !moveCfg || name !== moveCfg.cambio);

        // Nombres base de pares de 32 bits escribibles (p.ej. "moldPosicion1"
        // agrupa "moldPosicion1Low"/"moldPosicion1High"). Las posiciones ya no
        // son un registro literal en el body: son su nombre base.
        const base32Names = new Set();
        allRegs.forEach(reg => {
            if (reg.is32Bit && reg.writable) {
                base32Names.add(reg.name.replace(/(Low|High)$/, ''));
            }
        });

        const allowedNames = [...plainWritableNames, ...base32Names];
        const entries = Object.entries(req.body).filter(([k]) => allowedNames.includes(k));
        if (entries.length === 0)
            return res.status(400).json({ error: `Body must include at least one of: ${allowedNames.join(', ')}` });

        const results = {};
        let touchedPos1 = false;
        let touchedPos2 = false;
        for (const [name, value] of entries) {
            try {
                if (base32Names.has(name)) {
                    // Posición de 32 bits: se divide en palabra alta/baja.
                    const written = await write32BitValue(name, value);
                    results[name] = { success: true, value: written.value };
                } else {
                    const reg = allRegs.find(r => r.name === name);
                    if (!reg) { results[name] = { error: 'register not found' }; continue; }
                    if (!reg.writable) { results[name] = { error: 'read-only' }; continue; }
                    await modbusClient.writeByConfig(reg, Number(value));
                    opcuaServer.updateCachedValue(reg.name, Number(value));
                    opcuaServer.markAsWritten(reg.name);
                    results[name] = { success: true, value: Number(value) };
                }
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
    INT32_MIN,
    INT32_MAX,
    clampInt32,
    get32BitPair,
    read32BitValue,
    write32BitValue,
};
