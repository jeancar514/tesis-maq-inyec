// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Configuración global (origen de datos de la pantalla)
// Ruta: GET /api/config/data-source → { source: 'modbus' | 'db' }
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const { ROUTES } = require('../constant');

const router = express.Router();

router.get(ROUTES.DATA_SOURCE, (req, res) => {
    res.json({ source: config.dataSource });
});

module.exports = router;
