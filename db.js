const mysql = require('mysql2');

// Quitamos la línea de dotenv para que no busque archivos .env inexistentes
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 11648,
    ssl: {
        rejectUnauthorized: false
    }
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
        return;
    }
    console.log('✅ ¡CONEXIÓN EXITOSA! La Gomería está online.');
});

module.exports = connection;
