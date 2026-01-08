const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. VENDER Y REGISTRAR MOVIMIENTO (Reforzado)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];
        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) return res.status(400).send("Sin stock");

        // A. Descontar stock
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // B. Registrar movimiento (Usamos NOW() de SQL para evitar líos de hora)
        const venta = parseFloat(p.precio_venta) || 0;
        const ganancia = venta - (parseFloat(p.precio_costo) || 0);
        
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, "VENTA", ?, ?, ?, NOW())', 
            [id, `Venta: ${p.nombre}`, venta, ganancia]
        );
        
        res.send('OK');
    } catch (err) { 
        console.error(err);
        res.status(500).send(err.message); 
    }
});

// 3. CIERRE DE CAJA (Más flexible con la fecha)
app.get('/movimientos/hoy', async (req, res) => {
    try {
        // Buscamos los últimos 50 movimientos de hoy para asegurarnos de que se vean
        const [results] = await db.query(
            'SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() OR fecha >= DATE_SUB(NOW(), INTERVAL 1 DAY) ORDER BY fecha DESC LIMIT 50'
        );
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
