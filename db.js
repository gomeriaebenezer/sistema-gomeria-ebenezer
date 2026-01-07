const mysql = require('mysql2');

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

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error de conexión:', err.code, err.message);
    } else {
        console.log('✅ ¡CONEXIÓN EXITOSA! Gomería Ebenezer está Online.');
        connection.release();
    }
});

module.exports = pool.promise();

