const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ==========================================
// 🛠️ BLOQUE DE AUTO-PARCHE (Arregla la DB al iniciar)
// ==========================================
async function actualizarBaseDeDatos() {
    try {
        console.log("🛠️ Verificando base de datos en Aiven...");
        // Intentamos agregar la columna. Si ya existe, el error será capturado.
        await db.query("ALTER TABLE productos ADD COLUMN precio_adicional DECIMAL(10,2) DEFAULT 0");
        console.log("✅ ¡Éxito! Columna 'precio_adicional' creada.");
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME' || err.errno === 1060) {
            console.log("ℹ️ Base de datos al día: la columna ya existe.");
        } else {
            console.error("❌ Error al verificar DB:", err.message);
        }
    }
}
// Ejecutamos la función apenas arranca el servidor
actualizarBaseDeDatos();
// ==========================================

app.get('/test', (req, res) => res.send("Galeano SysGear - Sistema Gomería v2.0 - Activo"));

// --- PRODUCTOS ---

app.get('/productos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM productos ORDER BY nombre ASC');
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/productos', async (req, res) => {
    const { nombre, categoria, precio_costo, precio_venta, precio_adicional, stock_actual } = req.body;
    try {
        const [existe] = await db.query('SELECT * FROM productos WHERE nombre = ?', [nombre]);
        if (existe.length > 0) {
            await db.query('UPDATE productos SET stock_actual = stock_actual + ? WHERE nombre = ?', [stock_actual, nombre]);
        } else {
            const sql = "INSERT INTO productos (nombre, categoria, precio_costo, precio_venta, precio_adicional, stock_actual) VALUES (?, ?, ?, ?, ?, ?)";
            await db.query(sql, [nombre, categoria, precio_costo, precio_venta, precio_adicional || 0, stock_actual]);
        }
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio_costo, precio_venta, precio_adicional, stock_actual } = req.body;
    try {
        const sql = "UPDATE productos SET nombre=?, categoria=?, precio_costo=?, precio_venta=?, precio_adicional=?, stock_actual=? WHERE id_producto=?";
        await db.query(sql, [nombre, categoria, precio_costo, precio_venta, precio_adicional || 0, stock_actual, id]);
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/productos/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);
        res.send('OK');
    } catch (err) { res.status(500).send(err.message); }
});

// --- VENTA CON LÓGICA DE PRECIO ADICIONAL ---

app.put('/productos/vender/:id', async (req, res) => {
    const { id } = req.params;
    const { esAdicional } = req.body; 
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
        if (rows.length === 0) return res.status(404).send("No encontrado");
        const p = rows[0];

        if (p.categoria !== 'Servicio') {
            await db.query('UPDATE productos SET stock_actual = stock_actual - 1 WHERE id_producto = ?', [id]);
        }

        let precioCobrado = (esAdicional && parseFloat(p.precio_adicional) > 0) 
            ? parseFloat(p.precio_adicional) 
            : parseFloat(p.precio_venta);
        
        const ganancia = precioCobrado - (parseFloat(p.precio_costo) || 0);
        const descrip = `Venta: ${p.nombre}${esAdicional ? ' (ADICIONAL)' : ''} (${p.categoria})`;

        const queryInsert = "INSERT INTO movimientos (id_producto, tipo_movimiento, descripcion, monto_operacion, ganancia_operacion, fecha) VALUES (?, 'VENTA', ?, ?, ?, NOW())";
        await db.query(queryInsert, [id, descrip, precioCobrado, ganancia]);
        res.send('OK');
    } catch (err) { 
        console.error("ERROR EN VENTA:", err);
        res.status(500).send("Error en el servidor"); 
    }
});

// --- REPORTES Y MOVIMIENTOS ---

app.get('/movimientos/todo', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        let sql = "SELECT * FROM movimientos";
        let params = [];
        if (desde && hasta) {
            sql += " WHERE DATE(fecha) BETWEEN ? AND ?";
            params = [desde, hasta];
        }
        sql += " ORDER BY id_movimiento DESC";
        const [results] = await db.query(sql, params);
        res.json(results);
    } catch (err) { res.status(500).json([]); }
});

app.get('/movimientos/hoy', async (req, res) => {
    try {
        const sql = "SELECT * FROM movimientos WHERE DATE(SUBTIME(fecha, '03:00:00')) = DATE(SUBTIME(NOW(), '03:00:00')) ORDER BY id_movimiento DESC";
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { res.status(500).json([]); }
});

app.get('/movimientos/rubros', async (req, res) => {
    try {
        const sql = `
            SELECT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(descripcion, '(', -1), ')', 1) as rubro,
                SUM(monto_operacion) as total
            FROM movimientos 
            WHERE tipo_movimiento = 'VENTA'
            GROUP BY rubro
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) { res.status(500).json([]); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Galeano SysGear en puerto ${PORT}`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Galeano SysGear en puerto ${PORT}`));

