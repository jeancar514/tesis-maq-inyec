// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Eyección (eyector + perfil de eyección)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const { attachMoveRoute, readValuesByType, attachControlPostRoute } = require('./_shared');

const router = express.Router();

// Eyector: control genérico (doble fuente db/modbus) + movimiento por posición.
// En modo 'db' el GET combina setpoints (eyc_eyector_config) + última lectura en tiempo real (eyc_eyector_lectura).
router.get(ROUTES.EJECTOR_CONTROL, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const [setpoints, lectura] = await Promise.all([
                dbClient.getEyectorConfig(),
                dbClient.getEyectorLectura(),
            ]);
            if (setpoints || lectura) {
                return res.json({ ...(setpoints || {}), ...(lectura || {}), _source: 'db' });
            }
        }
        res.json({ ...readValuesByType(REGISTER_TYPES.EJECTOR_CONTROL), _source: 'modbus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ejector-control — Encendido, Torque, Posición 1/2, Velocidad en
// Posición. Cambio de Posición nunca se acepta aquí: attachControlPostRoute lo
// dispara solo cuando Posición 1 y/o 2 vienen en el body.
attachControlPostRoute(router, ROUTES.EJECTOR_CONTROL, REGISTER_TYPES.EJECTOR_CONTROL);

// GET /api/ejector-control/lectura — última lectura en tiempo real del eyector (velocidad, posición, torque secundario).
router.get(`${ROUTES.EJECTOR_CONTROL}/lectura`, async (req, res) => {
    try {
        if (config.dataSource === 'db') {
            const lectura = await dbClient.getEyectorLectura();
            if (lectura) return res.json({ ...lectura, _source: 'db' });
        }
        const vals = readValuesByType(REGISTER_TYPES.EJECTOR_CONTROL);
        res.json({
            ejectorVelocidad:        vals.ejectorVelocidad        ?? 0,
            ejectorPosicion:         vals.ejectorPosicion         ?? 0,
            ejectorTorqueSecundario: vals.ejectorTorqueSecundario ?? 0,
            _source: 'modbus',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

attachMoveRoute(router, `${ROUTES.EJECTOR_CONTROL}/move`, REGISTER_TYPES.EJECTOR_CONTROL);

// ── Perfil de Eyección (etapas, persistido en DB) ──────────────────────────
router.get(ROUTES.EJECTION_PROFILE, async (req, res) => {
    try {
        const stages = await dbClient.getEjectionProfile();
        res.json({ success: true, source: 'db', stages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post(ROUTES.EJECTION_PROFILE, async (req, res) => {
    const stages = Array.isArray(req.body?.stages) ? req.body.stages : null;
    if (!stages || stages.length === 0)
        return res.status(400).json({ success: false, error: 'Body debe incluir "stages" (array no vacío)' });
    try {
        const saved = await dbClient.saveEjectionProfile(stages);
        res.json({ success: true, stages: saved });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
