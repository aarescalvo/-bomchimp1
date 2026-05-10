# Guía de Instalación - SGP-B

Este documento explica cómo poner en marcha el sistema en el cuartel y conectar múltiples equipos (PCs, Tablets, Celulares).

## 📋 1. Requisitos Previos

*   **Servidor:** Una PC que estará siempre encendida (Recomendado: Windows 10/11 o Linux). Debe tener instalado [Node.js v18 o superior](https://nodejs.org/).
*   **Red:** Todos los equipos que usarán el sistema deben estar conectados a la misma red (Wi-Fi o cableada).
*   **Acceso:** Conocimientos básicos para abrir una terminal (CMD o PowerShell).

## 💻 2. Puesta en Marcha del Servidor (PowerShell)

1.  **Clonar el repositorio**: Abre PowerShell y escribe:
    ```powershell
    cd C:\BOMBEROS
    git clone https://github.com/aarescalvo/-bomchimp1.git .
    ```
2.  **Instalar**: Descarga las librerías necesarias:
    ```powershell
    npm install
    ```
3.  **Iniciar**: Lanza el sistema:
    ```powershell
    npm run start
    ```

## 🌐 3. Acceso desde otros equipos (Red Local)

Para que una tablet en la guardia o el jefe desde su oficina vean el sistema:

1.  **Obtener IP del Servidor:** En la PC servidor, abre la terminal y escribe `ipconfig`. Busca el número bajo "Dirección IPv4" (ejemplo: `192.168.1.50`).
2.  **Navegador:** En cualquier otro equipo de la red, abre Chrome o Edge y escribe:
    `http://192.168.1.50:3000`
3.  **Acceso Directo:** Se recomienda "Instalar como aplicación" (PWA) o crear un acceso directo en el escritorio para entrar rápidamente.

## 🛡️ 4. Solución de Problemas

*   **No conecta:** Asegúrate de que el **Firewall de Windows** en la PC Servidor tenga habilitado el puerto **3000** (Entrada y Salida).
*   **Pantalla en blanco:** Verifica que el comando `npm run build` haya terminado sin errores.
*   **Base de Datos:** El archivo `bomberos.db` se creará automáticamente al iniciar. No es necesario configurarlo manualmente.
