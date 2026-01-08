const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. Obtener productos para la tabla
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { 
        console.error("Error al obtener productos:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

// 2. Procesar Venta (Descontar stock y registrar en historial)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("Producto no encontrado");
        
        const p = rows[0];
        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }

        // Descontar stock si no es servicio
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // GUARDAR EN EL HISTORIAL (Esto es lo que te faltaba)
        const ganancia = (parseFloat(p.precio_venta) || 0) - (parseFloat(p.precio_costo) || 0);
        await db.query('INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, `Venta: ${p.nombre}`, p.precio_venta, ganancia]);
        
        res.send('✅ Venta procesada');
    } catch (err) { 
        console.error("Error en proceso de venta:", err.message);
        res.status(500).send(err.message); 
    }
});

// 3. Ver cierre de caja (Movimientos de hoy)
app.get('/movimientos/hoy', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() ORDER BY fecha DESC');
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));
