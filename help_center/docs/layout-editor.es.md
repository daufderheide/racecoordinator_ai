# Editor de Diseños

El **Editor de Diseños** proporciona una interfaz de lienzo dedicada a pantalla completa para personalizar, organizar y diseñar diseños visuales de pantalla para Race Coordinator AI. Comparte la misma barra de herramientas unificada, selección de objetos, protección de solo lectura y ciclo de vida del modo de edición utilizados en los editores de Pilotos, Pistas y Carreras.

---

## Descripción General y Navegación

Se puede acceder al Editor de Diseños desde varias ubicaciones de la aplicación:

- **Barra de herramientas de Configuración de Día de Carrera**: Seleccione **Config > Editor de Diseños** (`/layout-editor` o `/layout-manager`).
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
- **Añadir Diseño (<span class="material-icons">add</span>)**: Abre un cuadro de diálogo de selección de plantilla que le permite crear un nuevo diseño a partir de cualquier diseño predeterminado de Race Coordinator AI (*RaceCoordinator AI*, *Práctica*, *Combustible*, *Puesto de Piloto*) o comenzar desde un diseño completamente vacío.
- **Copiar Diseño (<span class="material-icons">content_copy</span>)**: Duplica el diseño seleccionado actualmente con un nombre único (por ejemplo, *Nombre del Diseño (Copia)*).
- **Eliminar Diseño (<span class="material-icons">delete</span>)**: Elimina el diseño personalizado actual tras confirmación. Los diseños predeterminados del sistema están protegidos y no se pueden eliminar.
- **Visita Guiada (<span class="material-icons">help_outline</span>)**: Inicia una visita interactiva guiada que resalta el selector de diseños, las acciones del encabezado, el lienzo de día de carrera, la biblioteca de widgets y el inspector de widgets.

---

## Controles de Lienzo y Resolución

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

### Vista Previa de la Cuenta Regresiva de Salida
- Haga clic en **Vista Previa de Luces** (<span class="material-icons">timer</span>) para alternar una vista previa de la secuencia de luces de salida en el lienzo sin iniciar una carrera real.

### Biblioteca de widgets y cuadro de herramientas
- **Biblioteca de widgets (<span class="material-icons">widgets</span>)**: Alterna la visibilidad del cuadro flotante de herramientas de widgets. Al hacer clic, también se desminimiza y se asegura de que quede dentro de la pantalla visible si se movió fuera de los límites.
- **Restablecer posición (<span class="material-icons">restart_alt</span>)**: Ubicado en el encabezado del cuadro flotante para devolverlo instantáneamente a su origen predeterminado `(0, 0)` arriba a la izquierda.
- **Minimizar (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Contrae el cuadro de herramientas a una barra de título compacta para liberar espacio en el lienzo.

---

## Lienzo de Widgets e Inspector

- **Colocación y Selección**: Haga clic en cualquier widget del lienzo o selecciónelo en el menú desplegable de widgets.
- **Reposicionamiento y Dimensionamiento**: Arrastre widgets libremente dentro de los límites del lienzo. Utilice la barra lateral del Inspector para introducir valores numéricos exactos de **X**, **Y**, **Ancho** y **Alto**.
- **Desplazamiento con el Teclado**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Desplaza el widget seleccionado 1px.
  - <kbd>Shift</kbd> + Teclas de flecha: Desplaza el widget seleccionado 10px.
  - <kbd>Supr</kbd> o <kbd>Retroceso</kbd>: Elimina el widget seleccionado.
- **Replicar Carriles**: Replica una tarjeta de columna de carril seleccionada en todos los carriles activos, posiciones, clasificaciones generales o cabezas de serie de pilotos.
- **Detección y Reparación de Columnas Apiladas**:
  - El editor detecta automáticamente columnas duplicadas o superpuestas en las cuadrículas de carriles.
  - Un banner de alerta ofrece una **Corrección Rápida** con un solo clic o **Revisar Problemas** en un diálogo interactivo.

---

## Importación, Exportación y Migración

- **Importar Diseño**: Importe un archivo JSON de diseño existente mediante la selección de archivos.
- **Exportar Diseño**: Descargue el diseño activo como un archivo JSON independiente.
- **Copias de Seguridad Previas a la Migración**: Para diseños actualizados desde versiones heredadas, restaure copias de seguridad de instantáneas previas a la migración o exporte diagnósticos de migración para resolución de problemas.
