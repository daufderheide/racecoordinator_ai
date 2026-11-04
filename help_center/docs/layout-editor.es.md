# Editor de Diseños

El **Editor de Diseños** proporciona una interfaz de lienzo dedicada a pantalla completa para personalizar, organizar y diseñar diseños visuales de pantalla para Race Coordinator AI. Comparte la misma barra de herramientas unificada, selección de objetos, protección de solo lectura y ciclo de vida del modo de edición utilizados en los editores de Pilotos, Pistas y Carreras.

---

## Descripción General y Navegación

Se puede acceder al Editor de Diseños desde varias ubicaciones de la aplicación:

- **Barra de herramientas de Configuración de Día de Carrera**: Seleccione **Config > Editor de Diseños** (`/layout-editor` o `/layout-manager`).
- **Menú de administración de jornada**: Seleccione **Administrar > Editor de Diseños** (`/layout-editor`). Navegar durante una carrera activa preserva la conexión y el estado.
- **Editor de Interfaz**: Haga clic en **Abrir Editor de Diseños** desde la sección de Diseños de UI en el Editor de Interfaz (`/ui-editor`).

### Ciclo de Vida del Modo de Solo Lectura y Edición

- **Modo de Solo Lectura (Predeterminado)**: Las propiedades del diseño, los widgets del lienzo, las dimensiones y los campos del inspector están protegidos contra modificaciones accidentales.
- **Modo de Edición**: Al hacer clic en el icono **Editar** (lápiz) en la barra de herramientas, se desbloquea el lienzo de diseño, los controles de zoom, el reposicionamiento/redimensionamiento de widgets y la edición en el inspector.
- **Guardado Automático y Validación**: Al salir del modo de edición, los cambios se validan (por ejemplo, asegurando un nombre de diseño único y no vacío) y se guardan. Las configuraciones inválidas muestran una alerta y mantienen el editor en Modo de Edición.
- **Descartar Cambios**: Al salir o navegar hacia otra página con cambios no guardados, se muestra el modal estándar de confirmación de descarte, protegiendo contra la pérdida de datos.
- **Deshacer / Rehacer**: Totalmente integrado con los controles estándar (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> y <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Acciones de la Barra de Herramientas

La barra de herramientas superior proporciona acciones de gestión estandarizadas:

- **Selector de Diseño**: Menú desplegable para seleccionar cualquier diseño del sistema o personalizado, ordenado naturalmente con nombres predeterminados localizados (*IU Predeterminada Día de Carrera*, *IU Predeterminada Práctica*, *IU Predeterminada Puesto de Piloto*).
- **Editar / Terminar Edición**: Alterna entre el Modo de Solo Lectura y el Modo de Edición.
- **Biblioteca de Widgets (<span class="material-icons">widgets</span>)**: Alterna la visibilidad de la caja de herramientas flotante de widgets.
- **Configuración de Widgets (<span class="material-icons">tune</span>)**: Alterna la visibilidad del panel lateral de Configuración de Widgets.
- **Vista Previa de Cuenta Regresiva (<span class="material-icons">visibility</span>)**: Alterna una vista previa en vivo de las luces de salida en el lienzo sin iniciar una carrera real.
- **Añadir Diseño (<span class="material-icons">add</span>)**: Abre un cuadro de diálogo de selección de plantilla que le permite crear un nuevo diseño a partir de cualquier diseño predeterminado de Race Coordinator AI (*RC AI*, *Práctica*, *Combustible*, *Puesto de Piloto*) o comenzar desde un diseño completamente vacío.
- **Copiar Diseño (<span class="material-icons">content_copy</span>)**: Duplica el diseño seleccionado actualmente con un nombre único (por ejemplo, *Nombre del Diseño (Copia)*).
- **Eliminar Diseño (<span class="material-icons">delete</span>)**: Elimina el diseño personalizado actual tras confirmación. Los diseños predeterminados del sistema están protegidos y no se pueden eliminar.
- **Visita Guiada (<span class="material-icons">help_outline</span>)**: Inicia una visita interactiva guiada que resalta el selector de diseños, las acciones del encabezado, el lienzo de día de carrera, la biblioteca de widgets y el inspector de widgets.

---

## Controles de Lienzo y Resolución {: #layout-controls }

Ubicados en la barra de controles debajo de la barra de herramientas:

### Ajustes Preestablecidos de Relación de Aspecto y Resolución
Seleccione un preajuste de relación de aspecto (**16:9**, **16:10**, **4:3**, **21:9**, **Personalizado**) para escalar automáticamente las dimensiones base del lienzo (por ejemplo, 1920×1080, 1920×1200, 1440×1080).

### Modos de Escalado
- **Ajuste Automático (Escala Uniforme)**: Conserva la relación de aspecto de los widgets mientras se adapta a la pantalla de destino.
- **Estirar para Ajustar**: Estira los widgets independientemente en ancho y alto.
- **Fijo / Mapeo de Píxeles 1:1**: Mantiene las dimensiones exactas de coordenadas sin escalar.

### Controles de Zoom
- Ajuste el zoom suavemente de **25%** a **400%** usando los botones **-** y **+** o escribiendo un porcentaje directamente.
- Haga clic en **Restablecer Zoom** para restaurar el zoom al 100%.
- La configuración de zoom se almacena en el navegador por cada diseño.

### Biblioteca de widgets y controles de configuración {: #widget-panels }
Ubicados en la barra de herramientas principal a la izquierda del icono de vista previa de cuenta regresiva:
- **Biblioteca de widgets (<span class="material-icons">widgets</span>)**: Alterna la visibilidad del cuadro flotante de herramientas de widgets. Al hacer clic, también se desminimiza y se asegura de que quede dentro de la pantalla visible si se movió fuera de los límites.
- **Configuración de Widgets (<span class="material-icons">tune</span>)**: Alterna la visibilidad del panel lateral de Configuración de Widgets. Cuando está oculto, el lienzo puede extenderse a lo largo de toda la página si la relación de aspecto del diseño lo permite (igual que en modo de solo lectura).
- **Restablecer posición (<span class="material-icons">restart_alt</span>)**: Ubicado en el encabezado del cuadro flotante para devolverlo instantáneamente a su origen predeterminado `(0, 0)` arriba a la izquierda.
- **Minimizar (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Contrae el cuadro de herramientas a una barra de título compacta para liberar espacio en el lienzo.

---

## Lienzo de Widgets e Inspector {: #canvas-and-widgets }

El lienzo actúa como una vista previa auténtica y en vivo de su diseño, exactamente como lo verán los pilotos y espectadores durante una carrera. En el **Modo de Edición**, puede añadir, eliminar, reposicionar, redimensionar y configurar los widgets que componen el diseño.

### Interacciones en el Lienzo
- **Colocación y Selección**: Haga clic en cualquier widget del lienzo o selecciónelo en el menú desplegable de widgets de la barra de controles superior.
- **Reposicionamiento y Dimensionamiento**: Arrastre widgets libremente dentro de los límites del lienzo. Utilice el Inspector para introducir valores numéricos exactos de **X**, **Y**, **Ancho** y **Alto**.
- **Desplazamiento con el Teclado**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Desplaza el widget seleccionado 1px.
  - <kbd>Shift</kbd> + Teclas de flecha: Desplaza el widget seleccionado 10px.
  - <kbd>Supr</kbd> o <kbd>Retroceso</kbd>: Elimina el widget seleccionado.
- **Replicar Carriles**: Replica una tarjeta de columna de carril seleccionada en todos los carriles activos, posiciones, clasificaciones generales o cabezas de serie de pilotos.
- **Detección y Reparación de Columnas Apiladas**: El editor detecta automáticamente columnas duplicadas o superpuestas en las cuadrículas de carriles. Un banner de alerta ofrece **Corrección Rápida** con un solo clic o **Revisar Problemas** en un diálogo interactivo.

### Widgets Disponibles y Opciones de Configuración

Race Coordinator AI incluye una completa gama de widgets integrados:

1. **Tabla de Clasificación / Cuadrícula (Leaderboard / Grid)**:
   - **Propósito**: Muestra una tabla de clasificación en vivo con pilotos, posiciones, vueltas, telemetría y diferencias.
   - **Opciones de Configuración**: Fuente de datos (**Datos de Manga** vs. **Datos Generales de Carrera**), orden y visibilidad de columnas, altura de filas, reglas de ordenación, paginación automática y tipografía personalizada.
2. **Columna de Carril (Lane Column - Tarjetas Modulares)**:
   - **Propósito**: Muestra telemetría para un carril, posición o clasificación general como una tarjeta modular independiente.
   - **Opciones de Configuración**: Vinculación de objetivo (**Carril 1–8**, **Posición en Manga**, **Clasificación General** o **Cabeza de Serie**), hasta 8 **Ranuras de Inserción (Insets)** para avatares o métricas secundarias, alineación y escala de texto.
3. **Temporizador y Tiempo Total (Timer & Total Time)**:
   - **Propósito**: Muestra el tiempo restante o transcurrido de la manga o la duración total del evento.
   - **Opciones de Configuración**: Preajustes de visualización (**Dinámico**, **Minutos y Segundos**, **Reloj Completo**, **Segundos Totales**), umbrales de precisión por debajo del segundo y vista previa del formato.
4. **Widget de Cuenta Regresiva (Luces de Salida)**:
   - **Propósito**: Luces visuales de la secuencia de salida con sonido sincronizado.
   - **Opciones de Configuración**: Número de luces (1 a 10), orientación horizontal o vertical, animación de desvanecimiento, desenfoque de fondo y resplandor.
5. **Botones de Acción (Action Buttons)**:
   - **Propósito**: Botones táctiles e interactivos para el control de carrera.
   - **Opciones de Configuración**: Acciones (**Iniciar/Pausar**, **Bandera Amarilla**, **Llamada de Audio**, **Restablecer**, **Cambiar Diseño**), etiquetas personalizadas, iconos Material Icons y estilo de color.
6. **Widget de Récords (Records)**:
   - **Propósito**: Muestra récords de la pista y de la sesión (vuelta rápida histórica, récord por carril, récord de vueltas) y logros de pilotos.
   - **Opciones de Configuración**: Tipos de métricas de récord, formato de título, tipografía y estilos de fondo.
7. **Widget de Imagen (Image)**:
   - **Propósito**: Muestra diagramas de circuito, pancartas de patrocinadores, logotipos de clubes y gráficos.
   - **Opciones de Configuración**: Ruta de imagen, modo de escala (**Ajustar**, **Rellenar**, **Estirar**), opacidad y esquinas redondeadas.
8. **Widget de Información de Texto**:
   - **Propósito**: Muestra textos fijos o etiquetas de metadatos dinámicas de carrera (Nombre de Carrera, Manga Actual, Nombre de Pista).
   - **Opciones de Configuración**: Plantilla de texto con variables (`{race_name}`, `{heat_number}`), tamaño de fuente, alineación y colores.
9. **Widget de Menú**:
   - **Propósito**: Menú superpuesto en carrera para acceso rápido a sonido, cambio de diseño y control de carrera.
   - **Opciones de Configuración**: Estilo de icono, visibilidad de elementos y posición de anclaje.
10. **Próximas Mangas (En Espera)**:
    - **Propósito**: Informa a los pilotos sobre los próximos horarios de mangas y rotaciones de carriles.
    - **Opciones de Configuración**: Número de mangas a previsualizar, formato de nombres y espaciado.
11. **Widgets Personalizados (Custom Widgets)**:
    - **Propósito**: Carga componentes web externos e indicadores de telemetría desde su carpeta de widgets personalizados.
    - **Opciones de Configuración**: Campos de propiedades personalizadas (colores, umbrales, interruptores, textos) definidos en el manifiesto.

Para obtener detalles completos sobre estilo de widgets y desarrollo de widgets personalizados, consulte la [Guía del Editor de Interfaz](ui-editor.es.md) y la [Guía de Widgets Personalizados](custom-widgets.es.md).

---

## Importación, Exportación y Migración

- **Importar Diseño**: Importe un archivo JSON de diseño existente mediante la selección de archivos.
- **Exportar Diseño**: Descargue el diseño activo como un archivo JSON independiente.
- **Copias de Seguridad Previas a la Migración**: Para diseños actualizados desde versiones heredadas, restaure copias de seguridad de instantáneas previas a la migración o exporte diagnósticos de migración para resolución de problemas.
