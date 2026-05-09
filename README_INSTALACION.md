# 🚒 Guía de Instalación: Sistema CUARTEL BOMBEROS CHIMPAY

¡Bienvenido! Esta guía está diseñada para que cualquier persona, incluso sin conocimientos de programación, pueda instalar y ejecutar este sistema de gestión en una computadora del cuartel.

## 1. Requisitos Previos (Lo que necesitas instalar)

Antes de empezar, debes instalar un programa que permite que el sistema funcione.

1.  **Descargar Node.js**: Ve a [nodejs.org](https://nodejs.org/es/) y descarga la versión que dice **"LTS"** (es la más estable).
2.  **Instalación**: Abre el archivo descargado y dale a "Siguiente" en todo. No hace falta cambiar ninguna opción.

## 2. Preparar el Programa

1.  **Descargar el código**: Una vez que tengas los archivos del programa en tu computadora (ya sea bajando el archivo ZIP de GitHub o clonándolo):
2.  **Abrir una Terminal**:
    *   En Windows: Escribe `cmd` en el buscador de inicio y dale Enter.
    *   Escribe `cd` seguido de un espacio y arrastra la carpeta del programa adentro de la ventana negra. Dale Enter.

## 3. Instalación de Componentes

En esa misma ventana negra, escribe el siguiente comando y dale Enter:
```bash
npm install
```
*Esto descargará todas las "piezas" que el sistema necesita para funcionar. Puede tardar un par de minutos.*

## 4. Cómo poner el sistema en marcha

Para iniciar el programa, escribe esto:
```bash
npm run dev
```

Verás un mensaje que dice algo como:
`Server running on http://localhost:3000`

## 5. Cómo entrar al sistema

1.  Abre tu navegador de internet (Chrome, Edge, etc.).
2.  En la barra de direcciones escribe: `http://localhost:3000`
3.  **Usuario Administrador inicial**:
    *   **Usuario**: `admin`
    *   **Contraseña**: `admin123`

---

## 💡 Propuestas de Mejora o Implementación (Fase 3)

Como experto en desarrollo, te propongo las siguientes mejoras para llevar el sistema al siguiente nivel:

1.  **Módulo de Geolocalización de Hidrantes**: 
    *   Integrar un mapa de Chimpay con la ubicación de todas las bocas de incendio (hidrantes) y puntos de carga de agua para las unidades.

2.  **Generación de Informes en PDF**:
    *   Poder descargar la "Ficha de Incidente" o el "Legajo del Bombero" en un formato PDF profesional y listo para imprimir o enviar por correo.

3.  **Alertas de Vencimiento de Carnets y Seguros**:
    *   Un sistema que avise automáticamente 30 días antes de que venza el registro de conducir de un chofer o el seguro de una unidad.

4.  **Notificaciones vía Telegram/WhatsApp**:
    *   Integrar un bot que envíe un mensaje a los celulares de la dotación activa en cuanto se carga un nuevo incidente en el sistema.

5.  **Modo Tablet para Unidades**:
    *   Una vista simplificada y con botones grandes para que los choferes puedan marcar "En Camino", "Llegada al Lugar" y "Libre" directamente desde una tablet en el camión.

6.  **Copia de Seguridad Automática**:
    *   Configurar un respaldo diario de la base de datos (SQLite) en una carpeta compartida o en la nube para nunca perder la información.

---

*Nota: Para subirlo a GitHub, recuerda usar el botón de **Settings -> Export to GitHub** aquí en la interfaz de AI Studio.*
