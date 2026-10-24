# Editor de Pilotos

El **Editor de Pilotos** le permite crear, ver y personalizar perfiles de pilotos, apodos, avatares y avisos de audio personalizados.

## Resumen

El Editor de Pilotos integra la selección y edición de pilotos en una interfaz unificada:

- **Selector de Pilotos**: Ubicado en el encabezado superior junto al título, este menú desplegable enumera todos los pilotos existentes y permite cambiar rápidamente entre ellos.
- **Modo de Solo Lectura**: De forma predeterminada, el editor muestra los detalles en modo de solo lectura. Los campos están bloqueados para evitar cambios accidentales, permitiendo probar los sonidos de audio.
- **Modo de Edición**: Al hacer clic en el icono **Editar** (lápiz) de la barra de herramientas, se desbloquean los campos. Durante la edición, el selector de pilotos se bloquea para evitar perder cambios no guardados.
- **Guardar Cambios**: Al hacer clic en el icono **Terminar Edición** (marca de verificación), se validan los cambios, se guardan en el servidor y el editor vuelve al modo de solo lectura.
- **Descartar Cambios**: Si intenta salir con cambios sin guardar, el cuadro de diálogo le pedirá confirmación. Al descartar, todos los cambios volverán a la versión guardada anteriormente.

## Acciones de la Barra de Herramientas

La barra de herramientas superior proporciona las siguientes acciones:

- **Volver**: Regresa a la vista anterior o a la Configuración del Día de Carrera.
- **Añadir Piloto (+)**: Crea una nueva plantilla de piloto y entra en el modo de edición.
- **Copiar Piloto**: Duplica el perfil del piloto seleccionado en una nueva plantilla.
- **Editar / Terminar Edición**: Alterna entre el modo de solo lectura y el modo de edición (atajo de teclado: Cmd/Ctrl+E).
- **Importar Pilotos**: Abre el cuadro de diálogo para importar perfiles de pilotos, avatares y configuraciones de audio desde archivos externos.
- **Exportar Pilotos**: Abre el cuadro de diálogo para exportar pilotos y sus archivos asociados de audio y avatar a un archivo ZIP descargable en formato CSV, Excel o JSON.
- **Expandir / Contraer todo**: Expande o contrae todas las secciones de acordeón a la vez.
- **Eliminar Piloto**: Elimina el perfil del piloto seleccionado tras su confirmación.
- **Ayuda (?)**: Abre la guía interactiva que explica cada sección del editor.

## Detalles del Piloto

- **Nombre**: El nombre completo del piloto que se muestra en las clasificaciones.
- **Apodo**: Nombre abreviado o pronunciado utilizado para los anuncios de voz (TTS).
- **Vincular Nombre y Apodo**: Al activarse, la edición del nombre se copia automáticamente en el apodo.
- **Avatar**: Seleccione una imagen o icono para el piloto.
- **Etiquetas de piloto**: Asigne etiquetas codificadas por colores (similar a las etiquetas de problemas de GitHub) para organizar a los pilotos en conjuntos personalizados (como "Pro", "Rookie" o "Clase A"). Los pilotos pueden pertenecer a cualquier cantidad de conjuntos. En el Modo Edición, haga clic en **Gestionar etiquetas** para crear, editar, cambiar de color, eliminar o asignar etiquetas. En la pantalla de Configuración del Día de Carrera, puede filtrar los participantes disponibles por etiqueta para configurar rápidamente las alineaciones de carrera.

## Avisos de Audio y Efectos

Configure efectos de sonido o anuncios de voz (TTS) para este piloto:

- **Audio de Vuelta**: Se reproduce al completar una vuelta estándar.
- **Mejor Vuelta Personal**: Se reproduce cuando el piloto establece su mejor tiempo de vuelta.
- **Hitos y Récords**: Sonidos personalizados para récords de pista, de manga y cambios de líder.
- **Probar Audios**: El botón de reproducción permanece activo en ambos modos para escuchar los audios en cualquier momento.

## Importar Pilotos

Race Coordinator AI permite importar pilotos por lotes desde archivos externos, incluyendo creación masiva, resolución de conflictos, recursos multimedia personalizados y configuración predeterminada para ranuras de audio vacías.

### Formatos de Archivo Compatibles

- **CSV (`.csv`)**: Archivos de texto delimitados por comas, puntos y comas o tabuladores. Los encabezados se asignan de manera flexible (sin distinguir mayúsculas, espacios ni guiones bajos).
- **Excel (`.xlsx`, `.xls`)**: Hojas de cálculo de Microsoft Excel. Se procesa la primera hoja utilizando los nombres de columna.
- **JSON (`.json`)**: Una matriz de objetos de piloto o un objeto con una propiedad `"drivers"`.
- **Paquete ZIP (`.zip`)**: Archivo comprimido ZIP que contiene un archivo de datos (`drivers.csv`, `drivers.xlsx` o `drivers.json`) junto con los archivos de audio (`.wav`, `.mp3`, `.ogg`) e imágenes de avatar (`.png`, `.jpg`, `.jpeg`) referenciados.

### Asignación de Columnas y Campos

Se reconocen las siguientes columnas y campos JSON:

| Campo | Alias de Columna Reconocidos | Descripción | Predeterminado / Alternativa |
| :--- | :--- | :--- | :--- |
| **Nombre** | `Name`, `Driver`, `Driver Name`, `Full Name` | Nombre completo del piloto (obligatorio). | Ninguno (error si está vacío) |
| **Apodo** | `Nickname`, `Nick`, `Callout`, `Display Name` | Apodo o nombre pronunciado. | Usa el **Nombre** si está vacío. Se valida contra duplicados. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Nombre de archivo relativo (ej. `john.png`), nombre de recurso o URL. | Ninguno |
| **Audio Predeterminado** | `Default Audio`, `Blank Audio`, `Audio Default` | Directiva para ranuras de audio vacías: `none` / `muted` o `system` / `default`. | Directiva de archivo o selector del modal |
| **Audio de Vuelta** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Sonido al completar una vuelta estándar. | Predeterminado según el modo de audio |
| **Mejor Vuelta Personal** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Sonido al registrar la mejor vuelta personal. | Predeterminado según el modo de audio |
| **Récord de Pista** | `Track Record Audio`, `Track Record`, `Record Audio` | Sonido al batir el récord de pista. | Predeterminado según el modo de audio |
| **Líder de Carrera** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Sonido al ponerse en cabeza de carrera. | Predeterminado según el modo de audio |
| **Tiempo Mínimo de Vuelta** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Sonido al rodar por debajo del tiempo mínimo. | Predeterminado según el modo de audio |
| **Vuelta de Drift** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Sonido durante una vuelta de drift. | Predeterminado según el modo de audio |
| **Salida en Falso** | `False Start Audio`, `False Start`, `Penalty Audio` | Sonido por salida en falso o penalización. | Predeterminado según el modo de audio |
| **Entrada a Boxes** | `Pit In Audio`, `Pit In`, `Pit Stop` | Sonido al entrar al carril de boxes. | Predeterminado según el modo de audio |
| **Aviso de Combustible** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Sonido de aviso de bajo combustible. | Predeterminado según el modo de audio |
| **Sin Combustible** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Sonido cuando el vehículo se queda sin combustible. | Predeterminado según el modo de audio |

### Sintaxis de Ranuras de Audio

Los valores de audio pueden usar los siguientes formatos:
- **`none`** o **`off`** / **`mute`**: La ranura está silenciada (sin audio).
- **`tts:<texto>`** o **`${nickname} toma el liderato`**: Aviso Text-to-Speech (TTS). Admite llaves `{nickname}` y `${driver}`.
- **`preset:<sonido>`**: Sonidos predefinidos del sistema (ej. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Nombre de archivo (ej. `cheer.wav`, `v8_rev.mp3`)**: Archivo multimedia complementario incluido con la importación o dentro de un ZIP.

### Directivas de Archivo para Audio Vacío

Puede declarar cómo tratar las ranuras de audio vacías directamente en el archivo:
- En CSV: `# default-audio: none` o `# default-audio: system` en los comentarios de cabecera.
- En JSON: `"default_audio": "none"` en el objeto raíz.
- En Excel/CSV: Columna `Default Audio` por cada fila de piloto.
- En la interfaz: Selector desplegable **Ranuras de audio vacías** en el modal de importación.

### Auto-Importación de Recursos y Medios

Al importar pilotos con avatares o sonidos personalizados:
1. **Arrastrar y soltar múltiple**: Suelte su archivo `.csv` o `.xlsx` junto con archivos `.wav`, `.mp3`, `.png` o `.jpg` a la vez en la zona de subida.
2. **Paquete ZIP**: Empaquete el archivo de datos y los recursos multimedia en un `.zip` y súbalo.
3. **Registro automático**: El servidor procesa los archivos en el Administrador de Recursos, genera identificadores SHA-256 y enlaza los elementos con los avatares y ranuras de audio correspondientes.

### Resolución de Conflictos

Si un piloto en el archivo coincide con un nombre o apodo existente en la base de datos, la tabla de vista previa interactiva permite elegir:
- **Renombrar automáticamente**: Asigna un nuevo nombre (ej. `Alice Walker (1)`) manteniendo el perfil existente intacto.
- **Sobrescribir existente**: Actualiza el perfil existente con los nuevos datos, avatares y configuraciones de audio importados.
- **Omitir**: Descarta la fila en conflicto.

Las resoluciones pueden configurarse individualmente por fila, aplicarse en masa o resolverse editando el nombre y apodo directamente en la tabla.

## Exportar Pilotos

Race Coordinator AI le permite exportar sus pilotos a un paquete ZIP portátil que puede importarse en cualquier otra computadora con Race Coordinator AI o usarse para edición masiva en hojas de cálculo.

### Selección del Formato de Exportación

Al hacer clic en **Exportar Pilotos** en la barra de herramientas, puede elegir entre tres formatos:
- **CSV (`.csv`)**: Formato separado por comas, idóneo para hojas de cálculo o editores de texto.
- **Excel (`.xlsx`)**: Formato de libro de Microsoft Excel con encabezados con estilo y filas de datos formateadas.
- **JSON (`.json`)**: Matriz JSON formateada con objetos completos de perfil de piloto y configuración de audio.

### Ordenación lógica y exportación de etiquetas

- **Ordenación lógica**: En todos los formatos de exportación (CSV, Excel y JSON), los pilotos se ordenan de forma lógica por nombre para que los números sigan un orden natural (por ejemplo, `Piloto 9` precede a `Piloto 10`).
- **Columnas dedicadas para etiquetas**: Cada etiqueta de piloto disponible en el sistema se exporta en su propia columna (`Label 1`, `Label 2`, `Label 3`, etc.), ordenada lógicamente por nombre. Si un piloto tiene asignada la etiqueta, la celda contendrá su nombre; de lo contrario, permanecerá vacía.
- **Etiquetas en JSON**: En exportaciones JSON, cada piloto incluye un arreglo `labels` con los nombres de las etiquetas asignadas, así como propiedades individuales `label1`, `label2`, etc.
- **Creación automática de etiquetas al importar**: Al importar pilotos desde cualquier formato, las columnas `Label 1..N`, `labels` (lista separada por comas) o las que coincidan con nombres de etiquetas existentes se reconocen automáticamente. Las etiquetas que no existan en la base de datos se crearán y asignarán de forma automática al confirmar la importación, asignándoles colores aleatorios para distinguirlas de las etiquetas existentes y de otras etiquetas nuevas importadas.

### Empaquetado de Audio y Archivos Multimedia

- Todos los archivos de audio y avatares personalizados referenciados por los pilotos exportados se recopilan automáticamente y se empaquetan en el archivo ZIP junto con el archivo de datos (`drivers.csv`, `drivers.xlsx` o `drivers.json`).
- **Deduplicación**: Si dos o más pilotos comparten el mismo efecto de sonido o avatar, el archivo se empaqueta **solo una vez** en el archivo ZIP. Las referencias relativas en el archivo de datos apuntan al nombre de recurso compartido.
- **Valores predeterminados y TTS preservados**: Los sonidos preestablecidos del sistema (ej. `default_beep`), las ranuras silenciadas y los avisos de texto a voz (TTS) se conservan en el archivo exportado.
- **Listo para reimportar**: El archivo ZIP resultante está inmediatamente listo para arrastrarse y soltarse en el cuadro de diálogo **Importar Pilotos** en cualquier equipo.
