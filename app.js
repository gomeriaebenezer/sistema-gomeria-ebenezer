const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- RUTA DE VENTAS ---
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];
        const monto = parseFloat(p.precio_venta) || 0;
        const costo = parseFloat(p.precio_costo) || 0;
        const ganancia = monto - costo;

        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }

        // 1. Descontar stock
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // 2. Registrar movimiento (Aseguramos que los valores no sean nulos)
        await db.query('INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, `Venta: ${p.nombre}`, monto, ganancia]);
        
        res.send('✅ Venta procesada');
    } catch (err) { 
        console.error("❌ Error en la venta:", err.message);
        res.status(500).send("Error interno"); 
    }
});

// --- RUTA DE MOVIMIENTOS (Ajustada para que aparezca siempre) ---
app.get('/movimientos/:filtro', async (req, res) => {
    const { filtro } = req.params;
    let sql = 'SELECT * FROM movimientos';
    
    // Si es hoy, usamos la fecha del servidor de base de datos
    if (filtro === 'hoy') {
        sql += ' WHERE DATE(fecha) = CURDATE()';
    }
    
    sql += ' ORDER BY fecha DESC';

    try {
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

// Resto de tus rutas de productos...
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY id_producto ASC');
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));
