# Sistema de Gestión Profesional para Cuarteles de Bomberos (SGP-B)

Este es un sistema integral de gestión diseñado para centralizar la operatividad, administración, personal y finanzas de un Cuartel de Bomberos en una plataforma digital moderna, rápida y segura.

## 🚀 Características Principales

### 📊 Gestión Operativa
- **Dashboard en Tiempo Real**: Resumen de incidencias, personal de guardia y estado de la flota.
- **Libreta de Guardia Digital**: Registro inalterable de novedades con cierre de guardia y auditoría.
- **Mapa de Incidencias**: Visualización geográfica de siniestros y recursos disponibles.

### 🚒 Gestión de Activos y Flota
- **Control de Flota**: Vencimientos de VTV, Seguro y Mantenimiento con alertas automáticas.
- **Inventario Crítico**: Control de stock de herramientas, insumos y equipos de protección (EPP).
- **Control de Cilindros ERA**: Seguimiento de pruebas hidráulicas y carga de aire.

### 👤 Administración de Personal
- **Legajo Digital**: Fichas completas de bomberos con historial médico y capacitaciones.
- **Control de Asistencia**: Registro de horas de guardia, capacitaciones y actividades especiales.
- **Gestión de Jerarquías**: Estructura de mando configurable.

### 💰 Finanzas y Tesorería
- **Contabilidad Centralizada**: Registro de ingresos y egresos con categorías personalizables.
- **Rendición de Subsidios**: Control estricto de fondos nacionales y provinciales (Ley 25.054).
- **Gestión de Cancha/Alquileres**: Agenda de eventos con pagos integrados a la caja del cuartel.

### 🔐 Seguridad y Auditoría
- **Roles y Permisos**: Acceso granular según la función (Admin, Operador, Jefe, Tesorero).
- **Log de Auditoría**: Registro inalterable de quién hizo qué y cuándo.
- **Basado en SQLite**: Base de datos local robusta, sin dependencias externas complejas.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Backend**: Node.js (Express), SQLite (Better-SQLite3), Zod (Validación), JWT (Seguridad).

## 💻 Configuración Local (PowerShell)

1. **Clonar e Ingresar**:
   ```powershell
   git clone https://github.com/aarescalvo/-bomchimp1.git BOMBEROS
   cd BOMBEROS
   ```
2. **Instalar Dependencias**:
   ```powershell
   npm install
   ```
3. **Iniciar Servidor**:
   ```powershell
   npm run start
   ```

## 🔐 Credenciales de Acceso (Por Defecto)

- **Usuario**: `admin`
- **Contraseña**: `admin123`
*(El sistema solicitará cambio de contraseña al primer ingreso por seguridad)*

---

## 📄 Licencia
Este proyecto es una herramienta para el fortalecimiento de las instituciones de emergencia. Puede ser adaptado y escalado según las necesidades de cada cuartel.
