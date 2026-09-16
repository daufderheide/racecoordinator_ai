# Editor de Carreras

## Ajustes de combustible

Race Coordinator AI admite simulaciones integrales de combustible para pistas analógicas y digitales, incluyendo capacidad de combustible personalizable, nivel inicial, demoras en paradas en boxes, tasas de repostaje, penalizaciones por quedarse sin combustible y modelos de consumo de combustible.

### Compatibilidad de pistas y selección del sistema de combustible

El editor de carreras ofrece dos secciones dedicadas a la configuración de combustible: **Combustible analógico** y **Combustible digital**. El sistema disponible y activo se determina automáticamente según la pista seleccionada para la carrera:

- **Pistas analógicas**: Pistas tradicionales de slot donde los coches reciben energía directamente a través de los raíles del carril, sin decodificadores digitales ni telemetría del vehículo a la pista. Cuando se selecciona una pista analógica, la sección **Combustible analógico** queda habilitada y la sección **Combustible digital** se desactiva automáticamente.
- **Pistas digitales**: Sistemas digitales de slot (como Carrera Digital, Scalextric Digital, Scorpius u oXigen) donde la interfaz transmite telemetría digital (identificador del coche, porcentaje de acelerador, sensores de línea de boxes). Cuando se selecciona una pista digital, la sección **Combustible digital** queda habilitada y la sección **Combustible analógico** se desactiva automáticamente.

---

### Simulación de combustible analógico

El combustible analógico simula el consumo **por vuelta**. Dado que las pistas analógicas detectan los coches al cruzar los sensores de cronometraje de meta, el combustible se calcula y descuenta cada vez que se completa una vuelta.

#### Opciones de configuración

- **Habilitar combustible analógico**: Interruptor principal del seguimiento analógico. Si está desmarcado, la simulación se deshabilita para la carrera y los coches compiten sin restricciones de combustible.
- **Tipo de consumo de combustible**: Determina la curva matemática empleada para calcular el consumo según el ritmo de vuelta:
    - **Lineal**: El consumo escala linealmente con el tiempo de vuelta. Las vueltas más rápidas queman más combustible, mientras que las vueltas el doble de lentas consumen la mitad del combustible base.
    - **Cuadrático**: El consumo escala con el inverso del cuadrado del tiempo de vuelta, penalizando intensamente las vueltas muy rápidas.
    - **Cúbico**: El consumo aumenta vertiginosamente en vueltas rápidas, castigando drásticamente a los pilotos que arriesgan en busca de vueltas récord.
    - **Curva personalizada**: Permite moldear de forma interactiva y punto a punto la curva de consumo directamente en el gráfico SVG.
- **Tasa de consumo**: Unidades base de combustible consumidas por vuelta cuando un piloto iguala el **Tiempo de referencia**.
- **Tiempo de referencia (s)**: El tiempo de vuelta de referencia base para la pista y categoría del coche (en segundos).
    - Las vueltas más rápidas (por debajo del tiempo de referencia) queman más combustible.
    - Las vueltas más lentas (por encima del tiempo de referencia) queman menos combustible.
    - El rango activo de cálculo abarca desde $0,5 \times \text{Tiempo de referencia}$ hasta $1,5 \times \text{Tiempo de referencia}$.
- **Capacidad**: El volumen total del depósito de combustible en unidades arbitrarias (por ejemplo, 100).
- **Nivel inicial (%)**: Porcentaje de capacidad disponible en el depósito al comenzar una tanda (por ejemplo, 100 % para depósito lleno, o menos en tandas de sprint o hándicap).
- **Tasa de repostaje (%/s)**: Velocidad de repostaje durante una parada en boxes, expresada como el porcentaje de la capacidad total del depósito repuesto por segundo.
- **Demora en parada en boxes (s)**: Tiempo obligatorio de espera estacionaria en segundos antes de que comience el repostaje una vez que el coche entra en boxes.
- **Restablecer combustible al inicio de la tanda**:
    - **Marcado**: El nivel de combustible de cada piloto se restablece al **Nivel inicial** configurado al comenzar cada tanda.
    - **Desmarcado**: El combustible restante se transfiere entre tandas a lo largo de las rotaciones, exigiendo una gestión estratégica a lo largo de toda la carrera.
- **Acción al quedarse sin combustible**: Penalización impuesta cuando el nivel de combustible llega a 0:
    - **No contar vueltas**: El coche continúa rodando con corriente, pero las vueltas completadas con el depósito vacío no se contabilizan hasta que entre en boxes y reposte.
    - **Finalizar tanda**: La tanda termina de inmediato para ese coche, se corta la corriente del carril y el piloto se marca como finalizado.
    - **Tartamudeo de potencia (Power Stutter)**: Simula fallos del motor sin combustible encendiendo y apagando rápidamente la corriente del carril.
        - *Requiere relés por carril*: Solo se puede seleccionar si la interfaz de pista dispone de relés individuales de control de corriente por carril.
        - **Tiempo encendido (s)**: Duración durante la cual se mantiene la corriente en cada pulso.
        - **Tiempo apagado (s)**: Duración durante la cual se interrumpe la corriente en cada pulso.

#### Paradas en boxes y tiempo de carrera en combustible analógico

Para evitar que el tiempo detenido en boxes se interprete como una vuelta anormalmente lenta (lo que reduciría erróneamente el consumo calculado), Race Coordinator AI contabiliza el **tiempo acumulado de repostaje**. Todo el tiempo estacionado en el carril de boxes se descuenta de la duración de la vuelta antes de calcular el combustible:

$$\text{Tiempo de carrera} = \text{Tiempo de vuelta} - \text{Tiempo acumulado de repostaje}$$

#### Vistas previas gráficas (Analógico)

- **Comparación simultánea multimodelo**: Los 3 modelos matemáticos predefinidos (**Lineal**, **Cuadrático** y **Cúbico**) se representan simultáneamente en ambos gráficos. El tipo seleccionado se resalta en negrita con un brillo distintivo, mientras que los otros modelos permanecen visibles como líneas de referencia atenuadas (~40 % de opacidad).
- **Consumo de combustible por vuelta**: Muestra las unidades exactas consumidas en el espectro de tiempos de vuelta ($0,5 \times \text{ref}$ a $1,5 \times \text{ref}$). En modo Curva personalizada, los nodos interactivos y botones de restablecimiento permiten moldear la curva al instante mientras los 3 modelos base continúan visibles para referencia.
- **Tiempo hasta parada en boxes**: Estima el tiempo total de carrera (o vueltas) antes de vaciar el depósito a un ritmo de vuelta constante en todos los modelos.
- **Leyenda interactiva y visibilidad**: Haga clic izquierdo en cualquier curva de la leyenda para activarla o desactivarla. Al ocultar una curva se reajustan dinámicamente las escalas de los ejes para examinar con mayor detalle las curvas restantes.
- **Tarjetas flotantes comparativas**: Al pasar el ratón por los gráficos se muestra la telemetría comparativa de todas las curvas visibles en el punto examinado, con muestras de color, valores y el indicador `(Activo)` en el modelo seleccionado.

---

### Simulación de combustible digital

El combustible digital simula el consumo **continuamente en tiempo real** en función de la telemetría de aceleración transmitida por mandos y decodificadores digitales.

#### Consumo continuo impulsado por acelerador

A diferencia del analógico (que calcula el combustible en la línea de meta), el digital recalcula el consumo en cada paquete de telemetría recibido:

$$\text{Combustible consumido} = \text{Uso por segundo} \times \Delta t$$

Los pilotos que conducen con suavidad o levantan el gatillo en curvas consumen mucho menos combustible que quienes aceleran a fondo en las rectas.

#### Opciones de configuración

- **Habilitar combustible digital**: Interruptor principal del seguimiento digital.
- **Tipo de consumo de combustible**: Modelo matemático aplicado a la aceleración ($0\,\%$ a $100\,\%$):
    - **Lineal**: El consumo escala en proporción directa a la posición del acelerador.
    - **Cuadrático**: El consumo crece con moderación a medio gas y se acelera hacia el acelerador a fondo.
    - **Cúbico**: Las aceleraciones máximas consumen exponencialmente más combustible que la conducción a medio gas.
    - **Curva personalizada**: Permite personalizar la curva de respuesta acelerador-consumo entre 0 % y 100 % de gas.
- **Tasa de consumo**: Unidades máximas de combustible consumidas por segundo al **100 % de aceleración**.
- **Capacidad**, **Nivel inicial (%)**, **Tasa de repostaje (%/s)**, **Demora en parada en boxes (s)**, **Restablecer combustible al inicio de la tanda**: Funcionamiento análogo a la configuración analógica.
- **Acción al quedarse sin combustible**:
    - **No contar vueltas**: El coche permanece operativo, pero las vueltas completadas sin combustible no se registran.
    - **Finalizar tanda**: El piloto queda fuera de la tanda en cuanto agota el combustible.

#### Vistas previas gráficas (Digital)

- **Comparación simultánea multimodelo**: Representa simultáneamente las curvas de respuesta lineal, cuadrática y cúbica con el modelo seleccionado resaltado y los otros modelos visibles como referencia de fondo.
- **Consumo de combustible digital**: Traza el porcentaje de acelerador ($0\,\%$ a $100\,\%$) frente al consumo por segundo para todos los modelos.
- **Tiempo hasta vaciar**: Traza el porcentaje de acelerador frente a los segundos continuos de conducción hasta agotar el depósito por completo.
- **Leyenda interactiva y escala dinámica**: Active o desactive curvas individuales haciendo clic en la leyenda, ajustando automáticamente la escala de los ejes.
- **Tarjetas flotantes comparativas**: Al recorrer el gráfico con el cursor se muestran los valores en tiempo real de cada curva visible para esa posición del acelerador.

---

### Edición interactiva de curvas personalizadas

Cuando se selecciona **Curva personalizada** como tipo de consumo (tanto en combustible analógico como digital), los controles interactivos aparecen directamente sobre la curva SVG:

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
