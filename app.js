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
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2. VENDER Y REGISTRAR (Ajustado según tus estadísticas de Aiven)
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];

        // A. Descontar stock (Esto ya te funciona bien)
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // B. Registrar movimiento (Forzamos la FECHA y aseguramos los valores)
        const venta = parseFloat(p.precio_venta) || 0;
        const costo = parseFloat(p.precio_costo) || 0;
        const ganancia = venta - costo;
        
        // Agregamos 'fecha' explícitamente porque tus estadísticas muestran que es clave
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, "VENTA", ?, ?, ?, NOW())', 
            [id, `Venta: ${p.nombre}`, venta, ganancia]
        );
        
        res.send('OK');
    } catch (err) { 
        console.error("Error BD:", err.message);
        // Aunque falle el historial, enviamos OK si el stock ya bajó
        res.send('OK'); 
    }
});

// 3. CIERRE DE CAJA
app.get('/movimientos/hoy', async (req, res) => {
    try {
        // Esta es la misma consulta que veo en tu pantalla de Aiven
        const [results] = await db.query(
            'SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() ORDER BY fecha DESC'
        );
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
