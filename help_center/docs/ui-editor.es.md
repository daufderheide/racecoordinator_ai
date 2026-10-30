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

### Widgets secundarios (Insets) y alineación

Cada tarjeta de columna de carril admite hasta 8 **ranuras secundarias (Insets)** dispuestas alrededor del perímetro del dato principal (Superior izquierda, Superior centro, Superior derecha, Centro izquierda, Centro derecha, Inferior izquierda, Inferior centro, Inferior derecha):

- **Vinculación de datos**: Los insets pueden mostrar métricas secundarias (p. ej., mejor vuelta, conteo de vueltas, combustible %, mangas disputadas, nombre del piloto), imágenes/avatares o widgets personalizados incrustados.
- **Alineación horizontal y vertical**:
  - En la pestaña Inset del inspector, cada elemento secundario proporciona controles de **Alineación horizontal** (**Izquierda**, **Centro**, **Derecha**) y **Alineación vertical** (**Arriba**, **Centro**, **Abajo**).
  - Los insets utilizan de forma predeterminada su posición perimétrica natural (p. ej., `Superior izquierda` utiliza Izquierda/Arriba de forma predeterminada, `Inferior derecha` utiliza Derecha/Abajo), garantizando total compatibilidad visual con diseños existentes y permitiendo un ajuste preciso dentro de cada ranura.
- **Estilos personalizados**: Los insets pueden heredar fuentes y colores de la columna o configurar tipografía, colores de texto, decimales y umbrales de formato personalizados.

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

Race Coordinator AI proporciona **2 widgets de diferencias configurables** para Datos de Ronda y Datos Generales:

1. **Diferencia de Ronda (`gap`)**: Evalúa los intervalos en tiempo real estrictamente entre los coches que compiten en la ronda actual.
2. **Diferencia General (`overallGap`)**: Evalúa los intervalos acumulados entre todos los participantes del evento.

Cada widget de diferencia se puede personalizar en el Inspector de Columnas mediante dos opciones principales:
- **Objetivo**:
  - **Líder**: Intervalo respecto al líder actual de la carrera (P1).
  - **Posición por delante**: Intervalo respecto al competidor inmediatamente anterior en la clasificación (ej. P3 vs P2).
- **Modo de cálculo**:
  - **Siempre tiempo**: Proyección matemática continua del ritmo en segundos (`+X.XXX`).
  - **Tiempo y vueltas perdidas**: Estilo Fórmula 1 que muestra el tiempo en la misma vuelta o el déficit de vueltas (`+1 Vuelta`, `+N Vueltas`) al estar doblado.
  - **Siempre vueltas**: Diferencia exacta de vueltas calculada al completar una vuelta, incorporando el progreso de vuelta parcial del piloto comparado.

> [!NOTE]
> Se pueden colocar varios widgets de diferencias con distintas configuraciones (por ejemplo, una columna de Diferencia con el Líder y otra con la Posición Precedente) en la misma cuadrícula o diseño simultáneamente.

Para conocer las fórmulas matemáticas completas y especificaciones de cronometraje, consulte la [Guía de Cálculos de Diferencias](gap-calculations.md).

#### Widget de Últimas Vueltas (`lastLaps`)

El widget **Últimas Vueltas** (`lastLaps`) muestra los tiempos de las vueltas recientes completadas por el piloto en la manga activa:

- **Últimas vueltas a mostrar**: Configura cuántas vueltas recientes mostrar dentro del widget (control deslizante 1–20, campo numérico 1–50). El valor predeterminado es `5`.
- **Separación de vueltas y bordes**: Configura cómo se separan las vueltas individuales. Incluye estilo de borde (sólido, discontinuo, punteado, doble), color del borde, ancho de borde (1–10px), margen del borde (-20px a 40px+ para controlar qué tan adentro o afuera se sitúa el borde y alinearlo a la perfección con los bordes de columnas adyacentes), radio de esquina (0–32px) y modo de separación (línea divisoria entre vueltas o caja de borde alrededor de cada vuelta).
- **Resaltado de mejor vuelta**: Resalta si una vuelta en la lista es la mejor vuelta del piloto. Incluye color de texto, color de fondo distintivo, grosor de fuente (normal, negrita, extra negrita/900), subrayado, cursiva y bordes de acento para la mejor vuelta.
- **Ajuste y escala dinámicos**: La tarjeta escala automáticamente los tamaños de fuente y el espaciado para ajustar limpiamente la cantidad configurada de vueltas dentro de la geometría asignada.
- **Sincronización en cuadrícula**: En cuadrículas de carriles, configurar o aplicar formatos de tiempo sincroniza la cantidad de vueltas mostradas y su diseño en todos los carriles participantes.

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

### Sincronización de Cuadrícula: Reflejar Columnas vs. Reflejar Filas

Una cuadrícula en Race Coordinator AI es una matriz bidimensional organizada en puestos de competidores y métricas de datos:

- **Orientación Vertical (Predeterminada)**:
  - **Filas (Puestos de Competidores)**: Representan cada carril físico de la pista (**Carril 1, Carril 2, ...**) o posición de carrera (**Posición 1, Posición 2, ...**).
  - **Columnas (Campos de Datos)**: Representan cada métrica de datos dentro de un puesto (por ejemplo, *Nombre del Piloto, Vueltas de la Ronda, Tiempo de Última Vuelta, Mejor Vuelta, Diferencia, Imagen del Coche*).
  - **Reflejar Columnas**: Controla la sincronización del estilo visual en todas las columnas de datos.
  - **Reflejar Filas**: Regula la replicación y la sincronización de geometría de fila a fila partiendo de la **Fila Maestra (Carril 1 / Posición 1)** hacia todas las demás filas (**Carriles 2..N**).
- **Orientación Horizontal**:
  - **Columnas (Puestos de Competidores)**: Representan cada carril físico de la pista (**Carril 1, Carril 2, ...**) o posición de carrera (**Posición 1, Posición 2, ...**). Cada carril en una vista de manga es una columna.
  - **Filas (Campos de Datos)**: Representan métricas de datos apiladas verticalmente dentro de cada carril.
  - **Reflejar Columnas**: Regula la replicación de columna a columna y la sincronización de geometría y estilo partiendo de la **Columna Maestra (Carril 1 / Posición 1)** hacia todas las demás columnas (**Carriles 2..N**). Al desactivarlo, las columnas (carriles) se vuelven independientes y aparece el botón **Volver a reflejar en todas las columnas**.
  - **Reflejar Filas**: Controla la sincronización del estilo visual en todas las filas de datos (métricas).

El Inspector de la cuadrícula incluye dos controles esenciales en la sección **Estructura y diseño de la cuadrícula**: **Reflejar Columnas** y **Reflejar Filas**.

#### Reflejar Columnas

**Reflejar Columnas** sincroniza las columnas en toda la cuadrícula:
- En **Orientación Vertical**, las columnas representan diferentes campos/métricas de datos. Reflejar Columnas sincroniza el estilo visual entre estas columnas métricas.
- En **Orientación Horizontal**, las columnas representan carriles o posiciones individuales de la pista. Reflejar Columnas sincroniza la replicación de columna a columna, las dimensiones y el estilo desde la **Columna Maestra (Carril 1 / Posición 1)** a todos los carriles competidores.

- **Activado (Predeterminado)**:
  - Las columnas comparten estilos vinculados (en orientación vertical) o una replicación completa de la plantilla maestra (en orientación horizontal).
  - Cualquier cambio en la columna maestra se propaga inmediatamente a todas las columnas.
  - **Propiedades Sincronizadas**:
    - **Estilo de Encabezado**: Familia tipográfica, tamaño de fuente, color del texto, color de fondo, alineación del texto y dimensiones del encabezado.
    - **Estilo de Celda de Datos**: Familia tipográfica, tamaño de fuente, color del texto, color de fondo, alternancia de colores de carril (`useLaneColors`) y alineación de los valores.
    - **Estilo de Borde**: Visibilidad del borde, color del borde, grosor del borde y radio de las esquinas.
    - **Formato de Tiempo**: Decimales, formato de visualización y umbral de precisión de subsegundos.
    - **Resaltado de Telemetría**: Resaltado al completar vuelta.
- **Desactivado**:
  - Desacopla la sincronización de columnas.
  - En orientación vertical, cada columna de datos puede tener tamaños de fuente, colores y bordes independientes, y aparecen botones para aplicar estilos manualmente a todas las columnas.
  - En orientación horizontal, cada columna de carril competidor se vuelve independiente, los widgets muestran la etiqueta **Independiente** (por ejemplo, `Carril 2 (Independiente)`), y aparece el botón **Volver a reflejar en todas las columnas**.
- **Comportamiento al Volver a Activar**:
  - Reactiva la sincronización de columnas. En orientación horizontal, volver a activar la casilla o hacer clic en **Volver a reflejar en todas las columnas** vuelve a sincronizar inmediatamente todas las columnas con el carril maestro.

#### Reflejar Filas

**Reflejar Filas** sincroniza las filas en toda la cuadrícula:
- En **Orientación Vertical**, las filas representan carriles o posiciones individuales de la pista. Reflejar Filas regula la replicación y la sincronización de geometría de fila a fila partiendo de la **Fila Maestra (Carril 1 / Posición 1)** hacia todas las demás filas (**Carriles 2..N**).
- En **Orientación Horizontal**, las filas representan diferentes campos o métricas de datos apilados dentro de cada carril. Reflejar Filas regula la sincronización del estilo visual entre las filas métricas.

- **Activado (Predeterminado)**:
  - Las filas siguen estrictamente la plantilla maestra (en orientación vertical) o comparten estilos sincronizados (en orientación horizontal).
  - Cualquier desplazamiento, cambio de tamaño o modificación en la celda maestra se replica inmediatamente en tiempo real en todos los demás carriles o posiciones.
  - En orientación vertical, los widgets no maestros muestran la etiqueta **Reflejado** (por ejemplo, `Carril 2 (Reflejado)`).
- **Desactivado**:
  - Desacopla las filas.
  - En orientación vertical, las filas no maestras muestran la etiqueta **Independiente** (por ejemplo, `Carril 2 (Independiente)`), los carriles pueden personalizarse de forma individual y aparece el botón **Volver a reflejar en todas las filas**.
  - En orientación horizontal, cada fila métrica puede tener estilos independientes sin afectar a las demás filas.
- **Comportamiento al Volver a Activar**:
  - Reactiva la replicación y sincronización de filas. En orientación vertical, hacer clic en **Volver a reflejar en todas las filas** o volver a marcar la casilla alinea inmediatamente todas las filas con la fila maestra.

#### Filas adicionales

Cuando una cuadrícula contiene filas desocupadas (por ejemplo, cuando hay menos pilotos en una carrera o manga que filas/carriles configurados), el ajuste **Filas adicionales** del Inspector de cuadrícula controla su comportamiento:

- **Eliminar**: Elimina automáticamente las filas y columnas sobrantes no asignadas, ajustando la cuadrícula al número real de pilotos participantes. (Predeterminado para cuadrículas de **Clasificación General** y **Clasificación Previa**).
- **Mostrar vacías**: Mantiene visibles las filas adicionales mostrando `--` en todos los valores e inserciones, conservando encabezados y estructuras. (Predeterminado para cuadrículas de **Manga** y **Carril**).
- **Mostrar en blanco**: Mantiene visibles las filas adicionales mostrando únicamente los bordes y el fondo de las tarjetas, sin textos ni encabezados.

#### Resumen Comparativo

| Control | Orientación | Alcance | Qué Sincroniza | Comportamiento al Desactivar | Comportamiento al Volver a Activar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Reflejar Columnas** | Vertical | Columnas (Métricas de Datos) | Estilo visual: fuentes, tamaños, colores, bordes, encabezados, formatos | Las columnas se vuelven independientes; se conservan los estilos actuales; aparecen botones manuales «Aplicar a todas» | Reactiva la sincronización automática para futuras ediciones |
| **Reflejar Columnas** | Horizontal | Columnas (Carriles / Competidores) | Geometría, replicación y estilos desde el Carril 1 Maestro a todas las columnas de carriles | Las columnas de carriles se independizan; aparece la etiqueta `Independiente`; aparece el botón `Volver a reflejar en todas las columnas` | Restablece la replicación maestra; alinea todas las columnas al Maestro |
| **Reflejar Filas** | Vertical | Filas (Carriles / Competidores) | Geometría, replicación y configuración desde el Carril 1 Maestro a todas las filas de carriles | Las filas de carriles se independizan; aparece la etiqueta `Independiente`; aparece el botón `Volver a reflejar en todas las filas` | Restablece la replicación maestra; alinea todas las filas al Maestro |
| **Reflejar Filas** | Horizontal | Filas (Métricas de Datos) | Estilo visual: fuentes, tamaños, colores, bordes entre filas de métricas | Las filas de métricas se vuelven independientes; se conservan los estilos actuales | Reactiva la sincronización automática para futuras ediciones |


