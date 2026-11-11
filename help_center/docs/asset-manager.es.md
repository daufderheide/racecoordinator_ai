# Gestor de Recursos

## Descripción general {: #overview }

El **Gestor de Recursos** le permite cargar, organizar y administrar todos sus recursos digitales de carrera, incluidos archivos de audio, imágenes personalizadas, series de imágenes y esquemas de rotación en Race Coordinator AI.

Los recursos son elementos personalizables que enriquecen la experiencia de carrera:

- **Archivos de sonido:** Avisos de audio, pitidos de salida, bocinas de meta y comentarios.
- **Conjuntos de audio:** Colecciones agrupadas de archivos de audio o frases de texto a voz (TTS) asignadas a umbrales específicos (segundos restantes, vueltas restantes o porcentaje de combustible).
- **Imágenes:** Gráficos de coches, avatares de pilotos, banderas personalizadas, logotipos y fondos.
- **Series de imágenes:** Colecciones de fotogramas secuenciales para animaciones (como indicadores de combustible o luces de salida).
- **Rotaciones personalizadas:** Esquemas de rotación de mangas definidos por el usuario para formatos de carrera específicos.

---

## Agregar recursos {: #adding-assets }

El panel izquierdo del Gestor de Recursos proporciona cuatro controles para agregar recursos a su biblioteca de forma individual o por lotes:

1. **Zona de carga (Drop Zone):** Arrastre y suelte archivos directamente en el área punteada o haga clic para abrir el explorador de archivos. Puede subir varios archivos a la vez.
   - Formatos de imagen compatibles: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Formatos de audio compatibles: `.wav`, `.mp3`, `.ogg`.
2. **Nuevo conjunto de imágenes:** Abre el Editor de series de imágenes para agrupar fotogramas en animaciones e indicadores de estado.
3. **Nuevo conjunto de audio:** Abre el Editor de conjuntos de audio para crear secuencias sonoras activadas por temporizadores, vueltas restantes o niveles de combustible.
4. **Nueva rotación personalizada:** Abre el Editor de rotaciones personalizadas para diseñar esquemas avanzados de alternancia de carriles.

---

## Biblioteca de recursos y acciones {: #asset-library }

El panel principal de la biblioteca muestra todos los recursos visuales y de audio almacenados en la base de datos.

Al pasar el cursor sobre cualquier tarjeta de recurso se revelan acciones rápidas:
- **Reproducción de audio:** Haga clic en el botón de reproducción en tarjetas de sonido para previsualizar el audio directamente sin abrir ningún editor.
- **Vista previa de imagen:** Muestra imágenes a resolución completa y la secuencia de fotogramas de series de imágenes.
- **Renombrar en línea:** Haga clic sobre el nombre del recurso para renombrarlo al instante directamente en la cuadrícula.
- **Eliminar recurso:** Haga clic en el icono de papelera para eliminar recursos innecesarios de la base de datos.

También puede hacer clic sobre los recursos para seleccionarlos. Con elementos seleccionados, la barra de herramientas superior permite realizar ediciones y eliminaciones por lotes.

---

## Filtrado y opciones de visualización {: #filter-tabs }

El Gestor de Recursos incluye controles superiores para localizar y organizar recursos fácilmente:

- **Pestañas de filtro:** Filtre rápidamente la biblioteca por tipo de recurso (la pestaña seleccionada se guarda y se restaura automáticamente al volver al Gestor de recursos):
  - **Todos:** Muestra cada uno de los recursos almacenados.
  - **Imágenes:** Archivos estáticos individuales (`.png`, `.jpg`, `.svg`, etc.).
  - **Conjuntos de imágenes:** Secuencias agrupadas de imágenes y medidores de combustible.
  - **Sonidos:** Clips de audio individuales (`.wav`, `.mp3`, `.ogg`).
  - **Conjuntos de audio:** Colecciones sonoras vinculadas a umbrales numéricos.
  - **Rotaciones personalizadas:** Esquemas de rotación de pistas de mangas.
- **Selector de diseño:** Alterne entre **Vista de lista**, **Miniaturas pequeñas**, **Miniaturas medianas** y **Miniaturas grandes**.
- **Filtrar por nombre:** Campo de búsqueda en tiempo real que filtra la lista al instante mientras escribe.

---

## Conjuntos de audio y valores de activación

Un **Conjunto de audio** le permite programar una serie de sonidos o locuciones activadas en umbrales numéricos concretos:

*   **Tiempo en segundos:** Utilizado en temas para avisos de **Cuenta regresiva**, **Segundos restantes**, **Inicio automático** y **Paso automático**.
*   **Conteo de vueltas:** Utilizado en temas para avisos de **Vueltas restantes** del líder.
*   **Porcentaje de combustible (%):** Utilizado en perfiles de pilotos para **Sonidos de nivel de combustible** (ej. `20%`, `10%`, `0%` o `100%`).

### Modos duales: Restante vs. Transcurrido

Cada entrada de un conjunto de audio puede configurarse con un **Modo de activación**:
*   **Restante (Cuenta atrás):** Se activa cuando la carrera se aproxima a cero o al final de la manga.
*   **Transcurrido (Cuenta progresiva):** Se activa a medida que la carrera avanza desde el inicio.

---

## Uso de recursos en temas y diseños de interfaz

Una vez subidos o creados, sus recursos quedan disponibles al instante en toda la aplicación:

- Seleccione efectos de sonido en el [Editor de temas](themes.es.md) para vueltas rápidas, cambios de líder y fanfarrias finales.
- Asigne gráficos en el [Editor de pilotos](driver-editor.es.md) para fotos de coches y avatares.
- Configure indicadores visuales en el [Editor de diseño](layout-editor.es.md).
- Vincule archivos de rotación en el [Editor de carreras](race-editor.es.md).
