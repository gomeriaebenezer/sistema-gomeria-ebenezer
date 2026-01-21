const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/test', (req, res) => res.send("SERVIDOR FUNCIONANDO - VERSION FINAL CON INSUMOS"));

// OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREAR PRODUCTO
app.post('/productos', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        const [existe] = await db.query('SELECT * FROM productos WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            await db.query('UPDATE productos SET stock_actual = stock_actual + ? WHERE nombre = ?', [stock_actual, nombre]);
        } else {
            const sql = "INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)";
            await db.query(sql, [nombre, categoria, precio_costo, precio_venta, stock_actual]);
        }
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// EDITAR PRODUCTO
app.put('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        const sql = "UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?";
        await db.query(sql, [nombre, categoria, precio_costo, precio_venta, stock_actual, id]);
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// ELIMINAR PRODUCTO
app.delete('/productos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// VENDER (Modificado para registrar nombre exacto)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        const p = rows[0];

        // Solo resta stock si NO es un servicio
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        const venta = parseFloat(p.precio_venta) || 0;
        const ganancia = venta - (parseFloat(p.precio_costo) || 0);
        
        // Registro detallado para el cierre
        const descrip = `Venta: ${p.nombre} (${p.categoria})`;

        const queryInsert = "INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, 'VENTA', ?, ?, ?, NOW())";
        await db.query(queryInsert, [id, descrip, venta, ganancia]);
        res.send('OK');
    } catch (err) { 
        console.error("ERROR SQL:", err);
        res.status(500).send("Error en el servidor"); 
    }
});

app.get('/movimientos/hoy', async (req, res) => {
    try {
        const sql = "SELECT * FROM movimientos WHERE DATE(SUBTIME(fecha, '03:00:00')) = DATE(SUBTIME(NOW(), '03:00:00')) ORDER BY id_movimiento DESC";
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { res.status(500).json([]); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Galeano SysGear en puerto ${PORT}`));
