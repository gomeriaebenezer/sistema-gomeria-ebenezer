const mysql = require('mysql2/promise'); // Cambiamos a la versión de promesas directa

const pool = mysql.createPool({
    host: 'gomeria-db-gomeriaebenezer9-3fac.c.aivencloud.com', 
    user: 'avnadmin',
    password: 'AVNS_7SPNkFuufXMGXeMu3hG',
    database: 'defaultdb',
    port: 11648,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000
});

// Verificación simple de conexión
pool.getConnection()
    .then(conn => {
        console.log('✅ ¡CONEXIÓN EXITOSA! Gomería Ebenezer está Online.');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error de conexión:', err.message);
    });

module.exports = pool;
