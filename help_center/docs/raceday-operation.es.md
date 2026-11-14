# Operación en el Día de Carrera

## Inicio y Pausa de Carreras

Durante el día de carrera, las operaciones en pista transitan por estados automatizados gestionados por el director de carrera mediante teclas de acceso rápido, la barra de herramientas o pulsadores de pista:

### Inicio de Mangas
- **Parrilla y Cuenta Regresiva**: Al iniciar una manga, Race Coordinator AI activa una cuenta atrás automatizada (configurada en las opciones de Auto Inicio o Retardo de Inicio del editor). Tonos acústicos y semáforos visuales preparan a los pilotos.
- **Bandera Verde**: Al llegar a cero, se enciende la corriente en la pista y la carrera entra en estado `Racing`.
- **Tiempo de Reacción**: Si "Iniciar detrás del sensor" está activado, el primer paso por el sensor registra el tiempo de reacción en la salida en vez de una vuelta completa.

### Pausas y Banderas Amarillas
- **Activación de Pausa**: Pulsando la barra espaciadora, haciendo clic en el icono de **Pausa** o accionando un pulsador externo de parada, se declara inmediatamente bandera amarilla (`Paused`).
- **Corte Inmediato de Energía**: Los relés de corriente abren al instante para detener los coches.
- **Captura de Tiempos Parciales**: En ese mismo milisegundo, la interfaz de hardware captura el tiempo parcial transcurrido de cada coche y lo guarda en su tiempo pendiente.
- **Coches que Cruzan la Meta por Inercia (Vueltas de Deriva)**: Si un coche se aproximaba a la meta al cortarse la corriente, su impulso puede llevarlo a cruzar el sensor.
    - Si el sensor se activa dentro del **Tiempo de deriva** configurado, el paso se valida como **Vuelta de Deriva** (`isDrift: true`). Aparece la insignia **`DRIFT`** en el carril, suena el aviso urgente de audio y se acredita la vuelta al piloto.
    - Si se activa tras expirar el margen, se descarta para evitar registros accidentales de los comisarios.
    - Para más detalles, consulte [Editor de Carreras: Mecánica de Deriva y Cronometraje de Drift](race-editor.es.md#drifting-and-drift-timing).

### Reanudación de la Carrera
- **Reinicio con Bandera Verde**: Al desactivar la pausa, recomienza la cuenta atrás. Con la bandera verde, la corriente vuelve y los cronómetros de hardware inician desde cero.
- **Completar la Vuelta (Vueltas con Deriva Involucrada)**: Cuando un coche detenido en pista reanuda la marcha y cruza la meta bajo bandera verde, su tiempo de vuelta suma el parcial previo y el tiempo posterior. Es una **Vuelta con Deriva Involucrada**. Si "Excluir vueltas con derrape de los récords" está activo, la vuelta se suma a la manga pero no cuenta para récords.

## Ajustes de Vueltas y Tiempo

Los directores de carrera pueden ajustar manualmente el recuento de vueltas y los tiempos de manga de los pilotos directamente desde la pantalla de carrera para resolver incidentes en pista, fallos de detección de sensores o penalizaciones:

### Cómo abrir el diálogo de ajuste
- **Clic en celda**: Haga clic izquierdo en cualquier celda o tarjeta de **Vueltas** (`lapCount`, `physicalLapCount`) o **Tiempo Total** (`totalTime`, `overallTotalTime`) para ese carril.
- **Menú del Director de Carrera**: Abra el **Menú del Director de Carrera** y seleccione **Ajustar secciones de vuelta/tiempo** para modificar cualquier piloto en cualquier manga actual, previa o no iniciada en lote.
- **Pantallas de Resultados**: También accesible desde las pantallas de **Resultados de Manga** y **Resultados de Carrera** para editar mangas ya disputadas.

### Atajos rápidos (Vueltas)
Al hacer clic sobre una celda interactiva de vueltas:
- **`Shift + Clic Izquierdo`**: Añade +0.25 vueltas (+1/4 de vuelta) inmediatamente sin abrir el diálogo.
- **`Alt + Clic Izquierdo`**: Quita -0.25 vueltas (-1/4 de vuelta) inmediatamente sin abrir el diálogo.

### Controles del Diálogo
1. **Secciones de Vuelta**: Ingrese secciones de pista (por ejemplo, sobre 100 secciones por vuelta) para ajustar el número de vueltas. Una vista previa en vivo indica la fracción equivalente (ej. 25 secciones = 0.25 vueltas).
2. **Ajuste de Tiempo**: Ingrese segundos positivos (penalización, ej. `+5.000`) o negativos (compensación de tiempo, ej. `-2.500`) con precisión de milisegundos (`0.001s`).
3. **Vista previa de Tiempo Total**: El diálogo calcula y muestra el tiempo total ajustado del piloto en tiempo real antes de aplicar los cambios.

### Efecto en Clasificaciones y Métricas
- **Vueltas Ajustadas**: Modifica directamente la posición en clasificaciones por **Mayor Número de Vueltas** y actualiza las diferencias de vuelta (`gapLeader`, `gapPosition`). No modifica las vueltas físicas reales, la mejor vuelta, la vuelta mediana ni el ritmo promedio de vueltas físicas.
- **Tiempo Total Ajustado**: Modifica la posición en clasificaciones por **Tiempo Total Más Rápido**, actúa como desempate principal entre pilotos con las mismas vueltas, y actualiza el **Tiempo Promedio de Vuelta** ($\text{Tiempo Total Ajustado} / \text{Vueltas Físicas}$) y los márgenes de tiempo.
- **Métricas Protegidas**: La **Mejor Vuelta** y la **Vuelta Mediana** se preservan estrictamente en función de las vueltas físicas reales y nunca son modificadas por ajustes de tiempo.

---

## Operaciones de Crash and Learn {: #crash-and-learn-operations }

Cuando una carrera se disputa con **Crash and Learn (CNL)** habilitado, Race Coordinator AI rastrea las salidas de pista (accidentes), aplica límites de accidentes, asigna penalizaciones automáticas y gestiona descalificaciones en tiempo real.

### Detección de Accidentes y Botones de Pausa
- **Detección Automática de Accidentes**: Si está configurado y el tiempo de vuelta supera el umbral de **Tiempo de Accidente Automático**, el sistema detecta una salida de pista y anota un accidente al piloto.
- **Banderas Amarillas Automáticas**: Si **Pausar manga tras accidente** está activado, un accidente automático provoca una bandera amarilla inmediata y corta la corriente de la pista.
- **Múltiples Accidentes por Vuelta**: Si **Permitir múltiples accidentes por vuelta** está habilitado, un coche fuera de pista sumará un accidente adicional cada vez que transcurra el tiempo configurado sin cruzar la meta.
- **Botones de Pausa por Carril**: En pistas con botones de llamada por carril, pulsarlo pausa la manga y asigna un accidente al carril correspondiente. Pulsar otros botones durante la pausa no suma accidentes adicionales.

### Mecánica de Descalificación (DQ)
Cuando un piloto supera el **Límite Máximo de Accidentes** (por ejemplo, 4 accidentes cuando el límite es 3):
- **Bandera Negra**: El estado del carril cambia inmediatamente a bandera negra (`flag.disqualified`).
- **Corte de Corriente del Carril**: Si la pista dispone de relés por carril, la corriente de ese carril se desconecta al instante.
- **Detención de Vueltas**: Las lecturas del sensor y las vueltas se ignoran para los pilotos descalificados durante el resto de la manga.
- **Cálculo Inmediato de Segmentos Automáticos**: En carreras con cálculo de segmentos (`NoneAutoSegments` o `SingleLapAutoSegments`), los segmentos del piloto descalificado se calculan en el momento exacto de la descalificación con el método de "no permitir terminar" ($\text{timeSinceLastLap} / \text{medianLapTime}$, con límite de $0.99$).
- **Posición en la Clasificación**: Un piloto descalificado nunca puede quedar por delante de un piloto no descalificado en la manga. Si varios pilotos son descalificados, se ordenan según su puntuación ajustada por el **Porcentaje de Puntuación tras Descalificación**.

### Revisión y Ajuste de Accidentes y Penalizaciones
Los directores de carrera tienen control manual total:
- **Widgets de Contador de Accidentes**: Las columnas de carril muestran el número de accidentes de la manga actual.
- **Ajustes Manuales**: Mediante los controles o el diálogo **Ajustar Secciones de Vuelta / Tiempo**, es posible añadir o restar accidentes.
- **Reversión de Descalificación**: Si se reducen los accidentes al límite o por debajo, la descalificación se revierte de inmediato: la bandera vuelve a verde, se restaura la corriente y se recalculan las penalizaciones.
- **Visibilidad de Penalizaciones**: Las vueltas y tiempo de penalización se muestran en el diálogo junto a los campos de ajuste.
