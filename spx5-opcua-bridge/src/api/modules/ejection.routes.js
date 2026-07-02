// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Eyección (eyector + perfil de eyección)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const dbClient = require('../../db/dbClient');
const { ROUTES, REGISTER_TYPES } = require('../constant');
const { attachControlRoutes, attachMoveRoute } = require('./_shared');

const router = express.Router();

// Eyector: control genérico + movimiento por posición.
attachControlRoutes(router, ROUTES.EJECTOR_CONTROL, REGISTER_TYPES.EJECTOR_CONTROL);
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
