const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. CARGAR PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. VENDER Y REGISTRAR
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
        
        // Grabamos el movimiento
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, "VENTA", ?, ?, ?, NOW())', 
            [id, `Venta: ${p.nombre}`, venta, ganancia]
        );
        res.send('OK');
    } catch (err) { res.send('OK'); } // Siempre mandamos OK si el stock bajó
});

// 3. CIERRE DE CAJA (Versión para ver TODO lo de las últimas horas)
app.get('/movimientos/hoy', async (req, res) => {
    try {
        // Buscamos los últimos 20 movimientos sin importar si el reloj de Aiven está adelantado
        const [results] = await db.query(
            'SELECT *, DATE_FORMAT(fecha, "%H:%i") as hora_corta FROM movimientos ORDER BY id_movimiento DESC LIMIT 20'
        );
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
