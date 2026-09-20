# Gestor de Activos

El **Gestor de Activos** le permite cargar, organizar y gestionar todos sus activos digitales de carrera, incluidos archivos de audio, imágenes personalizadas, conjuntos de imágenes y esquemas de rotación.

## Descripción general

Los activos son recursos personalizados utilizados en toda la aplicación para personalizar la experiencia de carrera:

- **Archivos de sonido:** Avisos de audio personalizados, tonos de inicio, bocinas de llegada y clips de comentarios.
- **Conjuntos de audio:** Colecciones agrupadas de archivos de audio o locuciones de texto a voz (TTS) asignadas a valores de activación específicos (tiempo en segundos, vueltas restantes o porcentaje de combustible).
- **Imágenes:** Gráficos de coches, avatares de pilotos, banderas personalizadas, logotipos de patrocinadores e imágenes de fondo.
- **Conjuntos de imágenes:** Colecciones de imágenes relacionadas (como indicadores de combustible o secuencias de cuenta regresiva).
- **Rotaciones personalizadas:** Activos de rotación de mangas definidos por el usuario para formatos de rotación complejos.

## Subir Activos

Para cargar nuevos activos en su biblioteca:

1. Abra el **Gestor de Activos** desde el menú principal o la barra de herramientas de configuración.
2. Arrastre y suelte uno o varios archivos en la sección **Subir Activos**, o haga clic para explorar su equipo.
3. Los formatos admitidos incluyen `.wav`, `.mp3`, `.ogg` para audio, y `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` para imágenes.

## Conjuntos de Audio y Valores de Activación

Un **Conjunto de Audio** le permite configurar una serie de sonidos o frases habladas activadas en umbrales numéricos específicos. Según dónde se asigne el conjunto de audio en Race Coordinator AI, los valores representan diferentes unidades:

*   **Tiempo en Segundos:** Se utiliza en los ajustes de Tema para **Cuenta regresiva de salida**, **Segundos restantes**, **Inicio automático** y **Avance automático** (por ejemplo, entradas en `5`, `4`, `3`, `2`, `1` y `0` segundos).
*   **Conteo de Vueltas:** Se utiliza en los ajustes de Tema para avisos de **Vueltas restantes**. Las entradas definen avisos cuando el líder alcanza cantidades específicas de vueltas restantes (por ejemplo, `10`, `5`, `1` y `0` vueltas restantes).
*   **Porcentaje de Combustible (%):** Se utiliza en los ajustes de Piloto para **Sonidos de nivel de combustible**. Las entradas definen avisos cuando el combustible alcanza umbrales de advertencia, críticos o lleno (por ejemplo, `20%`, `10%`, `0%` vacío o `100%` lleno).

En el **Editor de Conjuntos de Audio**, puede añadir entradas, seleccionar archivos de audio o escribir frases TTS (con variables de plantilla como `{driver.nickname}`), definir valores de activación y utilizar el botón **Extraer valores automáticamente de los nombres** para autocompletar valores a partir de nombres numerados (por ejemplo, `10.mp3`, `5.mp3`).

### Modos de activación duales: Restante vs. Transcurrido

Cada entrada de un Conjunto de Audio se puede configurar con un **Modo de activación**:

*   **Restante (Cuenta regresiva):** Se activa cuando la carrera se aproxima a cero o a la meta (por ejemplo, cuando quedan 10 vueltas o 30 segundos restantes en la manga). Este es el modo predeterminado para cuentas regresivas.
*   **Transcurrido (Conteo ascendente):** Se activa cuando la carrera progresa hacia adelante desde el inicio (por ejemplo, cuando el líder completa 10 vueltas o tras 30 segundos transcurridos en la manga).

#### Señales duales con el mismo valor numérico
Race Coordinator AI permite configurar dos entradas con exactamente el mismo valor numérico (por ejemplo, valor `10`):
- Una entrada configurada como **Transcurrido** sonará cuando el líder alcance ese hito inicial (por ejemplo, al completar 10 vueltas).
- Otra entrada configurada como **Restante** sonará a medida que la carrera se acerque al final (por ejemplo, cuando queden 10 vueltas).

#### Vista previa de progresión natural de carrera
Al previsualizar o reproducir automáticamente un Conjunto de Audio en el Gestor de Activos o en el Selector de Audio, los sonidos se reproducen en el orden cronológico de carrera:
1. Todas las entradas **Transcurrido** suenan primero en orden ascendente (0 → N).
2. Todas las entradas **Restante** suenan a continuación en orden descendente de cuenta regresiva (N → 0).
