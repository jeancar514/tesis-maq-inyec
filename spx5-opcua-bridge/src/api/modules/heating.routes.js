// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Temperaturas (zonas de calefacción del cilindro)
// Las zonas (setpoint + tolerancias) se persisten en DB (zona_calefaccion).
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const opcuaServer = require('../../opcua/opcuaServer');
const registerManager = require('../../utils/registerManager');
const dbClient = require('../../db/dbClient');
const { ROUTES } = require('../constant');

const router = express.Router();

// Mapa código de zona (DB) → prefijo de registro Modbus (registers.json)
const ZONA_REG_PREFIX = {
    zona_1: 'zona1', zona_2: 'zona2', zona_3: 'zona3', zona_4: 'zona4', zona_5: 'zona5',
};

// GET /api/heating/diagnostic — diagnóstico ON-OFF por zona (dual: db | modbus)
router.get(ROUTES.HEATING_DIAGNOSTIC, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const zonas = await dbClient.getHeatingDiagnostic();
            return res.json({ success: true, source: 'db', zonas });
        }
        // Modo Modbus: config de zonas desde DB (setpoints) + lecturas PV/SSR desde caché.
        const zonasConfig = await dbClient.getHeatingZones();
        const cache = (name) => {
            const reg = registerManager.getAll().find(r => r.name === name);
            return reg ? Number(opcuaServer._getCachedValue(reg)) || 0 : null;
        };
        const zonas = zonasConfig.map(z => {
            const codigo = z.codigo || `zona_${z.id}`;
            const prefix = ZONA_REG_PREFIX[codigo];
            const pv = prefix ? cache(`${prefix}TemperaturaPv`) : null;
            const ssr = prefix ? cache(`${prefix}SalidaSsr`) : null;
            const sp = Number(z.setpoint) || 0;
            return {
                codigo,
                nombre: z.nombre,
                setpoint: sp,
                toleranciaSup: z.toleranciaSup ?? 0,
                toleranciaInf: z.toleranciaInf ?? 0,
                temperaturaPv: pv,
                salidaSsr: ssr,
                error: pv !== null ? Number((pv - sp).toFixed(2)) : null,
                estado: (ssr ?? 0) > 0 ? 'on' : 'off',
            };
        });
        res.json({ success: true, source: 'modbus', zonas });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/heating/zones — configuración de zonas (setpoint/tolerancias)
router.get(ROUTES.HEATING_ZONES, async (req, res) => {
    try {
        const zones = await dbClient.getHeatingZones();
        res.json({ success: true, source: 'db', zones });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/heating/zones — guardar configuración de zonas
router.post(ROUTES.HEATING_ZONES, async (req, res) => {
    const zones = Array.isArray(req.body?.zones) ? req.body.zones : null;
    if (!zones || zones.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "zones" (array no vacío)' });
    try {
        const saved = await dbClient.saveHeatingZones(zones);
        res.json({ success: true, zones: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
