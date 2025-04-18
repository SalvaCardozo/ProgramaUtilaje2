// Importar el módulo pg para PostgreSQL
const { Pool } = require('pg');

// Configurar el pool de conexiones a PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'programa_utilaje',
    password: 'Salvador97@', // Cambiar por tu contraseña
    port: 5432
});

// Función para ejecutar consultas
const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res.rows;
    } catch (err) {
        console.error('Error en la consulta:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Exportar el pool y la función query
module.exports = { pool, query };