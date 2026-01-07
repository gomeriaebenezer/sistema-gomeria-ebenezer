const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- SCRIPT AUTOMÁTICO: CREAR TABLAS ---
const initDB = async () => {
    try {
        console.log("🛠️ Verificando tablas en Aiven...");
        
        await db.query(`CREATE TABLE IF NOT EXISTS productos (
            id_producto INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            categoria VARCHAR(100),
            precio_costo DECIMAL(10,2),
            precio_venta DECIMAL(10,2),
            stock_actual INT DEFAULT 0
        ) ENGINE=InnoDB`);

        await db.query(`CREATE TABLE IF NOT EXISTS movimientos (
            id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
            id_producto INT,
            tipo_movimiento VARCHAR(50),
            descripcion TEXT,
            monto_operacion DECIMAL(10,2),
            ganancia_operacion DECIMAL(10,2),
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`);

        console.log("✅ Tablas listas para la Gomería.");
    } catch (err) {
        console.error("❌ Error inicializando tablas:", err.message);
    }
};
initDB();

// --- RUTAS DEL SISTEMA ---

// 1. VER TODO EL STOCK
app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY id_producto ASC');
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. REGISTRAR O SUMAR STOCK
app.post('/productos', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        const [rows] = await db.query('SELECT id_producto, stock_actual FROM productos WHERE LOWER(nombre) = LOWER(?)', [nombre]);
        
        if (rows.length > 0) {
            const id = rows[0].id_producto;
            const nuevoStock = parseInt(rows[0].stock_actual) + parseInt(stock_actual);
            await db.query('UPDATE productos SET stock_actual=?, precio_costo=?, precio_venta=?, categoria=? WHERE id_producto=?', 
                [nuevoStock, precio_costo, precio_venta, categoria, id]);
            res.send('✅ Stock actualizado');
        } else {
            await db.query('INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)', 
                [nombre, categoria, precio_costo, precio_venta, stock_actual]);
            res.send('✅ Nuevo producto registrado');
        }
    } catch (err) { res.status(500).send(err.message); }
});

// 3. VENDER / COBRAR
app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        
        const p = rows[0];
        const ganancia = parseFloat(p.precio_venta) - parseFloat(p.precio_costo);
        
        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }

        // Descontar stock si no es servicio
        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        // Registrar movimiento
        await db.query('INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, `Venta: ${p.nombre}`, p.precio_venta, ganancia]);
        
        res.send('✅ Venta procesada');
    } catch (err) { res.status(500).send(err.message); }
});

// 4. EDITAR / ACTUALIZAR (Manual)
app.put('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    try {
        await db.query('UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?', 
            [nombre, categoria, precio_costo, precio_venta, stock_actual, id]);
        res.send('✅ Actualizado');
    } catch (err) { res.status(500).send(err.message); }
});

// 5. BORRAR PRODUCTO
app.delete('/productos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);
        res.send('✅ Producto eliminado');
    } catch (err) { res.status(500).send(err.message); }
});

// 6. FILTRAR MOVIMIENTOS POR RANGO
app.get('/movimientos/rango', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const [results] = await db.query('SELECT * FROM movimientos WHERE DATE(fecha) BETWEEN ? AND ? ORDER BY fecha DESC', [desde, hasta]);
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

// 7. FILTRAR MOVIMIENTOS (HOY, SEMANA, MES)
app.get('/movimientos/:filtro', async (req, res) => {
    const { filtro } = req.params;
    let condicion = "";
    if (filtro === 'hoy') condicion = "WHERE DATE(fecha) = CURDATE()";
    else if (filtro === 'semana') condicion = "WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)";
    else if (filtro === 'mes') condicion = "WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";

    try {
        const [results] = await db.query(`SELECT * FROM movimientos ${condicion} ORDER BY fecha DESC`);
        res.json(results);
    } catch (err) { res.status(500).send(err.message); }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Gomería activo en puerto ${PORT}`));
