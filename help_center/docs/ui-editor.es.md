# Editor de Interfaz

## Descripción general

El Editor de Interfaz le permite diseñar diseños de pantalla personalizados para el día de la carrera, configurar columnas de clasificación de pilotos, personalizar efectos de sonido y gráficos de temas y cargar [Widgets personalizados](custom-widgets.md) modulares.

## Widgets personalizados y carpeta de widgets

Se pueden agregar widgets personalizados a sus diseños de interfaz personalizada:
- **Carpeta de widgets personalizados**: Establezca su carpeta local de widgets en la sección **Interfaz personalizada** en la parte inferior del editor.
- **Actualizar widgets de muestra**: Haga clic en **Actualizar widgets de muestra** para generar o actualizar widgets de muestra listos para usar en una carpeta `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Grupos de la biblioteca de widgets**: La biblioteca de widgets organiza los widgets en grupos (**Race Coordinator AI**, **Raíz personalizada** y carpetas personalizadas como **sample**) con subgrupos anidados (como **Acciones** y **Datos de la tanda** con subcarpetas categorizadas) y un filtro de búsqueda instantánea.
- **Configuración dinámica**: Cuando se selecciona un widget personalizado en el lienzo, sus propiedades personalizadas (colores, umbrales, selectores, campos de texto) aparecen dinámicamente en la Configuración de widgets.

Para obtener detalles completos sobre el desarrollo de widgets, consulte la [Guía de widgets personalizados](custom-widgets.md).

## Configuración de diseño y columnas

- Arrastre y suelte widgets desde la paleta hacia el lienzo.
- Cambie el tamaño, reposicione y alinee widgets para adaptarse a su resolución. Todos los widgets están delimitados para no salirse del lienzo.
- **Controles de la Configuración de Widgets**:
  - **Posición y tamaño**: Ajuste con precisión la posición y dimensiones del widget seleccionado mediante los campos numéricos **X**, **Y**, **Ancho** y **Altura**.
  - **Eliminar widget**: Haga clic en el icono de papelera en el encabezado de configuración.
- **Atajos de teclado**:
  - <kbd>Supr</kbd> o <kbd>Retroceso</kbd>: Elimina el widget seleccionado del diseño.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Desplaza el widget seleccionado 1px (o 10px manteniendo pulsada <kbd>Mayús</kbd>).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Deshacer la acción anterior.
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Mayús</kbd>+<kbd>Z</kbd>: Rehacer.
- Configure orden de columnas, visibilidad, anclajes y anchos preferidos.

## Configuración del Widget de Temporizador

El widget **Temporizador** muestra el tiempo transcurrido o restante de la manga/carrera con estilos de presentación configurables:

- **Formato de visualización**:
  - **Dinámico (1:23 / 45s)**: Pantalla compacta que omite ceros iniciales y descarta la unidad de minutos cuando queda menos de un minuto.
  - **Minutos y segundos (01:23 / 00:45)**: Dos dígitos constantes para minutos y segundos, evitando saltos de longitud de texto y cambios bruscos de tamaño de fuente en modo autoescala.
  - **Minutos y segundos (1:23 / 0:45)**: Mantiene los minutos por debajo de un minuto (`0:45`), utilizando un solo dígito para minutos cuando supera un minuto (`1:23`).
  - **Reloj completo (00:01:23 / 00:00:45)**: Reloj digital fijo de ocho caracteres (`HH:MM:SS`), ideal para carreras de resistencia.
  - **Segundos totales (83s / 45s)**: Muestra los segundos totales transcurridos o restantes sin subdivisión en minutos u horas.
- **Fracciones de segundo (Subsegundos)**:
  - **Por debajo del umbral**: Muestra fracciones de segundo (1 a 3 decimales) cuando el tiempo desciende por debajo del umbral configurado (por ejemplo, últimos 10 segundos).
  - **Siempre**: Muestra fracciones de segundo continuamente durante toda la manga.
  - **Nunca**: Limita el temporizador exclusivamente a segundos enteros.
- **Vista previa**: El panel de configuración incluye una vista previa en tiempo real que demuestra cómo se muestran las opciones seleccionadas en distintos puntos de la carrera (`> 1 hr`, `> 1 min`, `< 1 min` y `< 10s`).

> [!NOTE]
> Estas mismas opciones de formato de tiempo (preajustes de formato de visualización, modos de fracciones de segundo, umbral y control deslizante de decimales con vista previa en vivo) también son compatibles con los widgets de **Tiempo Total** (Tiempo Total de Manga y Tiempo Total de Carrera/General) y con las columnas de **Tiempo Total** en la Vista de Carril. En la lista de columnas de la Vista de Carril, haga clic en el icono de opciones de tiempo (<span class="material-icons">more_time</span>) junto a cualquier columna de Tiempo Total para personalizar su formato.

## Configuración del widget de cuenta atrás

El widget **Cuenta atrás** muestra el semáforo visual de salida y reproduce el audio correspondiente durante la secuencia de inicio:

- **Lámparas máximas**: Define el número máximo de luces a mostrar (por defecto 5, rango de 1 a 10). Cuando la duración de la cuenta atrás supera este número (por ejemplo, una salida de 6 segundos con un máximo de 5 lámparas), todas las luces permanecen apagadas/atenuadas durante la diferencia inicial (1 segundo) antes de iluminarse secuencialmente.
- **Animación de aparición gradual**: Determina si el semáforo y el desenfoque de fondo aparecen con una suave transición gradual. Al desactivarse, aparecen de forma instantánea.
- **Orientación**: Permite alternar entre disposición **Horizontal** y **Vertical**.
- **Efectos de brillo y desenfoque**: Personalice el resplandor de las luces, la escala de superposición roja/verde y la intensidad o área del desenfoque.

## Widgets de Columna de Carril y Duplicación

El widget de **Columna de Carril** permite colocar columnas individuales de datos de la vista de carril (como información del piloto, tiempo de última vuelta, mejor vuelta / récord personal, combustible %, historial de vueltas, velocidades de sector, posición, etc.) en cualquier parte del lienzo como tarjetas modulares independientes.

- **Piloto Objetivo y Tarjetas Individuales**:
  - Las tarjetas individuales colocadas fuera de una cuadrícula eligen qué piloto mostrar: por **Carril de Pista** (Carril 1 a Carril 8), por **Posición de Ronda** (1º, 2º, etc.), por puesto en la **Clasificación General** o por **Clasificación Previa**.

### Fuentes de Datos de Cuadrícula: Datos de Ronda vs. Datos Generales de Carrera

Cada cuadrícula de datos en el Editor de UI cuenta con el ajuste **Fuente de datos** en la pestaña Cuadrícula, que determina qué pilotos ocupan las filas:

- **Datos de Ronda (`heat`)**:
  - **Ámbito de Pilotos**: Se vincula exclusivamente a los pilotos que compiten activamente en la ronda actual sobre la pista (`heatDrivers`).
  - **Comportamiento**: Solo se muestran los pilotos en pista en la ronda activa. Se omiten los pilotos que están descansando o asignados a otras rondas.
  - **Paginación y Desplazamiento**: El número de filas se limita estrictamente a los pilotos de la ronda activa y a los carriles físicos. La cuadrícula nunca se desplazará más allá de los participantes activos hacia filas vacías.
- **Datos Generales de Carrera (`overall`)**:
  - **Ámbito de Pilotos**: Se vincula a **todos los participantes inscritos** en todo el torneo o evento (`participants`).
  - **Comportamiento**: Cualquier piloto inscrito puede mostrarse en la cuadrícula, tanto si está compitiendo en la ronda actual como si descansa en boxes.
  - **Paginación y Desplazamiento**: El recuento de filas refleja todo el plantel del torneo (ej. 16, 24 o 32 pilotos a lo largo de varias rondas). Si la cuadrícula tiene menos filas visibles que participantes totales, admite desplazamiento automático multipágina para recorrer toda la clasificación general.
  - **Pilotos Fuera de Pista**: Para los pilotos que no están corriendo en la ronda actual, se proporcionan automáticamente sus estadísticas acumuladas.

### Widgets: Widgets de Datos de Ronda vs. Widgets de Datos Generales

La Caja de herramientas clasifica las columnas y tarjetas de datos en los grupos **Datos de Ronda** y **Datos Generales**. La elección del widget determina qué estadísticas se calculan y se muestran en cada fila:

- **Widgets de Datos de Ronda** (ej. *Contador de Vueltas, Última Vuelta, Mejor Vuelta de Ronda, Tiempo de Sector, Tiempo de Reacción, Posición / Puesto de Ronda, Diferencias de Ronda, Combustible / Telemetría, Ritmo Fantasma*):
  - Extraen métricas de rendimiento estrictamente de la **ronda activa**.
  - **En una Cuadrícula de Datos de Ronda**: Cada fila muestra telemetría en tiempo real y tiempos de vuelta de los coches que están compitiendo en pista.
  - **En una Cuadrícula de Datos Generales**: Los pilotos en pista muestran su telemetría en vivo; los pilotos inactivos o descansando muestran guiones (`--`) o ceros en las métricas de ronda, ya que no generan datos en la ronda en curso.
- **Widgets de Datos Generales de Carrera** (ej. *Puesto General, Vueltas Totales, Vueltas Físicas Totales, Tiempo Total General, Mejor Vuelta de Carrera, Promedio General, Mediana General, Consistencia General, Diferencias Generales, Probabilidad de Victoria / Predicciones, Mangas Disputadas / Mangas Restantes*):
  - Extraen métricas de rendimiento acumuladas a lo largo de **todas las rondas completadas** en el evento.
  - **En una Cuadrícula de Datos Generales**: Cada fila de piloto (ya esté en pista o en boxes entre rondas) muestra sus estadísticas generales completas, vueltas acumuladas, récord de carrera y puesto global.
  - **En una Cuadrícula de Datos de Ronda**: Los pilotos activos muestran su puesto general y estadísticas acumuladas junto a sus vueltas de ronda en tiempo real (ej. observar la clasificación global mientras se compite en la ronda).

#### Widget de Mangas Disputadas y Restantes

El widget **Mangas Disputadas** (`heatsRaced`) muestra el progreso de participación de cada piloto en las mangas:

- **Mangas Disputadas (Modo por Defecto)**: Muestra la cantidad de mangas que el piloto ya ha completado o que está disputando actualmente en el evento.
- **Modo Mangas Restantes**: Cuando el ajuste **Modo de visualización de mangas** cambia de *Mangas disputadas* a *Mangas restantes*, la tarjeta muestra cuántas mangas programadas le quedan por correr al piloto. Si no se define una etiqueta personalizada de cabecera, el título cambia automáticamente de `MANGAS DISPUTADAS` a `MANGAS RESTANTES`.
- Esta configuración también está disponible para elementos secundarios (insets) en cualquier tarjeta de columna.

#### Widgets de Diferencias (Gaps e Intervalos)

Race Coordinator AI soporta **4 widgets de diferencias específicos** tanto para Datos de Ronda como para Datos Generales:

1. **Diferencia con el Líder (`gapLeader` / `overallGapLeader`)**: Proyección matemática continua del tiempo de desventaja respecto al líder (P1).
2. **Diferencia con la Posición Precedente (`gapPosition` / `overallGapPosition`)**: Proyección matemática continua del tiempo de desventaja respecto al coche inmediatamente anterior.
3. **Diferencia Fórmula 1 con el Líder (`gapLeaderF1` / `overallGapLeaderF1`)**: Diferencia exacta en la línea de meta en la misma vuelta o vueltas perdidas (`+1 Vuelta`, `+N Vueltas`) en caso de estar doblado.
4. **Diferencia Fórmula 1 con la Posición Precedente (`gapPositionF1` / `overallGapPositionF1`)**: Diferencia exacta en la línea de meta respecto al coche anterior en la misma vuelta o vueltas perdidas (`+1 Vuelta`, `+N Vueltas`).

Para conocer las fórmulas matemáticas completas y especificaciones de cronometraje, consulte la [Guía de Cálculos de Diferencias](gap-calculations.md).

### Ordenación de Cuadrícula y Matriz de Interacción

El menú desplegable **Ordenación de Cuadrícula** en la pestaña Cuadrícula controla el orden de las filas. Su comportamiento depende directamente de si la **Fuente de datos** está establecida en **Datos de Ronda** o **Datos Generales**:

| Opción de Ordenación | En Cuadrícula de Ronda (`gridType: heat`) | En Cuadrícula General (`gridType: overall`) |
| :--- | :--- | :--- |
| **Carril de Pista** | Orden estático por carril físico (Carril 1, Carril 2, ...). Cada fila está ligada a un carril específico y su piloto asignado. | Los pilotos activos en pista aparecen primero por número de carril (Carril 1, Carril 2, ...), seguidos de todos los participantes inactivos ordenados por su puesto en la clasificación general. |
| **Posición de Ronda** | Reordenación dinámica en tiempo real por puesto en la ronda activa (1º, 2º, 3º en la ronda). Las filas se intercambian en vivo a medida que los coches cruzan la meta o se adelantan. | Los pilotos activos aparecen en las primeras posiciones ordenados por su puesto en la ronda (1º, 2º, ...), seguidos de los participantes inactivos ordenados por clasificación general. |
| **Clasificación General** | Ordena **únicamente a los pilotos de la ronda activa** según su puesto en la clasificación general. (Por ejemplo, si en la ronda compiten los puestos generales 2º, 5º, 8º y 14º, las 4 filas los ordenan #2, #5, #8, #14). Nunca muestra pilotos ajenos a la ronda ni genera filas vacías. | Ordena al **plantel completo de participantes** según la clasificación general del evento (1º general, 2º general, 3º general, ...). Todo el panel se reordena en vivo conforme se actualizan los puntos y vueltas. |
| **Clasificación Previa** | Ordena a los pilotos de la ronda activa según su posición inicial de cabezas de serie/clasificación (menor número primero). | Ordena a todos los participantes del evento por su posición inicial de clasificación previa (1, 2, 3, ...) en todo el plantel. |
- **Orientación**: Admite diseños **Vertical** (encabezado encima del valor) y **Horizontal** (encabezado y valor lado a lado).
- **Diseño y Personalización de la Barra de Título**:
  - La barra de título tiene el mismo estilo que el encabezado de columna de la vista de carril de forma predeterminada (fondo oscuro semitransparente `rgba(68, 68, 68, 0.7)`, texto blanco en negrita, esquinas superiores redondeadas y borde divisor).
  - **Mostrar Encabezado**: Activa o desactiva la barra de título. Al desactivarla, se elimina por completo de la tarjeta, maximizando el espacio para los valores principales e inserciones.
  - **Etiqueta Personalizada**: Reemplaza el nombre del dato predeterminado con un título personalizado.
  - **Tipografía y Alineación**: Personalice la familia tipográfica, el tamaño de fuente y la alineación del texto (Izquierda, Centro, Derecha).
  - **Color de Texto y Fondo**: Ajuste libremente el color de fondo y de texto del encabezado mediante selectores de color, con opción de restablecimiento al valor predeterminado en un solo clic.
- **Herencia de Color y Personalización**: Las tarjetas heredan de manera predeterminada los colores de fondo y texto del carril asignado (`Usar Colores de Carril`), o pueden personalizarse con colores de fondo, texto y bordes propios.
- **Duplicar en Carriles / Posiciones**:
  - En lugar de crear y alinear tarjetas manualmente para cada carril, configure una única tarjeta de carril o posición y haga clic en **Duplicar en Carriles / Posiciones...** en el panel de configuración.
  - Elija la dirección (**Horizontal** lado a lado o **Vertical** apilado), la cantidad total de carriles/posiciones destino (por defecto el número máximo de carriles de todas las pistas en la base de datos), el modo de espaciado (**Ajustar al Lienzo** o **Preservar Espaciado**) y opcionalmente reemplazar los widgets existentes.
  - **Modo de Replicación en Tiempo Real**: Al iniciar la replicación, el editor entra en un modo interactivo de plantilla con guías visuales de carriles y ajuste magnético. En este modo, coloca, redimensiona y diseña widgets directamente en el Carril 1 (Maestro), y los cambios se reflejan inmediatamente en tiempo real en todos los carriles restantes. Los widgets duplicados en los carriles 2..N son vistas previas en vivo de solo lectura; al hacer clic en cualquiera de ellos, el foco se redirige al maestro del Carril 1.
  - **Área Inteligente y Redimensionamiento**: El espacio de replicación se expande automáticamente en las cuatro direcciones para llenar el espacio disponible en el lienzo hasta encontrar el límite de cualquier widget existente fuera de la cuadrícula. Puede ajustar el área general interactivamente con los 8 controles perimetrales de cambio de tamaño en la superposición.
  - Al hacer clic en **Listo**, la cuadrícula se consolida en widgets independientes.
  - **Editar Plantilla y Desvincular**: Al seleccionar cualquier widget de la cuadrícula, la Configuración de widgets muestra una tarjeta para **Editar Plantilla de Cuadrícula** (para reingresar al modo de replicación en tiempo real en cualquier momento) o **Desvincular de Cuadrícula** (para separar permanentemente el widget).

### Sincronización de Cuadrícula: Vincular columnas vs. Reflejar Filas

Una cuadrícula en Race Coordinator AI es una matriz bidimensional organizada en:

- **Filas (Puestos de Competidores)**: Representan cada carril físico de la pista (**Carril 1, Carril 2, ...**) o posición de carrera (**Posición 1, Posición 2, ...**). Cuando la dirección de la cuadrícula es horizontal, estos puestos se muestran como columnas verticales.
- **Columnas (Campos de Datos)**: Representan cada métrica de datos dentro de un puesto (por ejemplo, *Nombre del Piloto, Vueltas de la Ronda, Tiempo de Última Vuelta, Mejor Vuelta, Diferencia, Imagen del Coche*).

El Inspector de la cuadrícula incluye dos controles esenciales en la sección **Estructura y diseño de la cuadrícula**: **Vincular columnas** y **Reflejar Filas** (denominado **Reflejar Columnas** si la orientación del diseño es horizontal).

#### Vincular columnas

**Vincular columnas** controla la sincronización del estilo visual en todas las columnas de datos de la cuadrícula.

- **Activado (Predeterminado)**:
  - Todas las columnas de datos comparten un estilo visual idéntico.
  - Cualquier cambio en una propiedad de estilo en cualquiera de las columnas se sincroniza automática e inmediatamente en todas las columnas de la cuadrícula.
  - **Propiedades Sincronizadas**:
    - **Estilo de Encabezado**: Familia tipográfica, tamaño de fuente, color del texto, color de fondo, alineación del texto y altura del encabezado.
    - **Estilo de Celda de Datos**: Familia tipográfica, tamaño de fuente, color del texto, color de fondo, alternancia de colores de carril (`useLaneColors`) y alineación de los valores.
    - **Estilo de Borde**: Visibilidad del borde, color del borde, grosor del borde y radio de las esquinas.
    - **Formato de Tiempo**: Decimales, formato de visualización y umbral de precisión de subsegundos.
    - **Resaltado de Telemetría**: Resaltado de fila al completar vuelta.
  - **Interacción con filas no reflejadas**: Cuando **Reflejar filas** está desactivado, las filas se desacoplan entre sí. Si **Vincular columnas** está activado, la modificación de estilos visuales (como color de fondo, color de texto o fuentes) en cualquier columna de una fila propaga ese cambio a todas las columnas *dentro de esa fila específica*, sin alterar ninguna otra fila.
- **Desactivado**:
  - Desvincula el estilo de las columnas. Cada columna puede tener sus propios tamaños de fuente, colores, bordes y alineaciones de manera independiente (por ejemplo, un texto grande en negrita con borde para el *Nombre del Piloto*, mientras que las *Vueltas* mantienen un texto pequeño y fondo transparente).
  - Al desactivarlo, aparecen botones en el inspector (**Aplicar estilo de encabezado / valor / borde / formato a todas las columnas**) debajo de cada sección, permitiendo transmitir selectivamente un tipo de estilo a todas las columnas bajo demanda.
- **Comportamiento al Desactivar**:
  - Se guarda inmediatamente en la configuración.
  - **Estado Visual de la Cuadrícula**: Los estilos actuales de las columnas **no** cambian inmediatamente; la cuadrícula mantiene su aspecto actual.
  - **Acción Requerida del Usuario**: Para apreciar diferencias visuales, el usuario debe seleccionar una columna concreta y editar sus opciones de estilo. Solo la columna editada reflejará los cambios.
- **Comportamiento al Volver a Activar**:
  - Vuelve a activar la sincronización automática para futuras ediciones.
  - **Estado Visual de la Cuadrícula**: Volver a marcar la casilla **no** sobrescribe inmediatamente las demás columnas con los estilos de la columna actualmente seleccionada; los estilos existentes se conservan intactos.
  - **Acción Requerida del Usuario**: El usuario debe modificar una propiedad de estilo (por ejemplo, cambiar el tamaño de fuente en 1px, cambiar un color o conmutar un borde) en cualquier columna. En cuanto se produce la modificación, la propiedad se propaga inmediatamente a todas las columnas de la cuadrícula. Alternativamente, se puede pulsar cualquiera de los botones explícitos de «Aplicar a todas las columnas».

#### Reflejar Filas (o Reflejar Columnas)

**Reflejar Filas** gestiona la replicación y la geometría de fila a fila partiendo de la **Fila Maestra (Carril 1 / Posición 1)** hacia todas las demás filas (**Carriles 2..N**).

- **Activado (Predeterminado)**:
  - Todas las filas no maestras reflejan estrictamente a la fila maestra.
  - Cualquier desplazamiento, cambio de tamaño, ajuste de diseño o modificación de propiedades en la celda maestra se replica inmediatamente en tiempo real en todos los demás carriles o posiciones.
  - Los widgets no maestros están vinculados al maestro y muestran la etiqueta **Reflejado** (por ejemplo, `Carril 2 (Reflejado)`).
- **Desactivado**:
  - Desacopla las filas no maestras de la plantilla maestra.
  - Los widgets no maestros muestran la etiqueta **Independiente** (por ejemplo, `Carril 2 (Independiente)`).
  - El usuario puede hacer clic en cualquier fila individual (por ejemplo, Carril 2 o Posición 3) y personalizar sus propiedades, colores de texto, colores de fondo o asignaciones de datos de forma independiente sin alterar la fila maestra ni los demás carriles.
  - Aparece el botón **Volver a reflejar en todas las filas** directamente debajo de la casilla en el inspector.
- **Comportamiento al Desactivar**:
  - Surte efecto inmediato en la configuración.
  - **Estado Visual de la Cuadrícula**: La distribución y las posiciones de las celdas **no** se mueven ni cambian de inmediato; las posiciones y estilos actuales se preservan.
  - **Acción Requerida del Usuario**: El usuario debe seleccionar una celda no maestra y editar sus propiedades para introducir personalizaciones individuales.
- **Comportamiento al Volver a Activar**:
  - Restablece la replicación maestra en la cuadrícula.
  - **Actualización Inmediata**:
    - Si el usuario vuelve a activar la casilla **Reflejar Filas** teniendo seleccionado un **widget maestro**, el diseño y configuración del maestro se sincronizan de inmediato con todos los carriles reflejados, sobrescribiendo las modificaciones independientes de las filas.
    - Si el usuario hace clic en el botón **Volver a reflejar en todas las filas**, el editor resincroniza inmediatamente todas las columnas maestras en todas las filas de la cuadrícula completa (`syncAllMasterWidgetsToLanes`), consolida la cuadrícula y actualiza el lienzo y la vista previa de carrera al instante sin requerir ninguna acción adicional.

#### Resumen Comparativo

| Control | Dirección / Alcance | Qué Sincroniza | Comportamiento al Desactivar | Comportamiento al Volver a Activar | ¿Inmediato o Requiere Acción del Usuario? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vincular columnas** | Horizontal (Entre Columnas) | Estilo visual: fuentes, tamaños, colores de texto/fondo, bordes, encabezados, formatos y resaltados | Las columnas se vuelven independientes; se conservan los estilos actuales; aparecen botones manuales de «Aplicar a todas» | Reactiva la sincronización para futuras ediciones; no sobrescribe de golpe las demás columnas | **Requiere Acción del Usuario**: Alternar la casilla no modifica los estilos actuales. El usuario debe editar una propiedad de estilo para que la sincronización surta efecto entre columnas. |
| **Reflejar Filas** | Vertical (Entre Filas / Carriles) | Geometría y propiedades: ancho/alto de celda, márgenes, vinculaciones replicadas del Carril 1 Maestro a Carriles 2..N | Las filas se independizan; el inspector muestra la etiqueta `Independiente`; se pueden editar carriles individuales; aparece el botón `Volver a reflejar en todas las filas` | Restablece la replicación maestra; la plantilla del maestro sobrescribe las modificaciones individuales de los carriles | **Inmediato si se selecciona el Maestro o se pulsa el botón**: Pulsar `Volver a reflejar en todas las filas` o reactivar sobre el Maestro alinea inmediatamente todas las filas al Maestro. Desactivar conserva el diseño hasta editar. |

