const express = require('express');
const db = require('./db');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GUARDAR O EDITAR (Arregla el Inventario)
app.post('/productos', async (req, res) => {
    const { id_producto, nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        if (id_producto) {
            await db.query('UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?', 
            [nombre, categoria, precio_costo, precio_venta, stock_actual, id_producto]);
        } else {
            const [existe] = await db.query('SELECT * FROM productos WHERE nombre = ?', [nombre]);
            if (existe.length > 0) {
                await db.query('UPDATE productos SET stock_actual = stock_actual + ? WHERE nombre = ?', [stock_actual, nombre]);
            } else {
                await db.query('INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)', 
                [nombre, categoria, precio_costo, precio_venta, stock_actual]);
            }
        }
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// VENDER (Modificado para que el gráfico detecte la categoría)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        const p = rows[0];

        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        const venta = parseFloat(p.precio_venta) || 0;
        const ganancia = venta - (parseFloat(p.precio_costo) || 0);
        // Guardamos la categoría entre paréntesis para que el gráfico la reconozca
        const descrip = `Venta: ${p.nombre} (${p.categoria})`;

        const queryInsert = "INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, 'VENTA', ?, ?, ?, NOW())";
        await db.query(queryInsert, [id, descrip, venta, ganancia]);
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// HISTORIAL
app.get('/movimientos/todo', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM movimientos ORDER BY fecha DESC");
        res.json(results);
    } catch (err) { res.status(500).json([]); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor iniciado"));
