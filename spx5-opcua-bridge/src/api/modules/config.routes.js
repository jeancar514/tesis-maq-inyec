// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Configuración global (origen de datos de la pantalla)
// Ruta: GET /api/config/data-source → { source: 'modbus' | 'db' }
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const config = require('../../../config/config');
const dbClient = require('../../db/dbClient');
const { ROUTES } = require('../constant');

const router = express.Router();

router.get(ROUTES.DATA_SOURCE, (req, res) => {
    res.json({ source: config.dataSource });
});

// Maestros de valores (catálogos) para poblar dropdowns/etiquetas en el frontend.
router.get(ROUTES.CATALOGS, async (req, res) => {
    try {
        const catalogos = await dbClient.getCatalogos();
        res.json(catalogos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
