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
        return `"${r.name}" ${pgType}`;
    });

    const sql = `
        CREATE TABLE IF NOT EXISTS lecturas (
            id          SERIAL PRIMARY KEY,
            ${columns.join(',\n            ')},
            guardado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `;

    await pool.query(sql);
    logger.info('Tabla 35678 lista en PostgreSQL');
}

async function insertLectura(values) {
    const keys   = Object.keys(values);
    const cols   = keys.map(k => `"${k}"`).join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const vals   = keys.map(k => values[k]);

    await pool.query(`INSERT INTO lecturas (${cols}) VALUES (${params})`, vals);
}

module.exports = { initTable, insertLectura };
