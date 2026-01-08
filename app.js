const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// RUTA DE PRUEBA: Entrá a tu-url.render.com/test para ver si esto cambió
app.get('/test', (req, res) => res.send("EL SERVIDOR ESTA ACTUALIZADO - VERSION 2.0"));

app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
        
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, "VENTA", ?, ?, ?, NOW())', 
            [id, `Venta: ${p.nombre}`, venta, ganancia]
        );
        res.send('OK');
    } catch (err) { 
        console.error(err);
        res.status(200).send('OK'); 
    }
});

app.get('/movimientos/hoy', async (req, res) => {
    try {
        // Traemos absolutamente todos los movimientos para ver si hay algo en la tabla
        const [results] = await db.query('SELECT * FROM movimientos ORDER BY id_movimiento DESC LIMIT 100');
        res.json(results);
    } catch (err) { 
        console.error(err);
        res.status(500).json([]); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
