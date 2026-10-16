# Solución de Problemas

## Problemas de Conexión

### Suspensión de la Interfaz USB y Desconexiones Entre Mangas (Ahorro de Energía y Suspensión Selectiva) {: #usb-sleep-prevention }
- **Síntoma**: Durante las pausas entre mangas, en cambios de carril o tras varios minutos de inactividad, se interrumpe la conexión con la interfaz (Phidget, Arduino, Trackmate o adaptador USB-Serie). Cuando se reanuda la carrera o los coches activan los sensores, la interfaz se reconecta y se muestra el mensaje: *"Interfaz Conectada: Se ha restablecido la conexión con la interfaz."*
- **Causa**: Los sistemas operativos modernos (Windows, macOS y Linux) aplican directivas agresivas de ahorro de energía en controladores USB y Dispositivos de Interfaz Humana (HID). Aunque Race Coordinator AI impide la suspensión general del sistema, el sistema operativo apaga de forma independiente los puertos USB, concentradores raíz USB y controladores HID inactivos (Suspensión selectiva de USB) cuando no hay tráfico de sensores durante breves intervalos.
- **Por qué no se puede deshabilitar automáticamente por software**: La administración de energía a nivel de hardware la gestiona directamente el núcleo del sistema operativo. En Windows, modificar las propiedades de energía del hardware requiere privilegios de Administrador (UAC) y alterar claves protegidas del registro (`HKLM`), algo que una aplicación estándar no puede ni debe hacer de forma arbitraria para evitar inestabilidad en otros periféricos (teclados, ratones o adaptadores Bluetooth).
- **Solución por Sistema Operativo**:

#### Windows 10 y Windows 11 (Solución Permanente Recomendada)

##### 1. Deshabilitar el Ahorro de Energía en Dispositivos USB y HID en el Administrador de Dispositivos
1. Haga clic derecho en el botón de **Inicio** (o presione `Win + X`) y seleccione **Administrador de dispositivos**.
2. Expanda **Dispositivos de interfaz de usuario (Human Interface Devices)**:
    - Busque las entradas **Dispositivo de entrada USB** correspondientes a su interfaz.
    - Haga clic derecho en cada una, elija **Propiedades** y vaya a la pestaña **Administración de energía**.
    - **Desmarque** *"Permitir que el equipo apague este dispositivo para ahorrar energía"* y pulse **Aceptar**.
3. Expanda **Controladoras de bus serie universal (Universal Serial Bus controllers)**:
    - Haga clic derecho en cada **Concentrador raíz USB** y **Generic USB Hub**, elija **Propiedades** y vaya a **Administración de energía**.
    - **Desmarque** *"Permitir que el equipo apague este dispositivo para ahorrar energía"* y pulse **Aceptar**.
4. (Para Arduino / Serie): Expanda **Puertos (COM y LPT)**:
    - Haga clic derecho en su puerto COM (p. ej., *Arduino Uno*, *Puerto serie USB*), elija **Propiedades** y, si la pestaña **Administración de energía** está disponible, **desmarque** *"Permitir que el equipo apague este dispositivo para ahorrar energía"*.

##### 2. Deshabilitar la Suspensión Selectiva de USB en Opciones de Energía
1. Abra el **Panel de control** de Windows y diríjase a **Opciones de energía** (o presione `Win + R`, escriba `powercfg.cpl` y presione Enter).
2. Haga clic en **Cambiar la configuración del plan** junto a su plan de energía activo.
3. Haga clic en **Cambiar la configuración avanzada de energía**.
4. Expanda **Configuración de USB** -> **Configuración de suspensión selectiva de USB**.
5. Cambie los ajustes de **Con batería** y **Con corriente alterna** a **Deshabilitado**.
6. Haga clic en **Aplicar** y luego en **Aceptar**.

---

#### Linux y Raspberry Pi OS

##### 1. Deshabilitar la Suspensión Automática de USB en el Kernel
Por defecto, el kernel de Linux suspende dispositivos USB inactivos tras 2 segundos:
- **En Ubuntu, Debian o Linux Mint (GRUB)**:
    1. Edite la configuración de GRUB: `sudo nano /etc/default/grub`.
    2. Añada `usbcore.autosuspend=-1` a `GRUB_CMDLINE_LINUX_DEFAULT`.
    3. Actualice y reinicie: `sudo update-grub && sudo reboot`.
- **En Raspberry Pi OS**:
    1. Abra el archivo de parámetros de arranque: `sudo nano /boot/firmware/cmdline.txt` (o `/boot/cmdline.txt`).
    2. Agregue `usbcore.autosuspend=-1` al final de la línea (todos los argumentos deben permanecer en una sola línea).
    3. Guarde y reinicie: `sudo reboot`.

##### 2. Deshabilitar la Suspensión Mediante Regla Udev (Alternativa)
1. Cree un archivo de reglas: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Inserte la siguiente regla:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Recargue las reglas: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Ajustes de Economizador / Pantalla**: Vaya a **Ajustes del Sistema** -> **Pantallas** -> **Avanzado...** (o **Economizador**) y active **"Impedir que el equipo entre en reposo automáticamente cuando se apague la pantalla"**.
- **Usar Concentradores USB con Alimentación Propia**: macOS puede desenergizar puertos USB pasivos cuando detecta variaciones de consumo. Conecte siempre la interfaz a un concentrador USB con adaptador de corriente dedicado.

## Problemas de Visualización


### Compatibilidad del Navegador y Pantalla en Blanco en Dispositivos Antiguos (Android < 9, Windows Heredado y Tablets) {: #browser-compatibility }
- **Síntoma**: Al abrir Race Coordinator AI en una tableta antigua (como Android 4.4 KitKat hasta Android 8 Oreo), PC antiguo o navegador desactualizado, la pantalla permanece completamente en blanco o muestra el aviso "Navegador no compatible".
- **Causa**: Race Coordinator AI está desarrollado con Angular moderno y ECMAScript (ES2020+), utilizando CSS Grid, Variables CSS (`var(--...)`), módulos ES y APIs de JavaScript modernas (incluyendo `BigInt`, `globalThis`, `queueMicrotask`, optional chaining `?.`, nullish coalescing `??` y campos privados de clase `#x`).
- **Soporte de Sistemas Operativos y Navegadores**:

| Plataforma | Versiones Compatibles y Navegadores Mínimos | Estado | Notas |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Google Chrome, Microsoft Edge, Mozilla Firefox actuales | **Totalmente Compatible** | Compatible de forma predeterminada con actualizaciones automáticas. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 o Mozilla Firefox 115 ESR | **Compatible** | Requiere las últimas versiones lanzadas (Chrome 109 / Firefox 115 ESR). Internet Explorer no es compatible. |
| **Windows XP / Vista** | Navegadores oficiales estándar (Chrome 49, Firefox 52 ESR) | **Solo Servidor** | Los navegadores estándar carecen de ES2020+ y no pueden ejecutar la interfaz web. Sin embargo, el servidor Java (JRE 8) puede ejecutarse en modo headless en XP/Vista como anfitrión para tabletas o PCs modernos. |
| **Android** | Android 9.0+ con Google Chrome actual o System WebView | **Compatible** | Google suspendió permanentemente las actualizaciones en Android 8 y versiones anteriores. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Compatible** | Motor WebKit de Apple con compatibilidad total con ECMAScript moderno. |
| **macOS** | macOS 10.15 (Catalina) hasta macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Compatible** | Totalmente compatible en Mac con procesadores Intel y Apple Silicon. |
| **Linux** | Cualquier distribución moderna con Chrome, Chromium o Firefox | **Compatible** | Incluye Raspberry Pi OS de 64 bits y placas ARM64. |

- **Solución y Recomendaciones**:
  - **Usar un Navegador Moderno Compatible**: Conéctese utilizando Google Chrome, Microsoft Edge, Mozilla Firefox o Apple Safari en un sistema operativo compatible (Android 9.0+, iOS 14+, Windows 7+, macOS o Linux).
  - **Configuración en Windows Heredado (Win 7 / 8 / 8.1)**: En Windows 7 u 8, asegúrese de instalar **Google Chrome 109** o **Mozilla Firefox 115 ESR** en lugar del descontinuado Internet Explorer.
  - **Tabletas Modernas Económicas**: Las tabletas económicas modernas (p. ej., Amazon Fire HD 8/10 o tabletas Android asequibles con Android 11–14) son compatibles con Chrome actual y brindan un rendimiento óptimo.
  - **Duplicación de Pantalla / Escritorio Remoto**: En tabletas antiguas, puede visualizar la pantalla del navegador del equipo anfitrión a través de un cliente ligero de VNC o escritorio remoto (como bVNC o AnyDesk).
