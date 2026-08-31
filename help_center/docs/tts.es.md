# Interpolación de variables de texto a voz (TTS)

Race Coordinator AI admite la sustitución dinámica de variables en cadenas de texto a voz para anuncios de audio personalizados de pilotos, tiempos de vuelta y estadísticas.

## Sintaxis

Las variables TTS admiten llaves simples o dobles: `{variable.path}` o `{{variable.path}}`.

La interpolación **no distingue entre mayúsculas y minúsculas** (p. ej., `{driver.lastLapTime}` y `{DRIVER.LASTLAPTIME}`). También se admiten espacios dentro de las llaves (p. ej., `{{ driver.nickname }}`).

## Variables disponibles

Las siguientes variables están disponibles en el contexto TTS:

| Ruta de variable | Descripción |
| :--- | :--- |
| `{driver.name}` | Nombre completo del piloto. |
| `{driver.nickname}` | Apodo del piloto (utiliza el nombre si no está definido). |
| `{driver.lastLapTime}` | Tiempo de la última vuelta completada. |
| `{driver.bestLapTime}` | Mejor vuelta del piloto en la manga actual. |
| `{driver.averageLapTime}` | Tiempo promedio de vuelta del piloto en la manga. |
| `{driver.lapCount}` | Número total de vueltas completadas en la manga. |

## Reglas de formato

*   **Enteros**: Se pronuncian tal cual.
*   **Decimales**: Se redondean y formatean automáticamente a **3 decimales**.
