const db = require('./db');

async function actualizarBaseDeDatos() {
    try {
        console.log("Conectando para actualizar tabla 'productos'...");
        // Agregamos la columna de precio adicional
        await db.query("ALTER TABLE productos ADD COLUMN precio_adicional DECIMAL(10,2) DEFAULT 0");
        console.log("✅ ¡Éxito! Columna 'precio_adicional' agregada.");
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("⚠️ Nota: La columna ya existe, no hace falta hacer nada.");
        } else {
            console.error("❌ Error al actualizar:", err);
        }
    } finally {
        process.exit();
    }
}

actualizarBaseDeDatos();
