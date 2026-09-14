# Editor de Carreras

## Ajustes de combustible

Race Coordinator AI admite simulaciones integrales de combustible para pistas analógicas y digitales, incluyendo capacidad de combustible personalizable, nivel inicial, demoras en paradas en boxes, tasas de repostaje, penalizaciones por quedarse sin combustible y modelos de consumo de combustible.

### Modelos de consumo de combustible

El consumo de combustible por vuelta (analógico) o por segundo (digital) se puede regir por valores predeterminados matemáticos o por un perfil personalizado interactivo:

- **Lineal**: El consumo de combustible escala linealmente con la velocidad o la posición del gatillo.
- **Cuadrático**: El consumo de combustible aumenta cuadráticamente en tiempos de vuelta más rápidos o niveles de aceleración más altos.
- **Cúbico**: El consumo de combustible aumenta pronunciadamente en condiciones de velocidad extrema y acelerador a fondo.
- **Curva personalizada**: Permite un control detallado sobre la curva de consumo arrastrando puntos de control interactivos directamente en el gráfico de uso.

### Edición interactiva de curvas personalizadas

Cuando se selecciona **Curva personalizada** como tipo de consumo, los controles aparecen directamente sobre la curva SVG:

- **Generación inicial de la curva**: Al cambiar por primera vez a Curva personalizada, los 5 puntos iniciales se muestrean directamente del ajuste activo (Lineal, Cuadrático o Cúbico) sin saltos visuales.
- **Arrastrar y soltar interactivo**: Haga clic y arrastre cualquier punto hacia arriba, abajo, izquierda o derecha para remodelar la curva.
- **Monotonía forzada**:
    - *Combustible analógico*: Las vueltas más rápidas siempre consumen más o igual combustible que las más lentas (curva monótona no creciente). El arrastre está restringido para que los puntos no se inviertan.
    - *Combustible digital*: Los niveles más altos de aceleración siempre consumen más o igual combustible que los más bajos (curva monótona no decreciente).
- **Añadir puntos**: Haga clic en la línea de la curva para insertar un nuevo punto de control en la posición interpolada exacta.
- **Eliminar puntos**: Haga clic con el botón derecho en un punto de control intermedio para eliminarlo (se preservan al menos los 2 puntos finales).
- **Botones de restablecimiento**: Restablezca rápidamente la curva personalizada a las plantillas Lineal, Cuadrática o Cúbica mediante los botones de la barra superior.
- **Persistencia en segundo plano**: Si cambia de Curva personalizada a un ajuste predeterminado y luego regresa, sus puntos personalizados se preservan en segundo plano.
- **Cálculos autorizados en el servidor**: El servidor evalúa el consumo durante las carreras utilizando el mismo algoritmo de interpolación lineal por tramos, garantizando que la vista previa sea idéntica a la carrera real.
