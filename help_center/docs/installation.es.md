# Guía de Instalación

Esta guía le guiará a través de la descarga, instalación y configuración de Race Coordinator AI en su ordenador.

---

## Sistemas Operativos Compatibles

Race Coordinator AI es totalmente multiplataforma y se ejecuta tanto en sistemas operativos modernos como clásicos:

| Plataforma | Versiones Compatibles | Instalador Recomendado |
| :--- | :--- | :--- |
| **🪟 Windows (Moderno)** | Windows 10, Windows 11 (64 bits y 32 bits) | **Instalador Online** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Clásico)** | Windows 8, Windows 7, Windows XP | **Instalador Completo Offline** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Requerido para instalación inicial en Win 8 y anteriores)* |
| **🍏 macOS** | macOS 10.15 (Catalina) hasta macOS 15+ (Intel y Apple Silicon) | **Imagen de Disco** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64 bits), Arduino Linux OS, Debian, Ubuntu | **Paquete ARM64 / Linux** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Elección del Canal de Versiones

Race Coordinator AI se distribuye a través de tres canales:

* **🟢 Versiones Estables Oficiales** *(Recomendado)*: Versiones completamente probadas y listas para producción, recomendadas para competiciones habituales, pistas domésticas y clubes.
* **🟡 Vistas Previas Beta**: Versiones preliminares que incluyen próximas funciones, nuevos controladores de hardware y mejoras experimentales para pruebas comunitarias.
* **🔵 Versiones Alpha / Nightly**: Compilaciones automáticas del desarrollo activo.

👉 Visite el **[Portal de Descargas y Versiones](downloads.es.md)** para descargar cualquier versión o consultar el archivo histórico completo.

---

## 🪟 Instalación en Windows

### 1. Descargar el Instalador
* Para **Windows 10 / 11**: Descargue `RaceCoordinatorAI_Online_Setup_*.exe`.
* Para **Windows 8 y anteriores** (o equipos sin conexión activa a Internet): Descargue `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Ejecutar el Instalador
1. Haga doble clic en el archivo `.exe` descargado.
2. Si Windows SmartScreen muestra un aviso de *"Windows protegió su PC"*, haga clic en **Más información** y luego en **Ejecutar de todas formas**.
3. Siga las indicaciones del asistente de Inno Setup para elegir el directorio de instalación (por defecto: `C:\Program Files\RaceCoordinator AI`).
4. Seleccione si desea crear un acceso directo en el escritorio.
5. Haga clic en **Instalar** para completar el proceso.

### 3. Inicio
Haga doble clic en el acceso directo de **Race Coordinator AI** en su escritorio o ábralo desde el Menú de Inicio de Windows.

!!! note "Requisitos para Windows Clásico (XP / 7 / 8)"
    Si utiliza Windows 7, 8 o XP, asegúrese de tener instalado el paquete redistribuible [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784).

---

## 🍏 Instalación en macOS

### 1. Descargar la Imagen de Disco
Descargue `RaceCoordinator_Mac_*.dmg` desde la página de versiones.

### 2. Instalar en Aplicaciones
1. Haga doble clic en el archivo `RaceCoordinator_Mac_*.dmg` descargado para abrir la imagen de disco.
2. Arrastre el icono de **Race Coordinator AI** a la carpeta **Aplicaciones** (Applications).
3. Expulse la imagen de disco.

### 3. Primer Inicio y Seguridad de macOS
1. Abra la carpeta **Aplicaciones** y haga doble clic en **Race Coordinator AI**.
2. Si macOS muestra un aviso indicando que la app no puede abrirse porque proviene de un desarrollador no identificado:
   - Abra **Ajustes del Sistema** → **Privacidad y seguridad**.
   - Desplácese hasta la sección **Seguridad** y haga clic en **Abrir de todos modos** junto a Race Coordinator AI.
   - Alternativamente, mantenga presionada la tecla `Control`, haga clic en el icono de la app en Aplicaciones y elija **Abrir**.

---

## 🐧 Instalación en Linux, Raspberry Pi y Arduino Uno Q

Para dispositivos de hardware dedicados con servicios systemd automáticos, modo pantalla kiosco e interfaces de pista, consulte nuestras guías especializadas:

* **[Guía de Configuración en Arduino UNO Q](arduino-uno-q.es.md)**: Configuración completa para el dispositivo dual-core Arduino Uno Q con microcontrolador STM32 de tiempo real integrado.
* **[Guía de Configuración en Raspberry Pi (Experimental)](raspberry-pi.es.md)**: Configuración para Raspberry Pi 4 / 5 utilizando una arquitectura de dos placas emparejada con un microcontrolador USB Arduino externo.

### 1. Descargar el Paquete Linux
Descargue `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` desde la página de descargas.

### 2. Descomprimir y Ejecutar
1. Abra un terminal y descomprima el archivo en la carpeta deseada:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Asegúrese de que el iniciador tenga permisos de ejecución:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Ejecute la aplicación:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Primer Inicio y Primeros Pasos

Al iniciar Race Coordinator AI por primera vez:

1. **Base de Datos Predeterminada**: La aplicación inicializa automáticamente una base de datos SQLite integrada (`racecoordinator.db`) precargada con pilotos y equipos de ejemplo, una pista predeterminada de 4 carriles y formatos de carrera estándar (Todos contra todos, Entrenamientos).
2. **Modo de Demostración por Teclado**: Puede explorar y probar los modos de carrera inmediatamente utilizando la temporización por teclado sin necesidad de conectar hardware físico.
3. **Configurar Sensores de Pista**: Diríjase a **Gestor de Pistas** → **Editar Pista** para configurar el hardware de su interfaz (Arduino Uno / Uno Q, Phidget, Trak-Mate o cronometraje por webcam).

---

## Actualización de Instalaciones Existentes

La actualización a una versión más reciente de Race Coordinator AI es transparente:

* **Sus Datos se Conservan**: Su base de datos (`racecoordinator.db`), estadísticas de carreras, perfiles de pilotos, configuraciones de pistas y temas visuales se guardan en la carpeta de datos de usuario y **no** se sobrescriben al actualizar.
* **Para Actualizar en Windows**: Simplemente ejecute el instalador descargado sobre la instalación existente o haga clic en **Instalar Ahora** en el banner de actualización dentro de la app.
* **Para Actualizar en Linux / Arduino Uno Q / Raspberry Pi**: Ejecute `sudo /opt/racecoordinatorai/scripts/update_app.sh /ruta/a/RaceCoordinatorAI-Linux-ARM64*.tar.gz` o descomprima el archivo y ejecute `sudo ./install.sh`. Consulte la [Guía de Arduino UNO Q](arduino-uno-q.es.md#actualizar-una-instalación-existente) o la [Guía de Raspberry Pi](raspberry-pi.es.md#actualizar-una-instalación-existente) para más detalles.

---

## Informar de Problemas y Sugerencias

Si encuentra algún problema durante la instalación o desea proponer una mejora:

1. Visite nuestro **[Portal de Incidencias en GitHub](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Busque en los temas existentes para comprobar si ya existe una solución o alternativa publicada.
3. Haga clic en **New Issue** e indique:
   * Sistema operativo y versión.
   * Versión de Race Coordinator AI (ej. `v1.0.0` o `v1.0.0-beta.1`).
   * Pasos para reproducir el problema y capturas de pantalla/registros si procede.
