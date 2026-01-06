const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '159.69.13.153', // IP directa para evitar el error ENOTFOUND
    user: 'avnadmin',
    password: 'AVNS_7SPNkFuufXMGXeMu3hG',
    database: 'defaultdb',
    port: 11648,
    ssl: {
        rejectUnauthorized: false
    }
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error con IP directa:', err.message);
        return;
    }
    console.log('✅ ¡CONEXIÓN EXITOSA POR IP! Gomería online.');
});

module.exports = connection;
