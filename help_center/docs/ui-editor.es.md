# Personalizar interfaz

La página **Personalizar interfaz** le permite configurar las opciones generales del sistema, las ubicaciones de carpetas para archivos de interfaz y widgets modulares personalizados, plantillas de exportación de carreras a Excel, animaciones de transición de pantalla y parámetros de audio principal y síntesis de voz (TTS).

> [!NOTE]
> Para diseñar visualmente pantallas de carreras y tablas de clasificación personalizadas, consulte el [Editor de diseños](layout-editor.es.md). Para configurar conjuntos de imágenes de banderas, semáforos de salida e indicadores de combustible o efectos de sonido de carrera, consulte el [Editor de temas](theme-editor.es.md).

---

## Descripción general {: #overview }

La página de configuración de Personalizar interfaz proporciona un control centralizado sobre el comportamiento global de la interfaz y las opciones de audio a nivel de la aplicación:

- **Alcance global**: Los cambios realizados en esta página se aplican en toda la aplicación y en todas las sesiones de carrera.
- **Guardado automático continuo**: Los ajustes de volumen, tono de voz, tiempos de espera de cola, selección de carpetas y transiciones surten efecto de inmediato y se guardan automáticamente.
- **Secciones desplegables**: Las opciones están organizadas en secciones desplegables dedicadas para **Configuración de interfaz de usuario** y **Configuración de audio**.
- **Deshacer / Rehacer**: Las modificaciones realizadas durante su sesión actual se pueden revertir o reaplicar rápidamente con los controles de la barra de herramientas.

---

## Acciones de la barra de herramientas {: #toolbar-actions }

La barra de herramientas superior proporciona acciones esenciales de navegación y gestión de sesión:

- **Atrás**: Regresa a la pantalla o menú anterior.
- **Deshacer / Rehacer**: Revierte o vuelve a aplicar los cambios de configuración recientes realizados en la sesión actual.
- **Ayuda (?)**: Inicia el recorrido guiado interactivo que resalta cada sección y panel de la página.

---

## Configuración de interfaz de usuario {: #customize-ui-settings }

La sección **Configuración de interfaz de usuario** configura carpetas locales del sistema de archivos, plantillas de exportación a Excel y animaciones de pantalla:

### Carpeta de interfaz personalizada

Especifica una carpeta local utilizada para anular las plantillas predeterminadas de la aplicación y almacenar registros del cliente si es necesario:

- **Ruta de la carpeta**: Muestra el nombre de la carpeta activa y la ruta absoluta. Si no está configurada, la aplicación utiliza las ubicaciones internas predeterminadas.
- **Seleccionar carpeta**: Abre un cuadro de diálogo para explorar y seleccionar una carpeta local.
- **Introducir ruta**: Abre una ventana modal para escribir o pegar manualmente una ruta absoluta del sistema de archivos.
- **Restablecer valores predeterminados**: Borra la ruta personalizada y restaura los valores predeterminados.

> [!WARNING]
> Configurar una carpeta de interfaz personalizada anula plantillas esenciales de la aplicación y está destinado solo a usuarios avanzados que desarrollen interfaces personalizadas o analicen registros.

### Carpeta de widgets personalizados

Configura la carpeta raíz donde Race Coordinator AI busca [widgets personalizados](custom-widgets.es.md) modulares:

- **Ruta de la carpeta**: Muestra el nombre y la ruta de la carpeta de widgets personalizados.
- **Seleccionar carpeta**: Abre un selector de carpetas para elegir un directorio local con paquetes de widgets.
- **Introducir ruta**: Introduzca manualmente una ruta de carpeta absoluta.
- **Exportar widgets de inicio**: Copia paquetes de widgets de inicio listos para usar en una subcarpeta `sample/` dentro de la carpeta seleccionada (incluyendo `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` y `sample-detailed-leaderboard`). Este botón se activa al seleccionar una carpeta válida.
- **Restablecer valores predeterminados**: Borra la ruta de la carpeta de widgets personalizados.

Para conocer las especificaciones técnicas completas sobre la creación de widgets personalizados, consulte la [Guía de widgets personalizados](custom-widgets.es.md).

### Plantilla de exportación personalizada

Gestiona la plantilla personalizada de Microsoft Excel (`.xlsx`) utilizada al exportar resultados y estadísticas de carrera:

- **Estado de la plantilla**: Muestra el nombre del archivo de la plantilla de Excel activa o indica si la plantilla predeterminada del sistema está en uso.
- **Seleccionar plantilla**: Sube un libro de trabajo `.xlsx` personalizado desde su equipo para insertarlo como plantilla de exportación.
- **Descargar plantilla**: Descarga el archivo de plantilla activo en su ordenador para visualizarlo o editarlo en Microsoft Excel.
- **Exportación de prueba**: Genera y descarga un archivo `.xlsx` de ejemplo con datos de carrera simulados para verificar el formato, las fórmulas y los gráficos.
- **Variables de plantilla**: Abre una ventana modal que enumera todas las etiquetas de sustitución admitidas (como `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, etc.) que puede colocar en celdas de Excel para insertar datos de carrera automáticamente.
- **Restablecer valores predeterminados**: Vuelve a la plantilla de exportación de Excel estándar integrada.

> [!TIP]
> Si edita externamente su archivo de plantilla en Microsoft Excel u otra hoja de cálculo, vuelva a subirlo mediante **Seleccionar plantilla** para que el libro actualizado se guarde en Race Coordinator AI. Para más detalles, consulte la [Guía de exportación personalizada a XLS](custom-xls-export.es.md).

### Transiciones de página

Controla el estilo de animación visual utilizado al navegar entre pantallas y vistas en la aplicación:

- **Deslizar (Slide)** (Predeterminado): Transición de deslizamiento horizontal suave entre páginas.
- **Desvanecer (Fade)**: Disolución suave de opacidad entre vistas.
- **Zoom**: Transición moderna con efecto de escala.
- **Voltear (Flip)**: Efecto de volteo de tarjeta en 3D.
- **Ninguno (None)**: Cambio de página instantáneo sin animación (recomendado para dispositivos de bajo consumo o quioscos).

---

## Configuración de audio {: #audio-settings }

La sección **Configuración de audio** gestiona los niveles de volumen principal del sistema, el comportamiento de la cola de avisos y las locuciones de texto a voz (TTS):

### Volumen principal

Controla el nivel general de volumen principal (0% a 100%) para todas las salidas de audio en Race Coordinator AI. Ajustar este control deslizante escala todos los efectos de sonido, señales de cuenta atrás, bocinas de advertencia y anuncios de voz al mismo tiempo.

### Tiempo de espera de la cola urgente

Establece cuánto tiempo esperarán en la cola de audio los avisos urgentes de alta prioridad (como *Bandera amarilla*, *Manga finalizada* o *Salida en falso*) si ya se está reproduciendo otro mensaje urgente:

- **3 segundos**: Tiempo de espera breve; descarta avisos en cola rápidamente para mantener los avisos de voz sincronizados con la acción en pista.
- **5 segundos** (Predeterminado): Duración equilibrada que garantiza que se escuchen las alertas urgentes sin retrasarse de los eventos en vivo.
- **10 segundos**: Tiempo de espera relajado; permite que terminen anuncios más largos antes de omitir notificaciones urgentes posteriores.

Las alertas vencidas que superan el límite de tiempo se descartan automáticamente.

### Espaciado de locuciones

Configura el intervalo mínimo de silencio entre locuciones habladas consecutivas para evitar que se superpongan o corten:

- **Ninguno (0 ms)**: Los anuncios consecutivos se reproducen inmediatamente uno tras otro.
- **Corto (500 ms)** (Predeterminado): Breve pausa de medio segundo entre locuciones para un ritmo natural.
- **Normal (1000 ms)**: Pausa de 1 segundo entre anuncios para una separación más clara.
- **Relajado (1500 ms)**: Pausa de 1,5 segundos entre anuncios para un ritmo de narración más pausado.

### Voz de texto a voz (TTS)

Selecciona qué voz sintetizada se utiliza para los tiempos de vuelta, posiciones, anuncios del líder y avisos de combustible:

- **Predeterminada del sistema**: Utiliza la voz sintetizada predeterminada del sistema operativo o navegador.
- **Voces instaladas**: Muestra todas las voces de síntesis de voz detectadas en su sistema o navegador, con su nombre y etiqueta de idioma/región (por ejemplo, `es-ES`, `en-US`).

### Velocidad de voz

Controla la velocidad de reproducción de los anuncios de voz TTS mediante un control deslizante de **0,1x** (muy lento) a **2,0x** (doble velocidad) en incrementos de 0,05. La velocidad predeterminada es **1,0x**.

### Tono de voz

Controla el tono/frecuencia de los anuncios de texto a voz mediante un control deslizante de **0,0x** (grave) a **2,0x** (agudo) en incrementos de 0,05. El tono predeterminado es **1,0x**.

### Volumen de voz

Control deslizante independiente (0% a 100%) específicamente para anuncios de voz TTS. Le permite equilibrar el volumen de los comentarios hablados respecto a los efectos de sonido de carrera.

### Probar voz

Haga clic en **Probar voz** para escuchar una frase de ejemplo con los ajustes seleccionados de voz, velocidad, tono y volumen.
