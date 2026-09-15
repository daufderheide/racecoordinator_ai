# Editor de Interfaz

## Descripción general

El Editor de Interfaz le permite diseñar diseños de pantalla personalizados para el día de la carrera, configurar columnas de clasificación de pilotos, personalizar efectos de sonido y gráficos de temas y cargar [Widgets personalizados](custom-widgets.md) modulares.

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
- **Vista previa**: El inspector incluye una vista previa en tiempo real que demuestra cómo se muestran las opciones seleccionadas en distintos puntos de la carrera (`> 1 hr`, `> 1 min`, `< 1 min` y `< 10s`).
