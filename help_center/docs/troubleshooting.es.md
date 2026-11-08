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

### Reinicios y Caídas de Tensión del Microcontrolador {: #microcontroller-brownout-resets }

- **Symptom**: Durante una carrera o sesión de práctica, aparece un banner de advertencia en la pantalla de carrera: *"Reinicio de microcontrolador detectado: El microcontrolador de la interfaz se reinició inesperadamente durante la operación."* Al hacer clic en **Detalles** se abre un cuadro de diálogo que muestra el nombre de la interfaz, el recuento de reinicios y la marca de tiempo del último reinicio. Si ocurren múltiples reinicios en la misma sesión, una nota de advertencia indica que se están produciendo reinicios frecuentes.
- **Qué se informa**: La interfaz de cronometraje (como Arduino Uno, Nano, Mega o microcontrolador USB compatible) sufrió un reinicio de hardware inesperado o caída de tensión (brownout) mientras estaba conectada a Race Coordinator AI. Esto indica que el procesador del microcontrolador experimentó una caída momentánea de voltaje o un transitorio de ruido eléctrico que activó su línea de reinicio de hardware o su circuito de detección de bajo voltaje (BOD).

#### Qué sucede en Race Coordinator AI (RMS)
Cuando un microcontrolador se reinicia inesperadamente durante una carrera:
1. **Secuencia de arranque y saludo**: El microcontrolador se reinicia y envía un mensaje de saludo de identificación y pings de estado a Race Coordinator AI.
2. **Recuperación automática de estado**: Race Coordinator AI detecta que la placa ya estaba conectada y activa. En lugar de cancelar la carrera, el RMS reconfigura de inmediato el microcontrolador: reaplica la asignación de pines, polaridades (activo en alto/activo en bajo), tiempos de antirrebote y restaura el estado de los relés según el estado actual de la manga (por ejemplo, energía de pista ENCENDIDA).
3. **Ventana de escudo de protección (250 ms)**: Al iniciarse un Arduino, las entradas digitales pueden flotar momentáneamente o reportar estados de pull-up por defecto antes de estabilizarse. Race Coordinator AI activa un escudo de protección de 250 ms inmediatamente después de un reinicio inesperado. Durante esta ventana, se filtran las transmisiones estáticas de pines para evitar lecturas falsas de vueltas, tiempos fantasmas o llamadas de pista accidentales causadas por ruido eléctrico de arranque.
4. **Impacto en la carrera — Posibilidad de vueltas perdidas**:
    - Aunque Race Coordinator AI restablece automáticamente la conexión y la energía de pista sin abortar la manga, el microcontrolador queda **completamente ciego a las señales de los sensores** durante su reinicio físico, secuencia de arranque y negociación (generalmente de 200 a 500 milisegundos).
    - **Cualquier auto que cruce un sensor óptico, tramo muerto (dead strip) o interruptor reed durante esta ventana de reinicio NO será registrado, lo que provocará vueltas perdidas.**
    - Si los reinicios se repiten con frecuencia, el conteo de vueltas y las posiciones de la manga se verán afectados, y los pilotos pueden notar breves caídas de energía.

#### Causas Comunes
*Nota: Si bien las causas descritas a continuación representan los problemas más frecuentes observados en pistas de slot, cada instalación física es única y pueden intervenir otros factores eléctricos o mecánicos.*

1. **Retroceso Inductivo de Relés (Picos de Fuerza Contraelectromotriz - Back-EMF)**:
    - **La causa #1 de caídas de tensión de microcontroladores en pistas de slot.**
    - Los relés de control de energía de pista contienen bobinas electromagnéticas. Cuando un relé se desconecta (al detener la carrera o al finalizar la manga), el colapso del campo magnético de la bobina genera un pico masivo de voltaje inverso (cientos de voltios de contra-EMF).
    - Si la placa de relés no cuenta con diodos de libre circulación adecuados, o comparte masa/alimentación directamente con el Arduino, este pico de alto voltaje ingresa al microcontrolador, activando su protección BOD o bloqueando la CPU.
2. **Cableado de Botones de Parada y Cables Largos que Actúan como Antenas**:
    - Los botones de parada distribuidos alrededor de la pista a menudo emplean tiradas largas de cable sin blindaje (de 3 a más de 15 metros).
    - Estos cables largos actúan como antenas receptoras de interferencias electromagnéticas (EMI) provenientes de los motores de los autos, chispas en las trencillas y transiciones de carriles.
    - Pulsar o soltar interruptores mecánicos sin resistencias pull-up externas ni filtros de rebote RC puede introducir picos transitorios directamente en los pines de entrada.
3. **Caída de Voltaje en el Bus USB de 5V**:
    - Los microcontroladores requieren entre 4.5V y 5.2V estables para funcionar con fiabilidad.
    - Si el Arduino está conectado a un concentrador USB pasivo, a un puerto frontal del PC con cableado interno largo o a un bus USB con sobrecarga de periféricos, el voltaje puede descender momentáneamente por debajo del umbral BOD (típicamente 2.7V o 4.3V), forzando un reinicio instantáneo.
4. **Interferencia Electromagnética (EMI) de la Alimentación de Pista**:
    - Los motores de slot demandan alta corriente y producen chispas constantes entre las escobillas, las trencillas y los carriles de la pista.
    - Si los cables de sensores, botones o el propio microcontrolador corren en paralelo y muy cerca del cableado de pista o fuentes de alimentación DC, los acoplamientos inductivos inducen picos de tensión en la electrónica de cronometraje.
5. **Circuitos de Corriente Alterna Compartidos sin Filtrado**:
    - Conectar el PC de cronometraje, la fuente DC de la pista, tornos de neumáticos o herramientas en la misma regleta sin filtros de sobretensión puede transferir transitorios a través de la fuente del PC hacia el bus USB.
6. **Descarga Electrostática (ESD)**:
    - En ambientes secos, el paso continuo de autos sobre pistas plásticas genera electricidad estática. Cuando un piloto o comisario toca un botón o elemento metálico, la descarga electrostática puede reiniciar la placa.

#### Formas Potenciales de Resolver el Problema

- **Instalar Diodos de Libre Circulación en Todas las Bobinas de Relés**:
    - Suelde un diodo rectificador estándar (como **1N4001**, **1N4004** o **1N4007**) en polarización inversa directamente entre los terminales DC de cada bobina de relé (cátodo/extremo con banda conectado a +DC, ánodo conectado a masa/-DC). Esto disipa de forma segura la energía de contra-EMF cuando el relé se desconecta.
- **Utilizar Placas de Relés Optoacopladas con Alimentación Independiente**:
    - La mayoría de módulos de relé de 5V incorporan un puente de aislamiento identificado como **JD-VCC / VCC / GND**.
    - Retire el puente `JD-VCC`. Conecte los 5V y las señales del Arduino a los pines de control, pero alimente las bobinas de los relés de forma independiente conectando un adaptador de 5V DC externo entre `JD-VCC` y `GND` de la placa de relés. Esto aísla por completo el circuito ruidoso de los relés del bus de alimentación del Arduino.
- **Incorporar Resistencias Pull-Up Externas y Condensadores en los Botones**:
    - No dependa únicamente de las resistencias pull-up internas débiles del Arduino (~20kΩ–50kΩ) en tiradas largas. Instale **resistencias pull-up externas de 1kΩ a 4.7kΩ** entre cada pin de entrada y +5V en el bloque de terminales del Arduino.
    - Añada un pequeño **condensador cerámico de 0.1 µF (100nF)** entre cada pin de botón y masa para amortiguar ruidos de alta frecuencia y rebotes de contacto.
- **Emplear un Concentrador USB con Alimentación Propia**:
    - Conecte el microcontrolador a un concentrador USB con adaptador de corriente dedicado en lugar de conectarlo directamente a un puerto del PC o portátil. Esto garantiza un suministro firme de 5V independientemente de la carga de la computadora.
- **Separar Físicamente los Cables de Señal de la Energía de Pista**:
    - Mantenga los cables de sensores (infrarrojos, ópticos, reed) y de botones de parada separados al menos de 15 a 30 cm de los conductores de alimentación de la pista y de las fuentes de poder.
    - Si los cables de señal deben cruzar cables de potencia, crúcelos siempre en **ángulo recto de 90 grados** y nunca en paralelo.
- **Utilizar Cable de Par Trenzado Blindado**:
    - Para tiradas largas, use cable de red blindado (Cat5e/Cat6 STP) o cable de instrumentación apantallado. Conecte la malla de blindaje a masa únicamente en el extremo del Arduino.
- **Circuitos de Red Eléctrica Dedicados**:
    - Conecte la fuente de poder de la pista y el ordenador en tomas de corriente independientes o utilice un protector de sobretensión con filtro de línea.

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
