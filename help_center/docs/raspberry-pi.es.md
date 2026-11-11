# Configuración en Raspberry Pi (Experimental)

Esta guía explica cómo configurar **Race Coordinator AI (RC AI)** en una computadora de placa única **Raspberry Pi** utilizando una arquitectura de dos placas.

---

> [!NOTE] Configuración de Hardware Experimental
> Aunque la aplicación principal de Race Coordinator AI para Linux ARM64 se ejecuta de forma nativa y fluida en Raspberry Pi OS de 64 bits, la ejecución en Raspberry Pi está clasificada como **experimental**. A diferencia de la arquitectura integrada de doble núcleo del Arduino Uno Q (que incluye tanto una MPU de aplicaciones como un microcontrolador STM32 de tiempo real en una sola placa), una configuración con Raspberry Pi requiere un **microcontrolador USB externo** (como un Arduino Uno, Nano, Mega o RP2040) para controlar los sensores de pista y los relés de energía.

---

## Arquitectura: ¿Por qué dos placas?

Para comprender por qué Race Coordinator AI utiliza dos placas en una Raspberry Pi, resulta útil analizar la diferencia entre la computación de propósito general y la temporización determinista en tiempo real:

```
┌────────────────────────────────────────────────────────┐
│         Raspberry Pi 4 / 5 (Computadora Host)          │
│                                                        │
│  - Raspberry Pi OS de 64 bits (Debian Linux)           │
│  - Servidor Java 21 y Base de Datos SQLite             │
│  - Servidor de Aplicación Web (Puerto 7070)            │
│  - Pantalla Kiosco Chromium a Pantalla Completa (HDMI) │
└───────────────────────────┬────────────────────────────┘
                            │ Conexión Serie USB
                            │ (/dev/ttyACM0 o /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Microcontrolador Externo (Arduino Uno / Nano)     │
│                                                        │
│  - Firmware en Tiempo Real (racecoordinatorai_sketch)  │
│  - Manejo de Interrupciones con Precisión de µs        │
│  - Entradas Tolerantes a 5V (Fototransistores / IR)    │
│  - Relés de Energía de Pista y Botones de Pausa/Caos   │
└────────────────────────────────────────────────────────┘
```

### ¿Por qué no usar directamente los pines GPIO de la Raspberry Pi?

1. **Jitter de Planificación del Kernel de Linux**:
   Raspberry Pi OS es un sistema operativo multitarea preventivo de propósito general. El kernel de Linux alterna constantemente tiempo de CPU entre tareas del sistema, E/S de red, servicios en segundo plano y renderizado visual. Esto introduce una latencia no determinista ("jitter") que suele oscilar entre **5 y 30 milisegundos**. En el automodelismo de ranura (slot car), un coche ligero que cruza a alta velocidad un sensor óptico o dead strip genera un pulso eléctrico que dura tan solo **1 a 5 milisegundos**. Depender del sondeo GPIO directo o de interrupciones en espacio de usuario bajo Linux provoca pérdidas de vueltas e imprecisiones en los tiempos a nivel de centésimas de segundo.
2. **Voltaje y Protección Eléctrica contra Transitorios**:
   El conector GPIO de 40 pines de la Raspberry Pi opera estrictamente con **lógica de 3,3V** sin protección contra sobretensiones. Conectar cables de pista directamente a la Pi expone la placa a su destrucción por sensores ópticos de 5V, picos inductivos de bobinas de relé o retro-fuerza electromotriz de 12V–18V de los motores de los coches.
3. **La Solución de Dos Placas**:
   Al emparejar la Raspberry Pi con un microcontrolador USB económico (como Arduino Uno R3/R4, Nano, Mega 2560 o Raspberry Pi Pico con firmware Arduino), se obtiene lo mejor de ambos mundos:
   - El **microcontrolador** ejecuta firmware en tiempo real bare-metal con interrupciones de hardware submilisegundo e inmunidad eléctrica a 5V.
   - La **Raspberry Pi** actúa como host de alta potencia para el servidor Java 21, la base de datos SQLite integrada, la red, la síntesis de voz y la visualización HDMI.

---

## Requisitos de Hardware y Variantes de Memoria

### 1. Computadora de Placa Única Raspberry Pi

* **Modelos Compatibles**: **Raspberry Pi 4 Modelo B** o **Raspberry Pi 5** (ARM Cortex-A72 o Cortex-A76 de 64 bits).
* **Sistema Operativo**: Se requiere **Raspberry Pi OS (64 bits)**. La versión de 32 bits no es compatible.
* **Almacenamiento**: Tarjeta microSD de alta velocidad de 16 GB o superior (Clase A1 o A2 recomendada) o un SSD USB 3.0.
* **Fuente de Alimentación**: Fuente de alimentación oficial USB-C de Raspberry Pi (15W para Pi 4, 27W para Pi 5) para evitar caídas de tensión.

### 2 GB frente a 4 GB / 8 GB de RAM

| Modelo | Modo de Operación Recomendado | Descripción |
| :--- | :--- | :--- |
| **Raspberry Pi (2 GB RAM)** | **Modo Dispositivo Sin Monitor (Headless)** | Ideal para funcionar exclusivamente como servidor de pista sin monitor conectado. Los pilotos y comisarios de carrera acceden a la interfaz desde tablets, iPads, móviles o portátiles por Wi-Fi/LAN (`http://<pi-ip>:7070`). Desactivar el navegador kiosco local libera memoria RAM para el servidor Java y la base de datos. |
| **Raspberry Pi (4 GB u 8 GB RAM)** | **Modo Pantalla Kiosco** *(Recomendado)* | Recomendado al conectar un monitor HDMI o televisor directamente a la Pi. Ejecuta el entorno de escritorio completo, el navegador Chromium en pantalla completa, Java y la base de datos simultáneamente con excelente fluidez. |

### 2. Microcontrolador de Temporización Externo

Una placa externa con el firmware de Race Coordinator AI:

* **Placas Recomendadas**:
  * **Arduino Uno R3 o R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideal para pistas de 4 o 6 carriles con numerosos sensores)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** con firmware de Arduino
* **Cable USB**: Cable USB estándar para conectar el microcontrolador a cualquier puerto USB de la Raspberry Pi.
* **Sensores de Pista y Relés**: Conectados al microcontrolador como se describe en la **[Guía de Configuración de Pistas](track-editor.es.md)**.

---

## Instalación Paso a Paso

### Paso 1: Instalar Raspberry Pi OS (64 bits)

1. Descargue y abra **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** en su PC o Mac.
2. Seleccione el modelo de su Raspberry Pi (Pi 4 o Pi 5).
3. En **Sistema Operativo**, elija **Raspberry Pi OS (64-bit)** (Debian Bookworm o Bullseye).
4. Haga clic en **Editar ajustes** (icono de engranaje) para preconfigurar:
   * **Nombre del equipo (Hostname)**: Asigne un nombre reconocible (ej. `racecoordinator` o `slotcar-pi`).
   * **Usuario y Contraseña**: Configure la cuenta de usuario (ej. nombre de usuario `pi`).
   * **Wi-Fi**: Introduzca el SSID y contraseña de su red inalámbrica.
   * **Servicios**: Marque **Habilitar SSH** (con autenticación por contraseña o clave pública).
5. Seleccione la tarjeta microSD o unidad SSD de destino y haga clic en **Escribir**.

### Paso 2: Flashear el Firmware del Microcontrolador

Antes de conectar el Arduino a la Raspberry Pi:

1. Descargue el paquete de lanzamiento de Race Coordinator AI en su ordenador o localice `racecoordinatorai_sketch.ino` en el archivo comprimido dentro de la carpeta `firmware/`.
2. Abra el sketch en el **IDE de Arduino** en su ordenador.
3. Seleccione el modelo de placa (ej. *Arduino Uno* o *Arduino Nano*) y el puerto serie.
4. Haga clic en **Subir** para compilar y grabar el firmware en la placa.
5. Desconecte el microcontrolador del ordenador y conéctelo a cualquier puerto USB de la Raspberry Pi. Se registrará automáticamente como dispositivo serie (habitualmente `/dev/ttyACM0` o `/dev/ttyUSB0`).

### Paso 3: Instalar Dependencias en la Raspberry Pi

Encienda la Raspberry Pi y conéctese por SSH desde el terminal de su ordenador:

```bash
ssh pi@<hostname>.local
# O conéctese mediante la dirección IP de la Pi:
# ssh pi@192.168.1.xxx
```

Actualice los repositorios e instale Java, utilidades de audio, navegador y el gestor de ventanas:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Nota: En versiones recientes de Debian/Raspberry Pi OS Bookworm, el paquete del navegador se llama `chromium` en lugar de `chromium-browser`. Si `chromium-browser` indica que no se encuentra, instale `chromium`).*

### Paso 4: Descargar y Ejecutar el Instalador Automatizado

1. Transfiera el archivo de lanzamiento Linux ARM64 a su Raspberry Pi:
   ```bash
   # Desde el terminal de su PC / Mac:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(También puede descargarlo directamente en la Pi con `curl` o `wget` desde el [Portal de Descargas](downloads.es.md)).*

2. Descomprima el archivo y acceda a la carpeta del instalador:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Ejecute el instalador con `sudo`:
   ```bash
   sudo ./install.sh
   ```

#### Detección Automática de Hardware y Banner Previo

El instalador examina `/proc/device-tree/model` y detecta automáticamente que se ejecuta en una Raspberry Pi:

- **Resolución de Plataforma**: Establece `Hardware Platform: pi`.
- **Cuenta de Servicio**: Asigna la propiedad al usuario que invocó el comando (ej. `pi`), configurando los servicios systemd y permisos del grupo serie (`dialout`).
- **Grabación de Firmware**: Omite automáticamente la compilación y subida del firmware Zephyr del Arduino Uno Q, ya que en la Raspberry Pi se utiliza un Arduino USB externo.

Antes de copiar archivos o configurar servicios, el instalador muestra el **Resumen de Resolución de Configuración Previa**:

```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: pi
   Resolution:      Auto-detected (/proc/device-tree/model: Raspberry Pi 4 Model B Rev 1.5)
 Service Account:   pi
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/pi
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      SKIP (External USB microcontroller used on Raspberry Pi)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

#### Opciones de Línea de Comandos del Instalador

Puede personalizar la instalación mediante argumentos opcionales:

| Argumento | Descripción | Predeterminado |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Forzar el tipo de placa de hardware de destino. | Autodetectado desde `/proc/device-tree/model` (`pi`) |
| `--user=<usuario>` | Cuenta de usuario Linux para `/opt/racecoordinatorai` y servicios. | Autodetectado desde `$SUDO_USER` (por defecto `pi` en Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Omitir explícitamente la compilación/subida del sketch del microcontrolador. | Omitido automáticamente en `pi` |
| `-v`, `--verbose` | Activar salida de registros detallados. | Salida estándar (`false`) |
| `-h`, `--help` | Mostrar ayuda de uso y salir. | - |

---

## Modos de Operación: Kiosco frente a Sin Monitor (Headless)

### 1. Modo Pantalla Kiosco (Pi de 4 GB / 8 GB)

Por defecto, el instalador habilita dos servicios en segundo plano de systemd:

1. `racecoordinatorai.service`: El servidor backend en Java y la base de datos SQLite integrada.
2. `racecoordinatorai-kiosk.service`: Una sesión de Chromium a pantalla completa en la salida HDMI principal en `http://localhost:7070`.

Si tiene un televisor o monitor conectado a la salida HDMI de la Pi, Race Coordinator AI se iniciará automáticamente en modo kiosco a pantalla completa al arrancar.

### 2. Modo Dispositivo Sin Monitor (Headless) (Pi de 2 GB o Servidor Dedicado)

Si dispone de una **Raspberry Pi de 2 GB**, o si la Pi está instalada bajo la pista sin monitor:

```bash
# Detener y deshabilitar permanentemente el navegador kiosco:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Con el servicio de kiosco deshabilitado:

- El servidor consume muy poca memoria RAM (~250–350 MB).
- Puede conectarse desde cualquier dispositivo en la misma red Wi-Fi o cableada abriendo un navegador en:
  ```text
  http://<ip-de-la-raspberry-pi>:7070
  # Ejemplo: http://192.168.1.150:7070 o http://racecoordinator.local:7070
  ```

---

## Configurar la Interfaz de Pista en Race Coordinator AI

Con el servidor en marcha, configure la conexión serie con su microcontrolador externo:

1. Abra la interfaz web en su navegador (`http://localhost:7070` o `http://<pi-ip>:7070`).
2. Diríjase a **Gestor de Pistas** → **Editar Pista**.
3. En la pestaña **Interfaces de Hardware**:
   * **Tipo de Interfaz**: Seleccione **Arduino**.
   * **Puerto**: Seleccione `/dev/ttyACM0` o `/dev/ttyUSB0` (el puerto USB conectado a su Arduino).
   * **Velocidad en Baudios**: `115200`.
4. Haga clic en **Conectar / Probar Interfaz** para verificar la comunicación bidireccional.
5. Asigne los sensores de carril, botones de llamada y relés de pista a los pines del Arduino correspondientes.
6. Haga clic en **Guardar Pista**.

---

## Gestión de Servicios Systemd

Controle los servicios en segundo plano mediante comandos estándar de `systemctl`:

```bash
# Comprobar el estado del servidor y ver registros en tiempo real:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Reiniciar la aplicación:
sudo systemctl restart racecoordinatorai.service

# Comprobar el estado del navegador kiosco (si está habilitado):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Actualizar una Instalación Existente

La actualización de Race Coordinator AI en una Raspberry Pi conserva todos los datos existentes:

* **Conservación de Datos**: Su base de datos (`racecoordinator.db`), historial de carreras, perfiles de pilotos y temas visuales se conservan en `/home/<usuario>/.racecoordinatorai/` y no se sobrescriben.
* **Actualizador Automático en la Aplicación**: Al haber una nueva versión disponible, haga clic en **Instalar Ahora** en el banner de actualización. El script `/opt/racecoordinatorai/scripts/update_app.sh` detecta automáticamente la Raspberry Pi y omite el grabado del sketch.
* **Actualización Manual**: Descargue el nuevo archivo `.tar.gz` y ejecute:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
