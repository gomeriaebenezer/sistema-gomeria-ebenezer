const mysql = require('mysql2');

// Usamos createPool para que la conexión sea más estable y se reintente sola
const pool = mysql.createPool({
    host: '159.69.13.153', 
    user: 'avnadmin',
    password: 'AVNS_7SPNkFuufXMGXeMu3hG',
    database: 'defaultdb',
    port: 11648,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificación de conexión
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
    } else {
        console.log('✅ ¡CONEXIÓN EXITOSA! Gomería Ebenezer está Online.');
        connection.release();
    }
});

module.exports = pool.promise();
