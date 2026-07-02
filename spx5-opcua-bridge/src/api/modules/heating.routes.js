// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Temperaturas (zonas de calefacción del cilindro)
// Las zonas (setpoint + tolerancias) se persisten en DB (zona_calefaccion).
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const dbClient = require('../../db/dbClient');
const { ROUTES } = require('../constant');

const router = express.Router();

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
