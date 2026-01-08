const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// VENDER
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
        
        // Usamos NOW() para que la base de datos asigne la hora exacta del servidor
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, "VENTA", ?, ?, ?, NOW())', 
            [id, `Venta: ${p.nombre}`, venta, ganancia]
        );
        res.send('OK');
    } catch (err) { 
        console.error("Error en venta:", err);
        // Enviamos 200 para evitar que la interfaz se bloquee si el stock ya se descontó
        res.status(200).send('OK'); 
    }
});

// HISTORIAL CORREGIDO (Zona Horaria Argentina vs Aiven)
app.get('/movimientos/hoy', async (req, res) => {
    try {
        // Buscamos los movimientos de las últimas 24 horas. 
        // Esto soluciona que después de las 21:00 hs de Argentina la tabla aparezca vacía.
        const sql = "SELECT * FROM movimientos WHERE fecha >= NOW() - INTERVAL 1 DAY ORDER BY fecha DESC LIMIT 50";
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { 
        console.error("Error en historial:", err);
        res.status(500).json([]); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
