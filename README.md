# Sistema de Gestión para Bomberos (SGB-B)

Este es un sistema integral de gestión para cuarteles de bomberos, diseñado para centralizar la operatividad, administración y tesorería en una sola plataforma digital.

## Características Principales

- **Dashboard Operativo**: Vista unificada de incidentes activos, personal de guardia y estado de flota.
- **Libreta de Guardia**: Registro digital de novedades con firma de autor y límites de edición para auditoría.
- **Gestión de Flota**: Control de vehículos, herramientas (cilindros ERA) con alertas de VTV, Seguro y Mantenimiento.
- **Legajo de Personal**: Gestión de bomberos, cursos de capacitación (IBNCA) y habilitaciones.
- **Tesorería y Finanzas**: Libro de caja con categorías predefinidas y reportes de balance mensual.
- **Gestión de Cancha**: Sistema de alquiler de turnos con calendario, señas y cobros integrados a tesorería.
- **Alertas Unificadas**: Panel centralizado de vencimientos críticos.
- **Seguridad y Auditoría**: Sistema de roles y permisos con log de auditoría inalterable.

## Requisitos Técnicos

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Express, SQLite3 (Better-SQLite3), JWT Authentication, Zod Validation.
- **Seguridad**: contraseñas hasheadas con Bcrypt, validación de permisos por middleware.

## Configuración Local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (`.env`):
   - `JWT_SECRET`: Llave para firmas de tokens.
4. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```

## Usuarios Predefinidos

- **Admin**: `admin` / `admin123`
- **Jefatura**: `jefe` / `bombero`
- **Tesorero**: `tesorero` / `bombero`

## Auditoría
Todas las operaciones críticas (creación, edición, eliminación) son registradas en la tabla `audit_logs` con el usuario, marca de tiempo y detalles del cambio.
