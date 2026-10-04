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
2. **Modo de dispositivo sin cabeza (No compatible actualmente - Disponible a pedido)**: La placa ejecuta únicamente el servidor backend y se conecta al hardware de la pista, sin que se ejecute ningún monitor ni navegador local. Los usuarios acceden a la interfaz web a través de la red local (`http://<hostname>:7070` o `http://<DIRECCIÓN_IP>:7070`). Como se señaló anteriormente, el modo sin cabeza en el Uno Q no es compatible de inmediato, pero se puede agregar a pedido si el Uno Q tiene una conexión de red.

---

## Instalación paso a paso

### Paso 1: Preparar la placa y conectarse mediante SSH
1. Instale **Arduino Linux OS** (Debian 12 arm64) en el Uno Q.
2. Conecte la placa a su red local mediante Wi-Fi o Ethernet:
   * **Configuración de Wi-Fi en el primer inicio**: En el inicio inicial, el asistente de configuración le solicitará configurar la red inalámbrica.
   * **Nota sobre la primera conexión**: Es posible que la conexión Wi-Fi no surta efecto de inmediato tras ingresarla por primera vez, y los comandos manuales de terminal como `sudo nmcli dev wifi connect "Su_SSID" password "Su_Contraseña"` también podrían fallar en el primer arranque. Si esto sucede, simplemente ejecute `sudo reboot`. Al reiniciar, el adaptador inalámbrico se inicializa correctamente y se conecta automáticamente a su red Wi-Fi configurada.
   * **Aplicar actualizaciones de la placa y del firmware**: Al reiniciar (o cuando el sistema lo solicite), es posible que se le pregunte si desea actualizar varios paquetes y componentes de firmware en la placa. Se recomienda encarecidamente aceptar y realizar todas las actualizaciones sugeridas, ya que el firmware de fábrica suele estar desactualizado. Tenga en cuenta que esta actualización inicial puede demorar bastante (a menudo entre 5 y 10 minutos o más, según la velocidad de la red y el tamaño de los paquetes), así que permita que se complete sin interrupciones.
3. Habilitar SSH en la placa y conectarse:
   * **Habilitar el servicio SSH**: De forma predeterminada, el servidor SSH no se está ejecutando en la placa. Desde la terminal local (usando el teclado y la pantalla conectados a la placa), habilite e inicie el servicio SSH:
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Buscar nombre de host y dirección IP**: Ejecute `hostname` y `hostname -I` en la placa para descubrir el nombre de host asignado a su placa y la dirección IP local (la configuración de fábrica a menudo asigna un nombre único como `allianora` en lugar de `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Nota: `avahi-daemon` no viene preinstalado en Arduino Linux OS, por lo que los nombres de dominio mDNS `.local` como `uno-q.local` no existen de forma predeterminada a menos que instale el paquete mediante `sudo apt-get install -y avahi-daemon`).*
   * **Conectarse desde su PC**: Abra una terminal en su computadora y conéctese usando el nombre de host o la dirección IP de la placa:
     ```bash
     ssh arduino@<hostname>
     # O conéctese directamente a través de IP:
     ssh arduino@<DIRECCIÓN_IP>
     ```

### Paso 2: Instalar requisitos previos
Instale el entorno de ejecución Java (`default-jre-headless`), las utilidades de audio (`espeak-ng`, `alsa-utils`), `chromium` y el control del gestor de ventanas (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Nota: En Debian, el paquete del navegador se llama `chromium` en lugar de `chromium-browser`, y `default-jre-headless` proporciona el entorno de ejecución estándar de OpenJDK. La utilidad `wmctrl` es utilizada por el servicio quiosco para garantizar que Race Coordinator AI mantenga el foco de la ventana frente a aplicaciones de inicio automático del escritorio como Arduino App Lab).*

Verifique que `arduino-cli` esté instalado:
```bash
arduino-cli version
```
*(Si `arduino-cli` no está preinstalado en su placa, instálelo mediante: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Paso 3: Instalar el paquete de la aplicación y los servicios Systemd
Transfiera `RaceCoordinatorAI-Linux-ARM64.tar.gz` desde su computadora a la placa:
```bash
# Desde la terminal de su computadora portátil:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Elija uno de los siguientes métodos de instalación:

#### Opción A: Instalación automatizada llave en mano (Recomendado)
El instalador automatizado gestiona la verificación de requisitos previos, la configuración de directorios, los permisos seriales, el registro de servicios systemd, la carga del firmware del microcontrolador y el inicio inmediato con manejo de errores:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```
*(Nota: Cualquier advertencia del tipo `tar: Ignoring unknown extended header...` son etiquetas de metadatos de macOS inofensivas y se pueden ignorar con seguridad).*

#### Opción B: Instalación manual paso a paso (Alternativa)
Si prefiere un control manual o necesita personalizar su configuración:
1. **Extraer archivos de la aplicación a `/opt/racecoordinatorai`**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Configurar permisos y acceso al grupo de puerto serie**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout arduino
   ```

3. **Instalar y registrar servicios systemd**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

#### Actualizar manualmente una instalación existente (Desde el archivo descargado)
Cuando descargue una actualización de versión (como `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` guardada en `~/Downloads/` a través del cuadro de diálogo del navegador o transferida manualmente), puede aplicar la actualización utilizando cualquiera de los siguientes métodos:

##### Método 1: Script auxiliar de actualización integrado (Más rápido y recomendado)
Race Coordinator AI incluye un script de actualización automatizado que descomprime la versión sobre `/opt/racecoordinatorai`, recompila y carga el firmware del microcontrolador si se actualizó, y reinicia los servicios:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```

##### Método 2: Extraer y ejecutar `install.sh` desde el paquete descargado
```bash
# Extraer el archivo descargado
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Ejecutar el instalador sobre la instalación existente (conserva bases de datos y configuraciones)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Método 3: Extracción manual directa de archivos
Si prefiere realizar cada paso manualmente:
1. **Detener los servicios activos**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Extraer los archivos actualizados en `/opt/racecoordinatorai`**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
3. **Asegurar los permisos correctos**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Volver a flashear el firmware del microcontrolador (si el sketch se actualizó)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Reiniciar los servicios**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
   ```

### Paso 4: Flashear el firmware del microcontrolador (con soporte FastLED)
Compile y cargue el sketch de hardware en la MCU integrada:
```bash
# Comprobar placas y puertos detectados
arduino-cli board list

# Instalar el núcleo de placa Zephyr en arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Instalar las bibliotecas de Arduino requeridas (puente de router Uno Q y FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# Compilar racecoordinatorai_sketch para la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Cargar en la MCU integrada a través del puente de red interno
# (Ingrese la contraseña 'arduino' cuando se le solicite, o use --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Como se verifica mediante `arduino-cli board list`, el microcontrolador Uno Q ejecuta Zephyr OS sobre el puente de red interno `172.17.0.1` con FQBN `arduino:zephyr:unoq`. La biblioteca `Arduino_RouterBridge` es necesaria para la comunicación en serie a través del puente SoC. Las tiras de luces LED FastLED no son compatibles actualmente en la arquitectura STM32U5 / Zephyr Cortex-M33 debido a definiciones de registros de CMSIS 6 en upstream, pero todas las funciones principales de la pista—sensores de vuelta, tiempos de sector, botones de llamada y relés de pista—están completamente operativas).*

### Paso 5: Iniciar servicios e iniciar la pantalla quiosco
Inicie el daemon backend y habilite el quiosco de TV a pantalla completa:
```bash
# Iniciar el servidor backend
sudo systemctl start racecoordinatorai

# Ya habilitó el daemon backend anteriormente.
# Ahora habilite el servicio quiosco de TV para el inicio gráfico del sistema:
sudo systemctl enable racecoordinatorai-kiosk.service

# Iniciar la pantalla quiosco de TV a pantalla completa inmediatamente
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Foco de ventanas y aplicaciones de inicio automático de escritorio (ej. Arduino App Lab)

En el Arduino Uno Q, Arduino Linux OS inicia "Arduino App Lab" al iniciar la sesión de escritorio.
- **Retención automática de foco**: De manera predeterminada, `start_kiosk.sh` utiliza `wmctrl` para traer automáticamente Race Coordinator AI al frente y retener el foco, asegurando que la pantalla del televisor esté lista inmediatamente para las carreras sin requerir cambio manual mediante ratón o teclado.
- **Opcional: Deshabilitar App Lab en el arranque**: Para un quiosco de pista de carreras dedicado donde Arduino App Lab no sea necesario en el arranque, puede deshabilitar su entrada de inicio automático:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
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

> [!TIP]
> Si descargó un archivo de versión `.tar.gz` a través del enlace **Descargar actualización** en el navegador, consulte [Actualizar manualmente una instalación existente](#actualizar-manualmente-una-instalacion-existente-desde-el-archivo-descargado) más arriba para aplicar la actualización.

