const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Corregido de DB_PASS a DB_PASSWORD
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 11648,
    ssl: {
        rejectUnauthorized: false // Esto permite la conexión segura con Aiven
    }
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
        return;
    }
    console.log('🚀 Servidor Gomería PRO v2 activo y conectado a Aiven');
});

module.exports = connection;
