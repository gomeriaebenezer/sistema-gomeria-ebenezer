const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// --- RUTAS DE PRODUCTOS ---
app.get('/productos', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
    res.json(rows);
});

app.post('/productos', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    await pool.query(
        'INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)',
        [nombre, categoria, precio_costo, precio_venta, stock_actual]
    );
    res.sendStatus(201);
});

app.put('/productos/:id', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    await pool.query(
        'UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?',
        [nombre, categoria, precio_costo, precio_venta, stock_actual, req.params.id]
    );
    res.sendStatus(200);
});

app.delete('/productos/:id', async (req, res) => {
    await pool.query('DELETE FROM productos WHERE id_producto=?', [req.params.id]);
    res.sendStatus(200);
});

// --- RUTA DE VENTAS (CORREGIDA) ---
app.post('/vender', async (req, res) => {
    const { id_producto, cantidad, monto_operacion, ganancia_operacion, descripcion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Registrar movimiento - AQUÍ ESTABA EL ERROR DE COMILLAS
        await connection.query(
            "INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, 'VENTA', ?, ?, ?, NOW())",
            [id_producto, descripcion, monto_operacion, ganancia_operacion]
        );

        // Descontar stock (excepto servicios)
        if (!descripcion.includes('Servicio')) {
            await connection.query(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
                [cantidad, id_producto]
            );
        }

        await connection.commit();
        res.sendStatus(200);
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).send(error.message);
    } finally {
        connection.release();
    }
});

// --- RUTAS DE MOVIMIENTOS ---
app.get('/movimientos/todo', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM movimientos ORDER BY fecha DESC');
    res.json(rows);
});

app.get('/movimientos/hoy', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() ORDER BY fecha DESC");
    res.json(rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
