# Guía de Instalación - Cuartel de Bomberos Chimpay

Este documento explica cómo poner en marcha el sistema en el cuartel y conectar múltiples equipos.

## 1. Requisitos Previos
*   **Servidor:** Una PC que estará siempre encendida (puede ser la de administración). Debe tener instalado [Node.js](https://nodejs.org/).
*   **Red:** Todos los equipos (PC de guardia, Tablets, Celulares) deben estar conectados a la misma red Wi-Fi o cableada que el Servidor.

## 2. Instalación en el Servidor
1.  Descarga el código del sistema en la PC Servidor.
2.  Abre una terminal (CMD o PowerShell) en la carpeta del proyecto.
3.  Ejecuta: `npm install` para instalar las dependencias.
4.  Ejecuta: `npm run build` para preparar el sistema.
5.  Ejecuta: `npm run start` para iniciar el servidor.

## 3. Conexión de otros equipos (Red Local)
Para que una tablet o la PC de guardia vea el sistema:
1.  **Obtener la IP del Servidor:** En la PC servidor, abre la terminal y escribe `ipconfig`. Busca "Dirección IPv4" (ejemplo: `192.168.1.15`).
2.  **Acceder desde otro equipo:** Abre el navegador (Chrome recomendado) y escribe la IP seguida de `:3000`.
    *   Ejemplo: `http://192.168.1.15:3000`
3.  **Tip:** Crea un acceso directo en el escritorio o pantalla de inicio de las tablets para entrar con un solo toque.

## 4. Configuración de Seguridad
Si los otros equipos no cargan, asegúrate de que el **Firewall de Windows** en el servidor permita tráfico por el puerto **3000**.
