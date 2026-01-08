const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/test', (req, res) => res.send("SERVIDOR FUNCIONANDO - VERSION LOGS CORREGIDA"));

// OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// VENDER (Corregido el error de columna 'VENTA')
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
        const descrip = `Venta: ${p.nombre}`;

        // Usamos SET para que la consulta sea más limpia y evitar errores de comillas
        const queryInsert = "INSERT INTO movimientos SET id_producto=?, tipo_movimiento='VENTA', descripcion=?, monto_operacion=?, ganancia_operacion=?, fecha=NOW()";
        
        await db.query(queryInsert, [id, descrip, venta, ganancia]);
        
        res.send('OK');
    } catch (err) { 
        console.error("DETALLE ERROR SQL:", err);
        res.status(500).send("Error en el servidor"); 
    }
});

// HISTORIAL
app.get('/movimientos/hoy', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM movimientos ORDER BY id_movimiento DESC LIMIT 50');
        res.json(results);
    } catch (err) { 
        console.error(err);
        res.status(500).json([]); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
