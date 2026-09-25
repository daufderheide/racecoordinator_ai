# Editor de Pistas

El **Editor de Pistas** es la interfaz central de configuración para modelar su circuito físico de slot cars, personalizar las dimensiones y colores de los carriles y establecer la comunicación con su hardware de cronometraje, relés de alimentación, sensores y sistemas de iluminación visual.

Race Coordinator AI incorpora una avanzada arquitectura multi-interfaz que permite ejecutar simultáneamente múltiples controladores de cronometraje y control (como Arduino, Trackmate, Phidget o BART) en una sola pista.

---

## Descripción General y Guardado Automático

El Editor de Pistas proporciona una interfaz unificada para seleccionar, visualizar, configurar y probar sus pistas de slot car:

- **Selector de Pistas**: Ubicado en el encabezado superior junto al título de la página, este menú desplegable lista todas las pistas configuradas y le permite alternar rápidamente entre ellas.
- **Modo Solo Lectura**: De forma predeterminada, al abrir el editor se muestran las propiedades de la pista, la disposición de carriles y las interfaces de hardware en modo solo lectura. Los campos de formulario, la gestión de carriles y las acciones de interfaz están bloqueados para evitar modificaciones accidentales.
- **Modo Edición**: Al hacer clic en el icono de **Editar** (lápiz) de la barra de herramientas, se desbloquean los controles de configuración, la reordenación de carriles y las interfaces de hardware. En el modo de edición, el desplegable de pistas permanece bloqueado para evitar salir accidentalmente de los cambios sin guardar.
- **Guardado Automático Continuo**: A medida que realiza modificaciones (renombrar, cambiar dimensiones de carriles, reordenar carriles o ajustar pines), sus cambios se guardan automáticamente en segundo plano en el servidor sin salir del modo de edición.
- **Finalizar Edición**: Al hacer clic en el icono **Finalizar Edición** (marca de verificación), se validan los cambios, se asegura su persistencia en el servidor y se regresa al modo solo lectura.
- **Descartar Cambios**: Si intenta salir del editor con cambios no guardados o no válidos, un cuadro de diálogo solicitará confirmación. Al descartar, se revierten todas las modificaciones a la última versión guardada y se restaura el modo solo lectura.

El área de trabajo se divide en dos paneles sincronizados:

- **Panel Izquierdo (Propiedades Generales de la Pista y Carriles)**: Configure el nombre de la pista, cantidad de secciones, escala física y propiedades de cada carril (dimensiones, orden y colores). Añada nuevas interfaces de hardware en la parte inferior de este panel.
- **Panel Derecho (Interfaces de Hardware y Pruebas Interactivas)**: Configure los controladores conectados, asigne pines y canales a las funciones de la pista, configure tiras LED RGB direccionables y pruebe sensores y relés en tiempo real.

Todas las modificaciones realizadas en el Editor de Pistas se **validan y guardan automáticamente en tiempo real**. Si se detecta una configuración no válida (como un nombre en blanco o duplicado, o un pin requerido sin asignar), el guardado se detiene temporalmente y avisos visuales destacan los campos que requieren corrección.

---

## Configuración General de la Pista

La sección superior define las propiedades fundamentales de su circuito:

### Nombre de la Pista (Track Name)
Identificador único para su circuito en la base de datos de Race Coordinator AI. Cada pista debe tener un nombre distintivo.

### Número de Secciones de Pista (Number of Track Sections)
Define el número de segmentos en los que se divide su pista. Cumple dos funciones clave:

1. **Puntuación de Vuelta Parcial al Final de la Manga**:
   - El valor predeterminado **100** representa una división porcentual, permitiendo a los directores de carrera otorgar vueltas parciales con dos decimales de precisión (ej. $14{,}65$ vueltas) según la posición donde se detiene el coche al sonar la campana de fin de manga.
   - Si utiliza postes o marcas físicas a lo largo del circuito, ajuste este número a la cantidad de marcas (ej. 20 marcas en una pista de 18 metros). Al terminar la manga, los comisarios registran el número de marca más cercano superado por cada coche.
2. **Cronometraje de Sectores / Tiempos Parciales**:
   - Cuando se configuran sensores de sector, este valor define la división lógica de los tramos de la pista.

### Escala de la Pista (Track Scale)
Seleccione la escala física de su trazado en el menú desplegable:

- **1:1 (Escala Real)**
- **Escala 1:24** (Slot cars comerciales grandes / carrocerías rígidas)
- **Escala 1:32** (Estándar de clubes y circuitos domésticos, Carrera, Scalextric, Policar)
- **Escala 1:43** (Circuitos compactos analógicos y digitales)
- **Escala 1:64 (HO)** (Slot cars escala HO, AFX, Auto World, Tyco)

!!! info "Telemetría de Velocidad a Escala"
    Race Coordinator AI utiliza la **Escala de la Pista** en combinación con la **Longitud de cada Carril** para calcular velocidades a escala auténticas (en km/h o mph) visualizadas en tablas de clasificación, pantallas de puesto de piloto y exportaciones XLS.

---

## Configuración de Carriles (Lane Configuration)

La sección **Editor de Carriles (Lane Editor)** permite personalizar la geometría, el orden de salida en parrilla y el aspecto visual de cada carril.

```
+---------------+-------------------+--------------------+-------------------+
|  Reordenar/X  |  Carril # y Long. |  Color de Fondo    |  Color de Texto   |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Rojo ]      |     [ Blanco ]    |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ Blanco ]     |     [ Negro ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |      [ Azul ]      |     [ Blanco ]    |
|  [::]   [X]   |  #4  [ 53.75 ] ft |    [ Amarillo ]    |     [ Negro ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Añadir y Eliminar Carriles
- **Añadir Carril (`+`)**: Haga clic en el botón **`+`** del encabezado del Editor de Carriles para agregar uno nuevo. Race Coordinator AI asigna automáticamente colores de contraste predeterminados.
- **Eliminar Carril (`X`)**: Haga clic en la **`X`** roja junto a cualquier carril para eliminarlo. Todas las interfaces de hardware reajustan automáticamente sus asignaciones.

### Reordenación mediante Arrastrar y Soltar
Tome el icono de agarre (**`::`**) a la izquierda de un carril para arrastrarlo hacia arriba o hacia abajo en el orden de parrilla. Reordenar los carriles actualiza de inmediato las rotaciones de mangas, los puestos de piloto y los marcadores.

### Longitud del Carril (Pies / Metros)
Introduzca la longitud física por la línea central de cada carril en **pies (ft)**.

En circuitos sin puentes de compensación, los carriles interiores son más cortos que los exteriores. Asignar longitudes exactas asegura que:
- Los cálculos de velocidad a escala sean rigurosos para cada carril.
- Los datos de distancia y consumo de combustible reflejen la distancia física real recorrida.

!!! tip "Referencia de Conversión de Metros a Pies"
    Si midió su pista en metros, convierta a pies usando:
    
    $$\text{Longitud (pies)} = \text{Longitud (metros)} \times 3{,}28084$$
    
    $$(1\text{ pie} = 0{,}3048\text{ metros})$$

### Colores del Carril (Fondo y Texto)
Cada carril cuenta con dos selectores de color:

- **Color de Fondo**: Color principal identificativo del carril (ej. Rojo, Blanco, Azul, Amarillo, Naranja, Verde, Púrpura, Negro).
- **Color de Texto**: Color de contraste para números y texto sobre el carril.

!!! note "Sincronización con Tiras LED"
    Cambiar el color de fondo de un carril se sincroniza automáticamente con las tiras LED RGB FastLED configuradas en Arduino, adaptando los indicadores de estado y repostaje a los colores físicos de su pista.

---

## Arquitectura de Interfaces de Hardware

Race Coordinator AI permite conectar varios sistemas de control y cronometraje en paralelo.

### Compatibilidad Multi-Interfaz
Puede combinar distintos controladores en el mismo circuito:
- Utilizar una placa **Trackmate** para detección óptica de vueltas y corte general de corriente.
- Conectar simultáneamente un **Arduino** con el sketch de Race Coordinator AI para semáforos de salida FastLED RGB, gráficos de nivel de repostaje y luces de bandera amarilla.
- Añadir un módulo digital **Phidget** para pulsadores de pausa de pilotos o sensores de sector.

### Pestañas de Interfaz y Navegación Rápida
En la parte superior del panel derecho encontrará pestañas para cada interfaz configurada. Al pulsar una pestaña, la vista se desplaza directamente a esa sección.

### Indicadores de Estado de Conexión en Vivo
Cada interfaz muestra un distintivo en tiempo real:

| Indicador | Significado | Acción |
| :--- | :--- | :--- |
| **Conectado** (Verde) | Comunicación activa bidireccional establecida. | Listo para carreras y pruebas interactivas. |
| **Sin Datos** (Ámbar) | Dispositivo detectado pero sin flujo de datos ni latido. | Verificar velocidad en baudios, cable USB o sketch. |
| **Desconectado** (Gris / Rojo) | Hardware no encontrado, puerto cerrado o sin alimentación. | Revisar puerto COM, cable USB y alimentación eléctrica. |

---

## Interfaces de Hardware Compatibles

### 1. Interfaz Arduino

La interfaz **Arduino** es la más versátil en Race Coordinator AI. Con un Arduino Uno, Mega o compatible, puede controlar vueltas, relés, pulsadores de pausa, sectores, telemetría de acelerador y tiras LED RGB direccionables con FastLED.

#### Tipos de Placa
- **Arduino Uno**: Ideal para pistas de 2 a 4 carriles (14 pines digitales 2–13 y 6 entradas analógicas A0–A5).
- **Arduino Mega 2560**: Recomendado para pistas de 6 a 8 carriles, cronometraje por sectores o configuraciones extensas de luces LED (54 pines digitales 2–53 y 16 entradas analógicas A0–A15).

#### Conexión y Compatibilidad de Firmware
- **Puerto COM Serie**: Seleccione el puerto serie asignado en su sistema operativo.
- **Velocidad**: `115200` baudios recomendados.
- **Compatibilidad con Sketches**:
    - **Sketch Race Coordinator AI (`v2.1.0.x`)**: Compatible con iluminación FastLED RGB, divisores de tensión y telemetría avanzada.
    - **Sketch Original Race Coordinator 1.0 (`v1.0.0.x`)**: Totalmente compatible para vueltas, relés y pulsadores. Las opciones de LED RGB quedan desactivadas con un aviso informativo.

#### Filtro Antirrebote / Debounce ($\mu\text{s}$)
Configura el tiempo de filtrado en **microsegundos** ($1\text{ ms} = 1000\,\mu\text{s}$). Ignora fluctuaciones eléctricas transitorias.
- Sensores ópticos o infrarrojos: **100 a 500 $\mu\text{s}$**.
- Pistas de contacto metálico (dead strips) o lengüetas magnéticas: **1000 a 5000 $\mu\text{s}$**.

#### Lógica Invertida (Normalmente Cerrado / NC)
- **Sensores de Carril Normalmente Cerrados**: Habilítelo si el sensor entrega nivel alto en reposo y cae a bajo cuando pasa el coche (típico en fototransistores e infrarrojos). Desactívelo en dead strips o reed switches.
- **Relés Normalmente Cerrados**: Habilítelo si el relé se activa para cortar la corriente y se desactiva para dar paso de corriente. Asegura que la pista tenga corriente si el ordenador está apagado.

#### Comportamiento de Repostaje en Pin de Vuelta
Permite que el sensor de meta actúe en carreras con consumo de combustible:
- **Ninguno (None)**: Solo cuenta vueltas.
- **Entrada a Boxes (Pit In)**: Activa el repostaje.
- **Salida de Boxes (Pit Out)**: Finaliza el repostaje.
- **Entrada / Salida (Pit In/Out)**: El paso inicia el repostaje; al reanudar la marcha, el siguiente paso cuenta como vuelta normal.

#### Asignación de Pines Digitales y Analógicos
- **Conteo de Vueltas**: Sensor de vuelta por carril.
- **Control de Corriente**: Relé general (Master Relay) y relés independientes por carril (Lane Relays).
- **Control de Carrera**: Pulsador de bandera amarilla general o por puesto de piloto.
- **Sectores y Boxes**: Sensores de tiempo parcial y de entrada/salida de boxes.
- **Iluminación RGB**: Línea de datos para tiras LED.

!!! tip "Pruebas Interactivas de Hardware"
    Junto a cada selector de pin hay una **Insignia de Estado en Vivo**:
    - **Entradas (Sensores/Pulsadores)**: Al activarse un sensor, la insignia se ilumina en verde brillante durante 500 ms.
    - **Salidas (Relés)**: Al hacer clic en la insignia, conmuta el relé físico para verificar la instalación eléctrica.

#### Divisores de Tensión y Telemetría de Gatillo
Permite monitorizar el voltaje del mando ($0\text{--}5\text{V}$) para carreras con combustible digital:
- **Indicador en Vivo**: Muestra la lectura actual ($0\text{--}1023$).
- **Voltaje Máximo**: Calibra el valor correspondiente al 100% de acelerador.
- **"Fijar Máximo al Indicador"**: Asigna el valor pico detectado.
- **Enlazar Carriles**: Aplica la calibración a todos los carriles simultáneamente.

#### Iluminación LED RGB Direccionable (FastLED)
1. **Configuración de Tira**: Asigne el pin de datos, número de LEDs, brillo global ($0\text{--}255$), frecuencia de parpadeo y orden de color (`GRB`, `RGB`, etc.).
2. **Asignación de Funciones por LED**:
   - **Semáforo de Salida**: Cuenta atrás progresiva, Verde de salida y Rojo de salida en falso.
   - **Estado de Bandera**: Verde (carrera), Amarillo parpadeante (precaución), Rojo/Ajedrezada (final).
   - **Alimentación de Carril**: Se ilumina en el color del carril si tiene corriente.
   - **Barra de Repostaje**: Barra que se llena progresivamente mientras el coche reposta en boxes.
   - **Líder de Manga**: Indica el color del coche que lidera la manga actual.
   - **Destello de Vuelta**: Parpadea en el color del carril al cruzar la meta.

---

### 2. Interfaz Trackmate

Soporte nativo para placas comerciales Trackmate conectadas mediante puerto serie COM (USB o RS-232).

- **Filtro Antirrebote (Niveles 1–4)**: Nivel 2 o 3 recomendado para slot 1:32 y 1:24.
- **Lógica Normalmente Cerrada**: Inversión para fotocélulas infrarrojas y relés.
- **Relés Individuales por Carril**: Habilitar si dispone de tarjeta con corte independiente por carril.
- **8 Canales de Sensores**: Asignación de los 8 canales físicos a carriles o boxes.
- **Prueba de Relés**: Conmutación manual de relés con botones interactivos en la pantalla.
- **Pulsador de Pausa**: Canal dedicado con indicador visual en vivo.

---

### 3. Interfaz Phidget

Integración de módulos industriales USB y VINT de Phidgets (ej. InterfaceKit 0/16/16, 8/8/8, 1014 Relays y concentradores VINT).

- **Detección Automática**: Reconocimiento automático por Número de Serie y Puerto de Hub.
- **Entradas Digitales**: Canales optoaislados de alta velocidad para vueltas, pulsadores y sectores.
- **Salidas Digitales / Relés**: Control de corte de corriente general e individual.
- **Entradas Analógicas**: Sensores de tensión para seguimiento de gatillo y combustible.
- **Inversión de Polaridad**: Ajuste independiente para sensores y relés.

!!! warning "Controladores Phidget22 Requeridos"
    Requiere las librerías oficiales de **Phidget22** instaladas en su sistema. Si faltan, Race Coordinator AI mostrará un aviso con instrucciones de descarga.

---

### 4. Interfaz BART (Policar Bluetooth Timer)

Conexión inalámbrica a puentes de cronometraje y transpondedores Policar BART Bluetooth Low Energy (BLE).

- **Detección Inalámbrica BLE**: Búsqueda automática de dispositivos Bluetooth LE cercanos sin cables ni puertos COM.
- **Canales de Hardware (hasta 32)**: Asignación dinámica a carriles y boxes.
- **Filtro de Vuelta Mínima (ms)**: Límite por hardware para evitar lecturas espurias.
- **Actividad en Vivo por Canal**: Confirmación visual de cada detección en pista.

---

### 5. Interfaz Demo / Simulación

Permite probar formatos de carrera, rotaciones, temas, anuncios de audio y marcadores sin hardware físico conectado.

- **Simulación Realista**: Genera tiempos de vuelta, paradas en boxes y telemetría calculada en función de los carriles y escala de la pista.
- **Sin Configuración Previa**: Funciona de forma instantánea en cualquier circuito.

---

## Operaciones del Editor y Barra de Herramientas

La barra de herramientas superior del Editor de Pistas proporciona herramientas esenciales de gestión:

- **Volver**: Regresa a la vista anterior o a la Configuración del Día de Carrera.
- **Añadir Pista (+)**: Crea una nueva plantilla de pista y activa el modo de edición.
- **Duplicar Pista**: Crea una copia exacta bajo otro nombre único, ideal para probar configuraciones distintas sin rehacer el trazado.
- **Editar / Finalizar Edición**: Alterna entre el modo solo lectura y el modo de edición. Al salir del modo de edición, los cambios se validan y se guardan.
- **Expandir / Contraer todo**: Expande o contrae todas las secciones de configuración y paneles de interfaces a la vez.
- **Eliminar Pista**: Elimina la pista seleccionada tras confirmar la acción.
- **Deshacer (`Ctrl+Z`) / Rehacer (`Ctrl+Y`)**: Reversión instantánea de cambios en dimensiones, colores o pines.
- **Ayuda (`?`)**: Inicia un recorrido visual guiado paso a paso por todos los controles de la pantalla.

---

## Solución de Problemas Frecuentes de Hardware

### Corriente Invertida en Pista
- **Síntoma**: La pista tiene corriente bajo bandera amarilla pero se corta con bandera verde.
- **Solución**: Conmute la casilla **Relés Normalmente Cerrados (Normally Closed Relays)**.

### Repostaje Continuo en Carreras con Combustible
- **Síntoma**: Los coches comienzan a repostar sin detenerse en cuanto tocan la pista.
- **Solución**: Conmute la casilla **Sensores de Carril Normalmente Cerrados (Normally Closed Lane Sensors)**.

### Vueltas Dobles o No Detectadas
- **Solución**: Aumente el antirrebote (Debounce) si se marcan vueltas dobles, o redúzcalo si coches muy veloces no son leídos. Verifique la alineación de las fotocélulas.

### Tiras LED FastLED No Encienden
- **Solución**: Verifique que el Arduino ejecute el **sketch oficial `v2.1.0.x`**, que el tipo de LED y orden de color sean correctos, y que la masa (GND) de la fuente de 5V esté unida a la masa del Arduino.
