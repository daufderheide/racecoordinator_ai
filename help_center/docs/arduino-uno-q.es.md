# Guía de configuración de Arduino UNO Q

Esta guía explica cómo configurar **Race Coordinator AI (RC AI)** en la placa de desarrollo híbrida **Arduino UNO Q** como un dispositivo de hardware independiente.

---

## Descripción general del hardware y variantes de memoria

El **Arduino UNO Q** combina una computadora de placa única (SBC) Linux de 64 bits con un microcontrolador en tiempo real en una sola placa:

- **MPU Linux (Qualcomm Cortex-A53 @ 2,0 GHz)**: Ejecuta el servidor de Race Coordinator AI, la base de datos SQLite, el servidor de cliente web y el actualizador automático.
- **MCU en tiempo real (STM32U585 Cortex-M33 @ 160 MHz)**: Gestiona las interrupciones de pines de sensores de vuelta, relés de alimentación y puentes de luces RGB FastLED con precisión submilisegundo.
- **Salida de pantalla**: La salida DisplayPort por USB-C se conecta directamente a un monitor, televisor o pantalla táctil.

### Modelos de 4 GB frente a 2 GB

* **Arduino UNO Q de 4 GB (Recomendado y compatible)**: Equipado con 4 GB de RAM y 32 GB de almacenamiento eMMC. Este modelo es necesario para el **Modo de pantalla quiosco** (controlando directamente un televisor o monitor HDMI/DisplayPort), ya que ejecutar el escritorio Linux, el navegador Chromium, el entorno de ejecución Java y la base de datos SQLite simultáneamente requiere más de 2 GB de memoria.
* **Arduino UNO Q de 2 GB (Consideración para modo sin cabeza / Headless)**:
  * Si bien el modelo de 2 GB carece de la memoria necesaria para ejecutar sin problemas el escritorio local y la pantalla quiosco de Chromium, tiene memoria suficiente para ejecutar el servidor backend en **Modo de dispositivo sin cabeza (Headless)**.
  * **Estado de compatibilidad actual**: El modo sin cabeza en el Uno Q **no es compatible actualmente**, ya que aún se requieren cambios adicionales en el paquete de soporte y la configuración del Uno Q. Sin embargo, la compatibilidad con el modo sin cabeza en el Q de 2 GB **podría agregarse a pedido**, siempre que el Uno Q tenga una conexión de red activa (Wi-Fi o Ethernet) para permitir que los directores de carrera y los pilotos accedan a la interfaz web desde otros dispositivos en la red.

---

## Modos de funcionamiento

1. **Modo de pantalla quiosco (Modelo de 4 GB)**: Conecte un monitor o televisor HDMI/DisplayPort directamente al puerto USB-C del Uno Q mediante un adaptador multipuerto. La placa inicia automáticamente Chromium en modo quiosco a pantalla completa (`http://localhost:7070`) y al mismo tiempo permite conexiones de red remotas.
2. **Modo de dispositivo sin cabeza (No compatible actualmente - Disponible a pedido)**: La placa ejecuta únicamente el servidor backend y se conecta al hardware de la pista, sin que se ejecute ningún monitor ni navegador local. Los usuarios acceden a la interfaz web a través de la red local (`http://uno-q.local:7070`). Como se señaló anteriormente, el modo sin cabeza en el Uno Q no es compatible de inmediato, pero se puede agregar a pedido si el Uno Q tiene una conexión de red.

---

## Instalación paso a paso

### Paso 1: Preparar la placa y conectarse mediante SSH
1. Instale **Arduino Linux OS** (Debian 12 arm64) en el Uno Q.
2. Conecte la placa a su red local mediante Wi-Fi o Ethernet.
3. Abra una sesión SSH:
   ```bash
   ssh arduino@uno-q.local
   ```

### Paso 2: Instalar requisitos previos
Instale OpenJDK 11, `arduino-cli`, utilidades de pantalla y Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Paso 3: Flashear el firmware del microcontrolador (con soporte FastLED)
Compile y cargue el sketch de hardware en la MCU STM32 integrada:
```bash
# Instalar el núcleo de placa STM32 en arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# Compilar y cargar racecoordinatorai_sketch
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Paso 4: Instalar el paquete de la aplicación y los servicios Systemd
1. Descargue `RaceCoordinatorAI-Linux-ARM64.tar.gz` y descomprímalo en `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Ejecute el script de instalación:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Inicie los servicios:
   ```bash
   # Iniciar el servidor backend
   sudo systemctl start racecoordinatorai

   # (Opcional) Habilitar quiosco de pantalla local en USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
   ```

---

## Configuración del puente de luces RGB FastLED

FastLED es totalmente compatible con el Uno Q. Las tiras de LED RGB direccionables (WS2812B, NeoPixel, SK6812, APA102) se conectan directamente a los pines de cabecera GPIO en la MCU STM32.

- **Luces de salida**: Animación de cuenta regresiva de 5 etapas (rojo $\rightarrow$ amarillo $\rightarrow$ verde).
- **Pit Lane / Reabastecimiento de combustible**: Indicador de porcentaje de nivel de combustible en tiempo real por carril.
- **Líder y victoria**: Pulso dinámico para el líder de manga y animación de bandera a cuadros.

---

## Actualizaciones automáticas de software

Cuando está conectado a Wi-Fi, Race Coordinator AI comprueba las versiones de GitHub automáticamente:
1. **Actualización de la aplicación**: Descarga el nuevo paquete Linux ARM64 en segundo plano.
2. **Reinicio del servicio**: Reinicia `racecoordinatorai.service` mediante systemd sin problemas.
3. **Sincronización del sketch de MCU**: Vuelve a flashear automáticamente el firmware del microcontrolador STM32 utilizando `arduino-cli` si se actualizó `racecoordinatorai_sketch.ino`.
