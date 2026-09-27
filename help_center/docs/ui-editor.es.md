# Editor de Interfaz

## Descripción general

El Editor de Interfaz le permite diseñar diseños de pantalla personalizados para el día de la carrera, configurar columnas de clasificación de pilotos, personalizar efectos de sonido y gráficos de temas y cargar [Widgets personalizados](custom-widgets.md) modulares.

## Widgets personalizados y carpeta de widgets

Se pueden agregar widgets personalizados a sus diseños de interfaz personalizada:
- **Carpeta de widgets personalizados**: Establezca su carpeta local de widgets en la sección **Interfaz personalizada** en la parte inferior del editor.
- **Actualizar widgets de muestra**: Haga clic en **Actualizar widgets de muestra** para generar o actualizar widgets de muestra listos para usar en una carpeta `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Grupos de la caja de herramientas de widgets**: La caja de herramientas organiza los widgets en grupos (**Race Coordinator AI**, **Raíz personalizada** y carpetas personalizadas como **sample**) con subgrupos anidados (como **Acciones** y **Datos de la tanda** con subcarpetas categorizadas) y un filtro de búsqueda instantánea.
- **Inspector dinámico**: Cuando se selecciona un widget personalizado en el lienzo, sus propiedades personalizadas (colores, umbrales, selectores, campos de texto) aparecen dinámicamente en el Inspector de widgets.

Para obtener detalles completos sobre el desarrollo de widgets, consulte la [Guía de widgets personalizados](custom-widgets.md).

## Configuración de diseño y columnas

- Arrastre y suelte widgets desde la paleta hacia el lienzo.
- Cambie el tamaño, reposicione y alinee widgets para adaptarse a su resolución. Todos los widgets están delimitados para no salirse del lienzo.
- **Controles del Inspector de Widgets**:
  - **Posición y tamaño**: Ajuste con precisión la posición y dimensiones del widget seleccionado mediante los campos numéricos **X**, **Y**, **Ancho** y **Altura**.
  - **Eliminar widget**: Haga clic en el icono de papelera en el encabezado del inspector o en el botón **Eliminar widget** en la barra lateral.
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
- **Vista previa**: El inspector incluye una vista previa en tiempo real que demuestra cómo se muestran las opciones seleccionadas en distintos puntos de la carrera (`> 1 hr`, `> 1 min`, `< 1 min` y `< 10s`).

## Widgets de Columna de Carril y Duplicación

El widget de **Columna de Carril** permite colocar columnas individuales de datos de la vista de carril (como información del piloto, tiempo de última vuelta, mejor vuelta / récord personal, combustible %, historial de vueltas, velocidades de sector, posición, etc.) en cualquier parte del lienzo como tarjetas modulares independientes.

- **Modos de Vinculación**:
  - **Carril Físico**: Vincula la tarjeta a un carril específico de la pista (Carril 1 a Carril 8). La tarjeta mantiene los datos de ese carril durante toda la carrera.
  - **Posición en la Carrera**: Vincula la tarjeta a la clasificación actual (1º Lugar, 2º Lugar, etc.). La tarjeta sigue dinámicamente los cambios de posición y adelantamientos, adaptando sus colores de fondo y acento al carril del piloto que se encuentra en esa posición.
- **Orientación**: Admite diseños **Vertical** (encabezado encima del valor) y **Horizontal** (encabezado y valor lado a lado).
- **Herencia de Color y Personalización**: Las tarjetas heredan de manera predeterminada los colores de fondo y texto del carril asignado (`Usar Colores de Carril`), o pueden personalizarse con colores de fondo, texto y bordes propios.
- **Duplicar en Carriles / Posiciones**:
  - En lugar de crear y alinear tarjetas manualmente para cada carril, configure una única tarjeta de carril o posición y haga clic en **Duplicar en Carriles / Posiciones...** en el inspector.
  - Elija la dirección (**Horizontal** lado a lado o **Vertical** apilado), la cantidad total de carriles/posiciones destino (por defecto el número máximo de carriles de todas las pistas en la base de datos), el modo de espaciado (**Ajustar al Lienzo** o **Preservar Espaciado**) y opcionalmente reemplazar los widgets existentes.
  - **Modo de Replicación en Tiempo Real**: Al iniciar la replicación, el editor entra en un modo interactivo de plantilla con guías visuales de carriles y ajuste magnético. En este modo, coloca, redimensiona y diseña widgets directamente en el Carril 1 (Maestro), y los cambios se reflejan inmediatamente en tiempo real en todos los carriles restantes. Los widgets duplicados en los carriles 2..N son vistas previas en vivo de solo lectura; al hacer clic en cualquiera de ellos, el foco se redirige al maestro del Carril 1.
  - **Área Inteligente y Redimensionamiento**: El espacio de replicación se expande automáticamente en las cuatro direcciones para llenar el espacio disponible en el lienzo hasta encontrar el límite de cualquier widget existente fuera de la cuadrícula. Puede ajustar el área general interactivamente con los 8 controles perimetrales de cambio de tamaño en la superposición.
  - Al hacer clic en **Listo**, la cuadrícula se consolida en widgets independientes.
  - **Editar Plantilla y Desvincular**: Al seleccionar cualquier widget de la cuadrícula, el inspector muestra una tarjeta para **Editar Plantilla de Cuadrícula** (para reingresar al modo de replicación en tiempo real en cualquier momento) o **Desvincular de Cuadrícula** (para separar permanentemente el widget).

