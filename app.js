const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- INICIALIZAR TABLAS ---
const initDB = async () => {
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS productos (
            id_producto INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255), categoria VARCHAR(100),
            precio_costo DECIMAL(10,2), precio_venta DECIMAL(10,2), stock_actual INT DEFAULT 0
        ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS movimientos (
            id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
            id_producto INT, tipo_movimiento VARCHAR(50),
            descripcion TEXT, monto_operacion DECIMAL(10,2),
            ganancia_operacion DECIMAL(10,2), fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`);
        console.log("✅ Tablas listas.");
    } catch (err) { console.error("Error tablas:", err.message); }
};
initDB();

// --- RUTAS ---
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY id_producto ASC');
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/productos', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        await db.query('INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)', 
        [nombre, categoria, precio_costo, precio_venta, stock_actual]);
        res.send('✅ Registrado');
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];
        const monto = parseFloat(p.precio_venta) || 0;
        const costo = parseFloat(p.precio_costo) || 0;
        const ganancia = monto - costo;

        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }

        // 1. Descontar stock
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // 2. Registrar movimiento
        await db.query('INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, `Venta: ${p.nombre}`, monto, ganancia]);
        
        res.send('✅ Venta procesada');
    } catch (err) { 
        console.error(err);
        res.status(500).send("Error interno"); 
    }
});

app.get('/movimientos/:filtro', async (req, res) => {
    const { filtro } = req.params;
    let sql = 'SELECT * FROM movimientos';
    if (filtro === 'hoy') sql += ' WHERE DATE(fecha) = CURDATE()';
    sql += ' ORDER BY fecha DESC';
    try {
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
