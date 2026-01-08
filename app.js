const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. OBTENER PRODUCTOS (Para Admin y Ventas)
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { 
        console.error("Error al obtener productos:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

// 2. PROCESAR VENTA Y REGISTRAR MOVIMIENTO
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Buscamos el producto para obtener precio y stock actual
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("Producto no encontrado");
        
        const p = rows[0];

        // Validar stock si no es un servicio
        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }

        // A. Descontar stock
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // B. Calcular valores para el historial
        const venta = parseFloat(p.precio_venta) || 0;
        const costo = parseFloat(p.precio_costo) || 0;
        const ganancia = venta - costo;
        const descripcionMov = `Venta: ${p.nombre || 'Producto'}`;

        // C. Insertar en la tabla de movimientos
        await db.query(
            'INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, descripcionMov, venta, ganancia]
        );
        
        res.send('OK');
    } catch (err) { 
        console.error("Error en proceso de venta:", err.message);
        res.status(500).send("Error interno: " + err.message); 
    }
});

// 3. VER CIERRE DE CAJA (Movimientos de hoy)
app.get('/movimientos/hoy', async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT * FROM movimientos WHERE DATE(fecha) = CURDATE() ORDER BY fecha DESC'
        );
        res.json(results);
    } catch (err) { 
        console.error("Error al obtener movimientos:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

// CONFIGURACIÓN DEL PUERTO (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor de Gomería Online en puerto ${PORT}`));
