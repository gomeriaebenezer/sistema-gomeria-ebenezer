const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// --- PLAN B: SCRIPT AUTOMÁTICO PARA CREAR TABLAS EN AIVEN ---
const initDB = async () => {
    try {
        console.log("🛠️ Verificando tablas en la base de datos...");
        
        // Crear tabla de productos
        await db.query(`CREATE TABLE IF NOT EXISTS productos (
            id_producto INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            categoria VARCHAR(100),
            precio_costo DECIMAL(10,2),
            precio_venta DECIMAL(10,2),
            stock_actual INT DEFAULT 0
        )`);

        // Crear tabla de movimientos
        await db.query(`CREATE TABLE IF NOT EXISTS movimientos (
            id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
            id_producto INT,
            tipo_movimiento VARCHAR(50),
            descripcion TEXT,
            monto_operacion DECIMAL(10,2),
            ganancia_operacion DECIMAL(10,2),
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log("✅ Tablas listas y verificadas.");
    } catch (err) {
        console.error("❌ Error al inicializar tablas:", err.message);
    }
};

// Ejecutamos la creación de tablas
initDB();

// --- RUTAS DEL SISTEMA ---

// 1. VER TODO EL STOCK
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos ORDER BY id_producto ASC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. REGISTRAR O SUMAR STOCK
app.post('/productos', (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    db.query('SELECT id_producto, stock_actual FROM productos WHERE LOWER(nombre) = LOWER(?)', [nombre], (err, rows) => {
        if (err) return res.status(500).send(err);
        if (rows.length > 0) {
            const id = rows[0].id_producto;
            const nuevoStock = parseInt(rows[0].stock_actual) + parseInt(stock_actual);
            const sqlUpdate = 'UPDATE productos SET stock_actual=?, precio_costo=?, precio_venta=?, categoria=? WHERE id_producto=?';
            db.query(sqlUpdate, [nuevoStock, precio_costo, precio_venta, categoria, id], (err) => {
                if (err) return res.status(500).send(err);
                res.send('✅ Stock actualizado en producto existente');
            });
        } else {
            const sqlInsert = 'INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, stock_actual) VALUES (?, ?, ?, ?, ?)';
            db.query(sqlInsert, [nombre, categoria, precio_costo, precio_venta, stock_actual], (err) => {
                if (err) return res.status(500).send(err);
                res.send('✅ Nuevo producto registrado');
            });
        }
    });
});

// 3. VENDER / COBRAR
app.put('/productos/vender/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM productos WHERE id_producto = ?', [id], (err, row) => {
        if (err || row.length === 0) return res.status(500).send("No encontrado");
        const p = row[0];
        const ganancia = parseFloat(p.precio_venta) - parseFloat(p.precio_costo);
        if (p.categoria !== 'Servicio' && p.stock_actual <= 0) {
            return res.status(400).send("Sin stock disponible");
        }
        const sqlStock = p.categoria === 'Servicio' ? 'SELECT 1' : 'UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?';
        db.query(sqlStock, [id], (err) => {
            if (err) return res.status(500).send(err);
            db.query('INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion) VALUES (?, "VENTA", ?, ?, ?)', 
            [id, `Venta: ${p.nombre}`, p.precio_venta, ganancia]);
            res.send('✅ Venta procesada');
        });
    });
});

// 4. EDITAR / ACTUALIZAR (Manual)
app.put('/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    const sql = 'UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, stock_actual=? WHERE id_producto=?';
    db.query(sql, [nombre, categoria, precio_costo, precio_venta, stock_actual, id], (err) => {
        if (err) return res.status(500).send(err);
        res.send('✅ Actualizado');
    });
});

// 5. BORRAR PRODUCTO
app.delete('/productos/:id', (req, res) => {
    db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.send('✅ Producto eliminado');
    });
});

// 6. FILTRAR MOVIMIENTOS
app.get('/movimientos/rango', (req, res) => {
    const { desde, hasta } = req.query;
    const sql = 'SELECT * FROM movimientos WHERE DATE(fecha) BETWEEN ? AND ? ORDER BY fecha DESC';
    db.query(sql, [desde, hasta], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get('/movimientos/:filtro', (req, res) => {
    const { filtro } = req.params;
    let condicion = "";
    if (filtro === 'hoy') condicion = "WHERE DATE(fecha) = CURDATE()";
    else if (filtro === 'semana') condicion = "WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)";
    else if (filtro === 'mes') condicion = "WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())";
    db.query(`SELECT * FROM movimientos ${condicion} ORDER BY fecha DESC`, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Gomería PRO v2 activo en puerto ${PORT}`));
