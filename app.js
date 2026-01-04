const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// 1. VER TODO EL STOCK (Ordenado por ID para usar como Código)
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos ORDER BY id_producto ASC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. REGISTRAR O SUMAR STOCK (Evita duplicados por nombre)
app.post('/productos', (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, stock_actual } = req.body;
    
    // Verificamos si ya existe el nombre (ignorando mayúsculas)
    db.query('SELECT id_producto, stock_actual FROM productos WHERE LOWER(nombre) = LOWER(?)', [nombre], (err, rows) => {
        if (err) return res.status(500).send(err);

        if (rows.length > 0) {
            // Si ya existe, SUMAMOS el stock nuevo al anterior y actualizamos precios
            const id = rows[0].id_producto;
            const nuevoStock = parseInt(rows[0].stock_actual) + parseInt(stock_actual);
            
            const sqlUpdate = 'UPDATE productos SET stock_actual=?, precio_costo=?, precio_venta=?, categoria=? WHERE id_producto=?';
            db.query(sqlUpdate, [nuevoStock, precio_costo, precio_venta, categoria, id], (err) => {
                if (err) return res.status(500).send(err);
                res.send('✅ Stock actualizado en producto existente');
            });
        } else {
            // Si no existe, creamos uno nuevo
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

        // Descontamos stock si no es servicio
        const sqlStock = p.categoria === 'Servicio' ? 
            'SELECT 1' : 
            'UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?';

        db.query(sqlStock, [id], (err) => {
            if (err) return res.status(500).send(err);
            
            // Registramos el movimiento
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

app.listen(3000, () => console.log("🚀 Servidor Gomería PRO v2 activo"));