const mysql = require('mysql2');

// Conexión directa sin depender de variables externas de Render
const connection = mysql.createConnection({
    host: 'gomeria-db-gomeriaebenezer9-3fac.c.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_7SPNkFuufXMGXeMu3hG',
    database: 'defaultdb',
    port: 11648,
    ssl: {
        rejectUnauthorized: false // Indispensable para Aiven
    }
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión directa:', err.message);
        return;
    }
    console.log('✅ ¡CONEXIÓN MANUAL EXITOSA! Gomería online.');
});

module.exports = connection;
