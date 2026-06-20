const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USER     || 'tesis',
    password: process.env.DB_PASSWORD || 'tesis',
    database: process.env.DB_NAME     || 'postgres',
});

pool.on('error', (err) => logger.error(`PostgreSQL pool error: ${err.message}`));

async function initTable(registers) {
    const columns = registers.map(r => {
        let pgType;
        switch (r.opcuaDataType) {
            case 'Boolean':                        pgType = 'BOOLEAN'; break;
            case 'Int16': case 'UInt16':
            case 'Int32': case 'UInt32':           pgType = 'INTEGER'; break;
            case 'Float': case 'Double': default:  pgType = 'DOUBLE PRECISION';
        }
        return { name: r.name, pgType };
    });

    // Crear tabla si no existe (con la primera columna para evitar tabla vacía)
    const colDefs = columns.map(c => `"${c.name}" ${c.pgType}`).join(',\n            ');
    const createSql = `
        CREATE TABLE IF NOT EXISTS lecturas (
            id          SERIAL PRIMARY KEY,
            ${colDefs},
            guardado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `;
    await pool.query(createSql);

    // Agregar columnas nuevas si la tabla ya existía (sin borrar datos)
    for (const col of columns) {
        await pool.query(`ALTER TABLE lecturas ADD COLUMN IF NOT EXISTS "${col.name}" ${col.pgType};`);
    }

    logger.info('Tabla "lecturas" lista en PostgreSQL');
}

async function insertLectura(values) {
    const keys   = Object.keys(values);
    const cols   = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const vals   = keys.map(k => values[k]);

    await pool.query(`INSERT INTO lecturas (${cols}) VALUES (${params})`, vals);
}

module.exports = { initTable, insertLectura };
