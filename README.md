# 🛞 Sistema de Gestión - Gomería Ebenezer

Sistema integral para el control de stock, ventas y reporte de ganancias reales desarrollado a medida para optimizar la administración del local.

## 🚀 Funcionalidades Principales
* **Gestión de Inventario:** Control de stock con códigos únicos (#ID) y buscador inteligente por nombre o código.
* **Carga de Mercadería:** Sistema inteligente que evita duplicados, sumando stock automáticamente si el producto ya existe en la base de datos.
* **Punto de Venta:** Interfaz rápida para cobrar servicios y productos con descuento de stock en tiempo real.
* **Reportes Financieros:** * Filtrado por día, semana, mes o rango de fechas personalizado.
    * Cálculo automático de **Ganancia Real** (Precio Venta - Precio Costo).
    * Gráficos estadísticos de movimientos.
    * Exportación de reportes a Excel (CSV).

## 🛠️ Tecnologías utilizadas
* **Backend:** Node.js y Express.
* **Base de Datos:** SQLite / MySQL.
* **Frontend:** HTML5, CSS3 y JavaScript Vanilla.
* **Gráficos:** Chart.js.

## 📋 Instalación y Uso
1. Descargar o clonar el repositorio.
2. Abrir la terminal en la carpeta del proyecto.
3. Ejecutar `npm install` para instalar las dependencias necesarias.
4. Iniciar el sistema con el comando `node app.js`.
5. Abrir el navegador en `http://localhost:3000`.
