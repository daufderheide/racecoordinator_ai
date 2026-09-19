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
  - Elija la dirección (**Horizontal** lado a lado o **Vertical** apilado), la cantidad total de carriles/posiciones destino (2 a 8), el modo de espaciado (**Ajustar al Lienzo** o **Preservar Espaciado**) y opcionalmente reemplazar los widgets existentes.
  - El editor de diseño duplica, reposiciona, renumera y vincula automáticamente las tarjetas en todos los carriles o posiciones seleccionados con un solo clic.

