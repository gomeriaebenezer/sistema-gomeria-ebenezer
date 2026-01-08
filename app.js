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

// 2. VENDER (Versión simplificada para evitar Error 500)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];

        // A. Descontar stock
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // B. Intentar guardar historial (si falla, que no bloquee la venta)
        try {
            const monto = p.precio_venta || 0;
            const ganancia = (p.precio_venta || 0) - (p.precio_costo || 0);
            const desc = `Venta: ${p.nombre}`;
            
            // Usamos solo las columnas básicas que suelen ser obligatorias
            await db.query(
                'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
                [id, desc, monto, ganancia]
            );
        } catch (movErr) {
            console.error("Error al grabar historial:", movErr.message);
            // No enviamos error 500 aquí para que la venta al menos descuente stock
        }
        
        res.send('OK');
    } catch (err) { 
        res.status(500).send("Error crítico: " + err.message); 
    }
});

// 3. CIERRE DE CAJA
app.get('/movimientos/hoy', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() ORDER BY fecha DESC');
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
