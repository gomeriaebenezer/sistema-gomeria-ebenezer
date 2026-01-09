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

// PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/productos', async (req, res) => {
    try {
        const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
        await pool.query(
            'INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)',
            [nombre, categoria, precio_costo, precio_venta, stock_actual]
        );
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/productos/:id', async (req, res) => {
    try {
        const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
        await pool.query(
            'UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?',
            [nombre, categoria, precio_costo, precio_venta, stock_actual, req.params.id]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/productos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM productos WHERE id_producto=?', [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// VENTAS
app.post('/vender', async (req, res) => {
    const { id_producto, cantidad, monto_operacion, ganancia_operacion, descripcion } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            "INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, 'VENTA', ?, ?, ?, NOW())",
            [id_producto, descripcion, monto_operacion, ganancia_operacion]
        );
        if (!descripcion.toLowerCase().includes('servicio')) {
            await connection.query(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
                [cantidad, id_producto]
            );
        }
        await connection.commit();
        res.sendStatus(200);
    } catch (error) {
        await connection.rollback();
        res.status(500).send(error.message);
    } finally {
        connection.release();
    }
});

// MOVIMIENTOS
app.get('/movimientos/todo', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movimientos ORDER BY fecha DESC');
        res.json(rows);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor ok en puerto ${PORT}`));
