# Interpolación de Variables en Texto a Voz (TTS)

Race Coordinator AI permite la sustitución dinámica de variables en cadenas de texto a voz para generar avisos auditivos personalizados sobre pilotos, tiempos y estadísticas.

## Sintaxis

Las variables TTS admiten una sintaxis unificada entre llaves: `{variable.path}` o `${variable.path}`. Esta sintaxis coincide con la utilizada en las **Plantillas de Exportación de Excel** y los **Widgets Personalizados de Interfaz**.

La interpolación **no distingue entre mayúsculas y minúsculas** (por ejemplo, `{driver.lastLapTime}` y `{DRIVER.LASTLAPTIME}`). También se admiten espacios dentro de las llaves (ej. `{ driver.nickname }` o `${ driver.nickname }`).

## Variables Disponibles

| Ruta de Variable | Descripción |
| :--- | :--- |
| `{driver.name}` | Nombre completo del piloto. |
| `{driver.nickname}` | Apodo del piloto (usa el nombre si no está definido). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Total de vueltas completadas por el piloto. |
| `{driver.totalTime}` | Tiempo total transcurrido de carrera en segundos. |
| `{driver.lastLapTime}` | Tiempo de la vuelta recién completada. |
| `{driver.bestLapTime}` | Vuelta más rápida del piloto en la manga actual. |
| `{driver.averageLapTime}` | Tiempo medio por vuelta del piloto en la manga. |
| `{driver.medianLapTime}` | Mediana de tiempos por vuelta del piloto en la manga. |
| `{driver.gapLeader}` | Diferencia de tiempo con el líder en segundos. |
| `{driver.gapPosition}` | Diferencia de tiempo con el piloto precedente en segundos. |
| `{race.name}` | Nombre del evento de carrera activo. |
| `{track.name}` | Nombre de la pista actual. |
| `{heat.number}` | Número de la manga activa. |

## Reglas de Formato

### Números
*   **Enteros**: Se pronuncian directamente (ej. `10`).
*   **Decimales**: Se redondean automáticamente a **3 decimales** (ej. `5.432`).

## Integración con el Sistema de Audio

Las locuciones TTS se gestionan mediante el [Sistema de Audio](audio.md) centralizado:

*   **Voz, Velocidad y Tono**: Configure su voz preferida, velocidad (`0.1x`–`2.0x`), tono y volumen en el panel **Editor de Interfaz -> Configuración de Audio**.
*   **Niveles de Prioridad**: Los avisos urgentes (como bandera amarilla o fin de manga) tienen prioridad sobre comentarios rutinarios, evitando solapamientos.
*   **Relevancia de Audio**: En puestos de piloto y pantallas secundarias, las locuciones TTS se filtran para que cada competidor solo escuche los anuncios pertinentes a su carril.

## Navegadores Móviles y Estaciones de Pilotos

Al visualizar una estación de piloto o pantalla de día de carrera en un teléfono móvil o tableta (por ejemplo, escaneando el código QR de la estación de piloto con un iPhone o dispositivo Android):

*   **Activación con el primer toque**: Los sistemas operativos móviles (iOS y Android) requieren una interacción física con la pantalla antes de permitir la reproducción de audio web o texto a voz. Toca la pantalla una vez (o toca el mensaje **Toca la pantalla para activar el audio**) al abrir la página. Una vez activado, Race Coordinator AI mantiene una sesión de audio activa para que solo tengas que tocar una vez y recibir anuncios continuos de TTS durante toda la carrera.
*   **Interruptor de silencio físico (iOS / iPhone)**: Los iPhone enrutan Web Speech a través del canal de audio ambiental del dispositivo. Si tu iPhone tiene un interruptor físico de Timbre/Silencio, asegúrate de que esté desactivado (no en modo silencio), o la salida de voz se silenciará.
