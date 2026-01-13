# 🛞 Sistema de Gestión - Gomería Ebenezer

Sistema integral de gestión desarrollado para el control de stock, ventas y reportes de ganancias en tiempo real. La aplicación está optimizada para funcionar en la nube.

## 🌐 Arquitectura del Sistema
El sistema ya no depende de recursos locales, utilizando una infraestructura moderna:
* **Servidor:** Node.js desplegado en **Render**.
* **Base de Datos:** MySQL gestionado en **Aiven Cloud**.
* **Acceso:** Multi-dispositivo (Admin Dueño y Terminal de Ventas).

## 🚀 Funcionalidades Principales

* **Gestión de Inventario Cloud:** Control de stock centralizado con buscador inteligente.
* **Carga Inteligente de Mercadería:** El sistema detecta si un producto ya existe y ofrece sumar el stock automáticamente para evitar duplicados.
* **Punto de Venta (Terminal):** Interfaz optimizada para el despacho rápido de productos y servicios.
* **Reportes Dinámicos:** * Cálculo automático de **Ganancia Real** (Precio Venta - Precio Costo).
    * Gráficos estadísticos (Chart.js) que separan ganancias de Productos vs. Servicios.
    * Filtrado avanzado por fechas y exportación a Excel (CSV).

## 🛠️ Tecnologías utilizadas

* **Backend:** Node.js con Express.
* **Base de Datos:** MySQL (con soporte SSL para Aiven).
* **Frontend:** HTML5, CSS3 (Diseño con fondos personalizados y desenfoque/glassmorphism) y JavaScript Vanilla.
* **Gráficos:** Chart.js.

## 📋 Configuración para el Desarrollador

Si deseas clonar este proyecto para realizar pruebas locales conectándote a la base de datos actual:

1.  **Instalación:**
    ```bash
    npm install
    ```
2.  **Variables de Entorno:**
    Asegúrate de configurar las credenciales de Aiven en el archivo `db.js` o mediante variables de entorno en Render:
    * `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.

3.  **Ejecución:**
    ```bash
    npm start
    ```

---
*Desarrollado para optimizar la administración y el control de caja diario de Gomería Ebenezer.*
