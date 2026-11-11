# Guía de configuración de Arduino UNO Q

Esta guía explica cómo configurar **Race Coordinator AI (RC AI)** en la placa de desarrollo híbrida **Arduino UNO Q** como un dispositivo de hardware independiente.

---

## Descripción general del hardware y variantes de memoria

El **Arduino UNO Q** combina una computadora de placa única (SBC) Linux de 64 bits con un microcontrolador en tiempo real en una sola placa:

- **MPU Linux (Qualcomm Cortex-A53 @ 2,0 GHz)**: Ejecuta el servidor de Race Coordinator AI, la base de datos SQLite, el servidor de cliente web y el actualizador automático.
- **MCU en tiempo real (STM32U585 Cortex-M33 @ 160 MHz)**: Gestiona las interrupciones de pines de sensores de vuelta, tiempos de sector, botones de llamada y relés de alimentación de pista con precisión submilisegundo (nota: los LED RGB direccionables FastLED no son compatibles con esta arquitectura).
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

### Paso 1: Preparar la placa y conectarse a través de la red

1. **Encender la placa** *(Por lo general, no es necesario flashear)*:
   * Su Arduino Uno Q viene con **Arduino Linux OS (Debian 12 arm64) preinstalado** en su memoria flash eMMC interna de 32 GB. Simplemente conecte la placa a la corriente para iniciar el sistema operativo.
   * *(Nota: Flashear una imagen del sistema operativo solo es necesario si está recuperando un sistema dañado o realizando un restablecimiento completo de fábrica).*

2. **Configuración de la conexión de red**:
   > [!IMPORTANT]
   > **Acceso a Internet solo necesario durante la configuración inicial**: Se requiere estrictamente una conexión de red con acceso a Internet durante esta configuración inicial para actualizar paquetes y descargar prerrequisitos. Una vez completada la configuración, Race Coordinator AI funciona 100% de forma local y sin conexión, sin requerir conexión a Internet. Sin embargo, mantener la placa conectada a su red local ofrece importantes beneficios continuos:
   > - **Actualizaciones automáticas de software**: Descargue e instale nuevas versiones de Race Coordinator AI y actualizaciones de firmware directamente desde la interfaz web.
   > - **Acceso remoto de clientes**: Los directores de carrera, pilotos y espectadores pueden conectar sus teléfonos, tabletas o computadoras portátiles directamente a la interfaz web de la placa (`http://<hostname>:7070` o `http://<DIRECCIÓN_IP>:7070`) a través de su red local.

   * **Configuración de Wi-Fi mediante el asistente en pantalla**: En el primer arranque, el asistente de configuración en pantalla le solicitará configurar la red inalámbrica. Seleccione su red Wi-Fi e ingrese la contraseña.
   * **Alternativa: Configurar Wi-Fi mediante la línea de comandos**: Si no configuró el Wi-Fi durante el asistente o necesita configurarlo manualmente en la terminal:
     ```bash
     # Listar redes inalámbricas disponibles:
     nmcli dev wifi list

     # Conectarse a su red Wi-Fi:
     sudo nmcli dev wifi connect "Su_SSID" password "Su_Contraseña"
     ```
   * **Alternativa: Ethernet por cable**: Simplemente conecte un cable Ethernet a la placa (o un adaptador Ethernet USB-C). El adaptador de red se configura automáticamente mediante DHCP.
   * **Nota sobre la primera conexión**: La conexión Wi-Fi puede no surtir efecto de inmediato tras ingresarla por primera vez, o los comandos manuales `nmcli` pueden mostrar errores temporales en el primer arranque. Si esto sucede, simplemente ejecute `sudo reboot`. Al reiniciar, el adaptador inalámbrico se inicializa correctamente y se conecta automáticamente a su red Wi-Fi configurada.
   * **Aplicar actualizaciones de la placa y del firmware**: Al reiniciar (o cuando el sistema lo solicite), es posible que se le pregunte si desea actualizar varios paquetes y componentes de firmware en la placa. Se recomienda encarecidamente aceptar y realizar todas las actualizaciones sugeridas, ya que el firmware de fábrica suele estar desactualizado. Tenga en cuenta que esta actualización inicial puede demorar bastante (a menudo entre 5 y 10 minutos o más, según la velocidad de la red y el tamaño de los paquetes), así que permita que se complete sin interrupciones.

3. **Habilitar SSH en la placa y conectarse (Recomendado)**:
   * Configurar la placa es más sencillo mediante SSH desde su computadora, ya que puede copiar y pegar los comandos de instalación directamente.
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
   * **Conectarse desde su PC**:
     * **macOS**: Abra la aplicación integrada **Terminal** o **iTerm2** ([iterm2.com](https://iterm2.com/)) y conéctese a través de la línea de comandos:
       ```bash
       ssh arduino@<hostname>
       # O conéctese directamente a través de IP:
       ssh arduino@<DIRECCIÓN_IP>
       ```
     * **Windows**: Puede usar PowerShell o el Símbolo del sistema integrados (ejecutando `ssh arduino@<hostname>` o `ssh arduino@<DIRECCIÓN_IP>`) o utilizar un cliente SSH gráfico como **PuTTY** (descargar desde [putty.org](https://www.putty.org/)). Si utiliza PuTTY:
       1. Ingrese el nombre de host o la dirección IP de la placa en el campo **Host Name (or IP address)**.
       2. Asegúrese de que el puerto sea `22` y el tipo de conexión sea **SSH**.
       3. Haga clic en **Open**, acepte la advertencia de clave de host en la primera conexión e inicie sesión como `arduino` con su contraseña.

### Paso 2: Instalar requisitos previos
Instale el entorno de ejecución Java (`default-jre-headless`), las utilidades de audio (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` y el control del gestor de ventanas (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
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
# O para ver salida detallada:
# sudo ./install.sh -v
```
*(Nota: Cualquier advertencia del tipo `tar: Ignoring unknown extended header...` son etiquetas de metadatos de macOS inofensivas y se pueden ignorar con seguridad).*

> [!NOTE] Descarga y duración del núcleo Zephyr (~5 a 10+ minutos)
> Durante la instalación inicial, `arduino-cli` descarga y descomprime el **núcleo de placa Zephyr (`arduino:zephyr`)** para la MCU STM32U5 Cortex-M33 integrada. Este paquete contiene el sistema operativo en tiempo real Zephyr completo, la cadena de herramientas de compilador cruzado ARM y bibliotecas de hardware (~500 MB+ de descarga y decenas de miles de archivos).
>
> - **Tiempo estimado**: **5 a 10+ minutos** dependiendo de la velocidad de su conexión a internet y de escritura en la memoria eMMC. **¡Momento ideal para tomar un café!**
> - **Progreso en consola**: El progreso de descarga y descompresión se muestra directamente en la terminal. Si desea ver detalles adicionales del compilador y desempaquetado, ejecute `sudo ./install.sh -v`.
> - **Verificación del progreso desde una segunda consola / SSH**: Si alguna vez le preocupa que la instalación se haya detenido, abra una segunda sesión SSH (o pestaña de terminal en el Uno Q) y ejecute:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   Podrá comprobar que `arduino-cli` utiliza activamente CPU y E/S mientras descarga y extrae los paquetes. También puede ver los archivos descargándose en:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

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
   sudo usermod -a -G dialout,audio arduino
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

### Paso 4: Flashear el firmware del microcontrolador
Compile y cargue el sketch de hardware en la MCU integrada:
```bash
# Comprobar placas y puertos detectados
arduino-cli board list

# Instalar el núcleo de placa Zephyr en arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Instalar las bibliotecas de Arduino requeridas (puente de router Uno Q)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# Compilar racecoordinatorai_sketch para la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Cargar en la MCU integrada a través del puente de red interno
# (Ingrese la contraseña 'arduino' cuando se le solicite, o use --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Como se verifica mediante `arduino-cli board list`, el microcontrolador Uno Q ejecuta Zephyr OS sobre el puente de red interno `172.17.0.1` con FQBN `arduino:zephyr:unoq`. La biblioteca `Arduino_RouterBridge` es necesaria para la comunicación en serie a través del puente SoC. Tenga en cuenta que ejecutar `arduino-cli core install arduino:zephyr` descarga más de 500 MB y tarda de 5 a 10+ minutos en descomprimirse en el almacenamiento eMMC (tómese un café mientras finaliza; puede verificar el progreso con `top -p $(pgrep arduino-cli)` en una segunda terminal). Las tiras de luces LED FastLED no son compatibles actualmente en la arquitectura STM32U5 / Zephyr Cortex-M33 debido a definiciones de registros de CMSIS 6 en upstream, pero todas las funciones principales de la pista—sensores de vuelta, tiempos de sector, botones de llamada y relés de pista—están completamente operativas).*

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

## Compatibilidad con FastLED y LED RGB (No compatible en Uno Q)

> [!WARNING] Tiras LED RGB direccionables FastLED no compatibles en la MCU del Uno Q
> Las tiras de luces LED RGB direccionables (WS2812B, NeoPixel, SK6812, APA102, etc.) controladas mediante **FastLED no son compatibles con el microcontrolador integrado del Arduino Uno Q**. La MCU en tiempo real del Uno Q utiliza una arquitectura STM32U585 con Zephyr OS (CMSIS 6), que carece de soporte para registros de bajo nivel y temporización de bit-banging en la biblioteca upstream de FastLED. En consecuencia, el sketch de Race Coordinator AI (`racecoordinatorai_sketch.ino`) desactiva explícitamente FastLED (`WITH_FAST_LED`) al compilarse para la MCU del Uno Q.

### Alternativas de iluminación disponibles

Si desea indicadores de iluminación visual en una instalación con Arduino Uno Q, dispone de dos opciones:

1. **LED de salida digital estándar**: Los LED monocolor (por ejemplo, LED estándar rojos, amarillos o verdes conectados a pines de salida digital mediante resistencias limitadoras de corriente, transistores o relés) se pueden seguir configurando en la MCU del Uno Q en Race Coordinator AI como indicadores estándar de llamada o estado de pista.
2. **Arduino secundario dedicado para LED RGB FastLED (Recomendado para tiras RGB)**: Si realmente desea tiras de luces LED RGB direccionables para semáforos de salida con cuenta regresiva multietapa, gráficos de barras de repostaje en boxes y animaciones de victoria con bandera a cuadros, puede conectar un **segundo Arduino** dedicado exclusivamente a controlar los LED RGB.

> [!TIP] Uso de un segundo Arduino para tiras LED RGB FastLED
> La **arquitectura multi-interfaz** de Race Coordinator AI admite por completo la conexión y el funcionamiento simultáneo de múltiples controladores de hardware en la misma pista:
> 
> - **Interfaz principal (MCU integrada del Uno Q)**: Gestiona las señales de carrera críticas en tiempo—sensores ópticos de conteo de vueltas, tiempos de sector, botones de llamada de pilotos y relés principales de alimentación de pista—con precisión submilisegundo.
> - **Interfaz secundaria (Segundo Arduino vía USB)**: Conecte una placa Arduino estándar económica (como un **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** o **ESP32**) a uno de los puertos host USB del Uno Q. Grabe el sketch estándar `racecoordinatorai_sketch.ino` (donde FastLED está activado) en esta segunda placa.
> - **Configuración en el Editor de pistas**: En la interfaz web de Race Coordinator AI, vaya a **Editor de pistas** $\rightarrow$ **Interfaces de hardware** y haga clic en **Añadir interfaz** para agregar el puerto serie del segundo Arduino (por ejemplo, `/dev/ttyUSB0` o `/dev/ttyACM0`). Configure sus tiras de luces FastLED en la segunda interfaz. Race Coordinator AI orquesta automáticamente ambas placas de forma simultánea durante las carreras.

---

## Solución de problemas de texto a voz (TTS) y audio

Race Coordinator AI utiliza la Web Speech API del navegador (`window.speechSynthesis`) para anunciar tiempos de vuelta, eventos de carrera y comentarios de los pilotos. A diferencia de Windows o macOS, Linux (Debian 12 en el Uno Q) no cuenta con un sintetizador de voz integrado, por lo que Chromium depende de **Speech Dispatcher** y **eSpeak NG**.

### Paquetes requeridos
El instalador automatizado (`install.sh`) instala estos paquetes automáticamente. Si realizó una instalación manual o el TTS no emite sonido, asegúrese de que los paquetes de voz y audio necesarios estén instalados:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Indicadores del navegador en modo quiosco y navegación con varias pestañas
En el modo quiosco, Chromium se inicia mediante `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Race Coordinator AI utiliza `--start-maximized` (en lugar del restrictivo `--kiosk`) para garantizar que las pestañas secundarias —como Resultados de manga, Resultados de carrera, vistas de temas y el Centro de ayuda sin conexión— permanezcan visibles y accesibles desde la barra de pestañas en la parte superior del televisor. Chromium también requiere opciones específicas para habilitar Speech Dispatcher y la reproducción automática de audio. Asegúrese de que su script `start_kiosk.sh` incluya:
```bash
  --start-maximized \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Si modifica `start_kiosk.sh` manualmente, reinicie el servicio del quiosco: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Pasos de resolución de problemas
1. **Verificar el modo de funcionamiento y la salida de audio**:
   - **Modo de pantalla quiosco**: El audio se reproduce directamente desde el Uno Q a través de la conexión DisplayPort/HDMI de USB-C al televisor/monitor o altavoces USB conectados.
   - **Cliente de red remoto**: Si accede a Race Coordinator AI desde una laptop, tablet o teléfono a través de la red local (`http://<hostname>:7070`), el audio y el TTS se reproducen a través del **navegador y los altavoces de ese dispositivo**, no de la placa Uno Q.
2. **Comprobar la salida de audio del hardware**:
   Ejecute una prueba de sonido en el terminal del Uno Q para confirmar que la salida no esté silenciada y funcione:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Si no hay sonido, ejecute `alsamixer` en el terminal para verificar que los controles de volumen Master/PCM/HDMI no estén silenciados (`[MM]`, pulse `M` para alternar) y tengan un nivel adecuado.
3. **Probar los sintetizadores de voz desde la línea de comandos**:
   Compruebe que eSpeak NG y Speech Dispatcher funcionen a nivel del sistema operativo:
   ```bash
   # Probar síntesis pura
   espeak-ng "Testing speech synthesis"

   # Probar Speech Dispatcher (el backend de Chromium)
   spd-say "Testing speech dispatcher"
   ```
   Si `spd-say` genera un error o se bloquea, reinicie el demonio: `pkill -f speech-dispatcher && spd-say "Hello"`.
4. **Probar en la interfaz web**:
   En la interfaz web de Race Coordinator AI, abra **Personalizar interfaz** (o **Editor de temas** $\rightarrow$ **Configuración de audio**). Verifique el menú desplegable **Voz de TTS**; deben aparecer las voces disponibles. Haga clic en **Probar voz de TTS** para confirmar la reproducción.

---

## Actualizaciones automáticas de software

Cuando está conectado a Wi-Fi, Race Coordinator AI comprueba las versiones de GitHub automáticamente:
1. **Actualización de la aplicación**: Descarga el nuevo paquete Linux ARM64 en segundo plano.
2. **Reinicio del servicio**: Reinicia `racecoordinatorai.service` mediante systemd sin problemas.
3. **Sincronización del sketch de MCU**: Vuelve a flashear automáticamente el firmware del microcontrolador STM32 utilizando `arduino-cli` si se actualizó `racecoordinatorai_sketch.ino`.

> [!TIP]
> Si descargó un archivo de versión `.tar.gz` a través del enlace **Descargar actualización** en el navegador, consulte [Actualizar manualmente una instalación existente](#actualizar-manualmente-una-instalacion-existente-desde-el-archivo-descargado) más arriba para aplicar la actualización.

