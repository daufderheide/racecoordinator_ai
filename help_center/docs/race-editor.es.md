# Editor de Carreras

El **Editor de carreras** le permite crear, personalizar y administrar configuraciones de carrera. Aquí puede configurar reglas de puntuación, rotaciones de tandas, simulaciones de combustible y opciones de carrera.

---

## Descripción General y Autoguardado

El Editor de Carreras ofrece una interfaz unificada para seleccionar, visualizar, configurar y probar sus formatos de carrera:

- **Selector de Carrera**: Ubicado en el encabezado superior junto al título de la página, este menú desplegable enumera todas las carreras configuradas y le permite cambiar rápidamente entre ellas.
- **Modo de Solo Lectura**: De forma predeterminada, al abrir el editor se muestran las propiedades de la carrera, reglas de puntuación y opciones de configuración en modo de solo lectura. Los campos de formulario están bloqueados para evitar cambios accidentales, mientras que los acordeones y vistas previas de mangas permanecen interactivos.
- **Modo de Edición**: Al hacer clic en el icono **Editar** (lápiz) de la barra de herramientas se desbloquean todos los controles. Durante la edición, el selector de carrera está bloqueado.
- **Autoguardado Continuo**: Todas las modificaciones se guardan automáticamente en segundo plano en el servidor sin salir del modo de edición.
- **Salir del Modo de Edición**: Al hacer clic en el icono **Listo** (marca de verificación) se validan los cambios y se regresa al modo de solo lectura.
- **Descartar Cambios**: Al hacer clic en Descartar se revierten todos los cambios a la última versión guardada y se sale del modo de edición.

El espacio de trabajo se divide en dos paneles sincronizados:

- **Panel Izquierdo (Configuración de Carrera)**: Propiedades generales, formato de carrera, métodos de puntuación, tipo de rotación, opciones de grupo y simulación de combustible analógico/digital.
- **Panel Derecho (Vista Previa de Mangas en Vivo)**: Genera dinámicamente la lista completa de mangas según la rotación activa y el número de pilotos.

---

---

## Configuración de carrera {: #race-setup }

El panel izquierdo configura el formato básico y la pista asociada para su carrera:

- **Nombre de carrera**: Nombre único para identificar el formato de carrera el día de la carrera y en estadísticas.
- **Pista**: La pista física asignada a esta carrera. Determina la disponibilidad de simulación de combustible analógico o digital.
- **Tema**: Tema visual de la interfaz aplicado a la pantalla de carrera.
- **Formato de rotación de tandas**: Elija entre rotaciones estándar (**Round Robin**, **Escalera**, **Torneo**) o secuencias personalizadas.
- **Pasadas por tanda**: Especifica cuántas veces cada piloto completa la rotación entera de tandas.
- **Tandas invertidas**: Invierte el orden de las tandas para que los pilotos compitan en sentido inverso.
- **Vista previa de número de pilotos**: Previsualiza dinámicamente la lista de tandas según el número de pilotos configurado.

El panel derecho muestra la **Vista previa de tandas en vivo**, generando dinámicamente la lista completa de tandas, rotaciones de pilotos y carriles en tiempo real a medida que ajusta la configuración.

---

## Pestañas de navegación {: #navigation-tabs }

La barra de pestañas superior proporciona accesos directos de un clic para saltar directamente a cada sección de configuración:

- **General**: Temas, locuciones de voz, filtros de tiempo de vuelta y preferencias de interfaz.
- **Tandas**: Tiempos de inicio y avance automático, repeticiones de tandas y orden inverso.
- **Puntuación**: Métodos de clasificación de tandas y general, condiciones de finalización, desempates y mangas descartadas.
- **Grupos**: Separación de pilotos en grupos, rotaciones independientes y promoción en la clasificación.
- **Método de salida**: Tiempos de salida y reinicio, posición de salida en pista, salidas lanzadas y penalizaciones por salida falsa.
- **Opciones de equipo**: Resistencia por equipos, relevos de pilotos y límites de turnos.
- **Combustible analógico**: Consumo por vuelta, capacidad del depósito y tasas de repostaje.
- **Combustible digital**: Consumo continuo basado en aceleración y curvas personalizadas.
- **Puntos de temporada**: Tabla de puntos del campeonato, puntos por tanda y puntos de bonificación.

Al hacer clic en una pestaña, se desplaza inmediatamente a esa sección del acordeón y la expande.

---

## Ajustes generales {: #general-settings }

El expansor de Ajustes generales controla la presentación, los filtros de tiempo y el comportamiento del director de carrera:

- **Selección de tema**: Asigne esquemas de color y distribuciones de marcadores personalizadas.
- **Locuciones de voz**: Habilite avisos de voz automáticos para cambios de líder, vueltas rápidas, paradas en boxes y finales.
- **Tiempo mínimo de vuelta (s)**: Tiempo mínimo permitido para filtrar fallos eléctricos o falsos sensores.
- **Tiempo de deslizamiento (s)**: Ventana de detección para gestionar coches derrapando sobre la línea de meta.
- **Excluir vueltas con derrape de los récords**: Cuando está activado, las vueltas completadas con derrape se excluyen de los récords de carrera, manga y piloto.
- **Reglas de bandera amarilla**: Pausas automáticas o manuales de bandera amarilla con corte de energía en pista.
- **Opciones de interfaz personalizada**: Tablas de clasificación y widgets de telemetría especializados.

### Mecánica de Deriva y Cronometraje de Drift {: #drifting-and-drift-timing }

En el slot racing, los coches son impulsados por voltaje eléctrico suministrado a través de rieles metálicos en la pista. Cuando la alimentación eléctrica se interrumpe (como durante una pausa por bandera amarilla, al concluir una manga o al finalizar la carrera), los coches no se detienen de forma instantánea a velocidad cero. Debido a la inercia física, la masa, los imanes del motor y la fricción de la pista, los coches continúan rodando hacia adelante por inercia residual tras cortarse la corriente.

En Race Coordinator AI y en la jerga de slot cars, este desplazamiento por inercia sin corriente se denomina **"deriva"** o **"drift"**.

!!! note "Definición de Drift en Slot Cars"
    En las carreras de slot cars, "drift" o "deriva" **no** se refiere a derrapar de lado, trompos o maniobras acrobáticas. Se refiere estrictamente al rodar por inercia hacia adelante de un coche impulsado por su movimiento residual tras haberse apagado la corriente de la pista.

Cuando un coche se aproxima a la línea de meta o al sensor justo en el instante en que se corta la corriente, su inercia hacia adelante puede llevarlo a cruzar el sensor antes de detenerse por completo. Race Coordinator AI ofrece un control de cronometraje por hardware y opciones de carrera precisas para gestionar estas situaciones con total justicia deportiva.

#### La Distinción Crucial: "Vuelta de Deriva" vs. "Vuelta con Deriva Involucrada"

Existe una distinción fundamental en Race Coordinator AI entre una **Vuelta de Deriva** (`isDrift = true`) y una **Vuelta con Deriva Involucrada** (`driftInvolved = true`):

##### 1. Una "Vuelta de Deriva" (`isDrift = true`)
Una **Vuelta de Deriva** es una vuelta que se registra y contabiliza físicamente cuando un coche cruza la línea de meta o sensor **MIENTRAS la corriente de la pista está APAGADA** (específicamente durante los estados `Paused` / bandera amarilla, `HeatOver` o `RaceOver`), dentro de la ventana de **Tiempo de deriva** configurada.

- **Evento Físico**: El coche cruza la línea por pura inercia sin corriente en la pista.
- **Indicador Visual**: La columna del carril en la pantalla principal de carrera y el diálogo de inspección de vueltas muestran una destacada insignia **`DRIFT`** junto al tiempo de vuelta.
- **Locución de Audio**: Activa el **Sonido de Vuelta de Deriva** (`driftLapAudio`) configurado para el piloto como anuncio urgente (`urgent`) de voz (ej., *"Drift lap for {driver.nickname}"*).
- **Acreditación de Vuelta**: La vuelta se suma al total de vueltas del piloto para la manga y la clasificación general. El tiempo registrado combina el tiempo parcial previo al corte de corriente con la fracción de segundo rodando sobre el sensor.
- **Estadísticas**: Incrementa el contador de vueltas de deriva en las estadísticas de la carrera (`driftLapCount`). Los segmentos parciales automáticos se restablecen.

##### 2. Una "Vuelta con Deriva Involucrada" (`driftInvolved = true`, pero `isDrift = false`)
Una **Vuelta con Deriva Involucrada** es una vuelta completada y registrada en **condiciones normales de BANDERA VERDE con corriente**, pero cuya duración total contiene un período de interrupción o tiempo arrastrado debido a una pausa en la pista o una rotación de mangas.

- **Evento Físico**: El coche cruza la línea de meta con la corriente **ENCENDIDA** en plena competición. Sin embargo, durante el transcurso de esa vuelta, la corriente fue interrumpida y posteriormente restablecida.
- **Escenarios Típicos**:
    - **Pausa y Reanudación por Bandera Amarilla en Plena Vuelta**: Un piloto lleva 3,2 segundos de una vuelta de 5,0 segundos cuando se declara bandera amarilla. Se corta la corriente y el coche se detiene por inercia en la recta opuesta (no cruza el sensor, por lo que no es una vuelta de deriva). El temporizador por hardware se congela y esos 3,2 segundos se guardan en el tiempo pendiente del piloto, marcándose internamente tiempo de deriva (`markDriftTime()`). Al reanudarse la carrera bajo bandera verde, los temporizadores se inician desde cero. El coche recorre los 1,8 segundos restantes bajo corriente y cruza la meta. El tiempo registrado es de 5,0 segundos ($3{,}2\,\text{s} + 1{,}8\,\text{s}$). Como cruzó la meta bajo bandera verde, **no es una Vuelta de Deriva** (no hay insignia `DRIFT` y suena el audio normal), pero es una **Vuelta con Deriva Involucrada** porque su transcurso fue dividido por una pausa.
    - **Salida en Posición Actual (`Start at Current`)**: En modalidades continuas donde los coches se detienen donde quedan al expirar el tiempo de la manga y reanudan en la siguiente manga desde esa misma posición física (`start_at_current = true`), el tiempo parcial incompleto de la manga anterior se traslada a la nueva manga. Cuando el piloto completa su primera vuelta bajo bandera verde, esa vuelta incorpora el tiempo de la manga previa. Es una **Vuelta con Deriva Involucrada**.

---

#### Las Dos Opciones de Configuración de Carrera

En el expansor de **Ajustes generales**, Race Coordinator AI proporciona dos opciones específicas para controlar la deriva y la validez de los récords:

```
+---------------------------------------------------------------------------------+
| Tiempo mínimo de vuelta (s): [ 2.0 ]   Tiempo de deriva (s): [ 0.5 ]            |
|                                                                                 |
| [ ] Modo de práctica   [X] Excluir vueltas con derrape de los récords           |
+---------------------------------------------------------------------------------+
```

##### Opción 1: Tiempo de deriva (`drift_time`)
- **Tipo de Ajuste**: Número decimal en segundos (ej., `0.0`, `0.5`, `1.0`, `2.0`).
- **Valor Predeterminado**: `0.5` segundos.
- **Descripción**: Define el margen de tiempo máximo inmediatamente posterior a un corte de corriente (bandera amarilla, fin de manga o fin de carrera) durante el cual el sistema aceptará el paso por el sensor como una vuelta válida por inercia.

!!! warning "Pistas sin Relés de Control de Corriente"
    Si su pista no tiene relés de hardware instalados para controlar la corriente, la pista permanece energizada durante pausas, finales de manga y fin de carrera. En estas pistas, **el Tiempo de deriva debe ajustarse a `0` (0.0s)** (sin vueltas de deriva). De lo contrario, los pilotos que continúen acelerando durante una pausa recibirían indebidamente vueltas de deriva mientras corren bajo corriente.

Al cortarse la corriente, el sistema guarda la marca de tiempo exacta. Si se detecta un sensor con la pista parada:

$$\Delta t = \text{Tiempo de Disparo} - \text{Tiempo de Parada}$$

$$\begin{aligned}
\text{Si } \Delta t \le \text{Tiempo de deriva} &\implies \textbf{Aceptada como Vuelta de Deriva } (\text{isDrift} = \text{true}) \\
\text{Si } \Delta t > \text{Tiempo de deriva} &\implies \textbf{Rechazada e ignorada}
\end{aligned}$$

- **Por qué es Esencial un Límite de Tiempo de Deriva**:
    - **Justicia Deportiva**: Un coche que estaba a centímetros de la línea de meta al llamarse la bandera merece la vuelta si su impulso lo hace cruzar instantes después.
    - **Prevención de Vueltas Falsas por Comisarios**: Sin un límite estricto, un comisario que coloque un coche salido podría empujarlo accidentalmente sobre el sensor segundos o minutos más tarde, otorgándole una vuelta indebida.
- **Recomendaciones de Ajuste**:
    - **Pistas sin Relés de Corriente**: Si su pista carece de relés para cortar la corriente, **el Tiempo de deriva debe ajustarse a `0` (0.0s)** (sin vueltas de deriva). Como la corriente nunca se interrumpe, los pilotos pueden seguir acelerando; cualquier margen de deriva mayor que cero contaría erróneamente estas vueltas como deriva.
    - **Coches con Imán (HO, 1/32 con imán)**: El frenado magnético contra los rieles de acero es muy fuerte y detiene los coches con rapidez. Recomendado: `0.3` a `0.8` segundos.
    - **Coches sin Imán / Categorías Pesadas (1/24, Pistas de Madera)**: Ruedan libres con gran inercia y avanzan distancias considerables. Recomendado: `1.0` a `2.5` segundos.
    - **Desactivado (`0.0s`)**: Desactiva totalmente las vueltas de deriva; cualquier detección con la pista parada se descarta.

##### Opción 2: Excluir vueltas con derrape de los récords (`adjust_drift_laps`)
- **Tipo de Ajuste**: Casilla de verificación (`true` / `false`).
- **Valor Predeterminado**: Desactivado (`false`).
- **Descripción**: Determina si las vueltas que hayan involucrado cualquier forma de deriva pueden optar a récords personales, de manga, de carrera o de pista.

Al completarse una vuelta, el sistema evalúa:

$$\text{driftInvolved} = \text{isDrift} \lor \text{hasDriftTime}$$

$$\text{countTowardsRecords} = \neg(\text{adjust\_drift\_laps} \land \text{driftInvolved})$$

- **Cuando está activado (`true`)**:
    - Cualquier vuelta con deriva involucrada (sea una **Vuelta de Deriva** `isDrift = true` O una **Vuelta con Deriva Involucrada** por pausa o rotación) queda descalificada para récords (`countTowardsRecords = false`).
    - Queda excluida de:
        1. **Mejor Vuelta Personal del Piloto (`bestLapTime`)**: No actualizará su mejor registro personal.
        2. **Mejor Vuelta de la Manga**: No se considerará la vuelta más rápida de la manga.
        3. **Mejor Vuelta de la Carrera**: No se considerará la vuelta más rápida de la carrera.
        4. **Récords de Pista y Carril**: No entrará en las tablas de récords históricos.
        5. **Locuciones de Récord**: Se silencian las celebraciones de vueltas rápidas o récords.
    - **Punto Crucial**: La vuelta **sigue contando al 100 % para el conteo de vueltas, la posición en la manga y la clasificación de la carrera**. Solo se le deniega el estatus de récord.
- **Cuando está desactivado (`false`)**:
    - Cualquier vuelta que cumpla con el filtro de tiempo mínimo puede registrar récords, incluso si transcurrió durante una pausa o se completó sin corriente rodando por inercia.
- **Por qué las Competiciones Activan Esta Opción**:
    - Las vueltas interrumpidas alteran las condiciones térmicas y mecánicas de motores y neumáticos. Arrancar desde parado tras una pausa no refleja el ritmo de una vuelta lanzada a fondo bajo bandera verde.
    - Cruzar la meta en deriva tampoco refleja velocidad real de carrera.
    - Esta opción garantiza que los récords históricos representen únicamente vueltas limpias, ininterrumpidas y a plena potencia.

---

#### Cuadro Comparativo de Resumen

| Característica / Comportamiento | Vuelta Normal con Bandera Verde | Vuelta de Deriva (`isDrift = true`) | Vuelta con Deriva Involucrada (`hasDriftTime = true`, `isDrift = false`) |
| :--- | :--- | :--- | :--- |
| **Corriente en Pista al Cruzar la Meta** | **ENCENDIDA** (Bandera Verde) | **APAGADA** (Amarilla, Fin de Manga/Carrera) | **ENCENDIDA** (Bandera Verde) |
| **Condición de Disparo del Sensor** | A plena potencia de competición | Por inercia dentro del `drift_time` | A potencia tras pausa o arrastre de manga |
| **Indicador de Datos `isDrift`** | `false` | `true` | `false` |
| **Estado Interno `driftInvolved`** | `false` | `true` | `true` |
| **Insignia en Pantalla de Carrera** | Ninguna | Insignia **`DRIFT`** en columna de carril | Ninguna |
| **Notificación de Audio** | Sonido estándar de vuelta/récord | **Sonido de Vuelta de Deriva** (`urgent`) | Sonido estándar (sin locución de deriva) |
| **Cuenta para Vueltas y Clasificación** | **Sí** (crédito total) | **Sí** (crédito total) | **Sí** (crédito total) |
| **Válida para Récords (`adjust_drift_laps` = Desactivado)** | **Sí** | **Sí** (si supera el mejor previo) | **Sí** (si supera el mejor previo) |
| **Válida para Récords (`adjust_drift_laps` = Activado)** | **Sí** | **Excluida / Descalificada** | **Excluida / Descalificada** |

---

## Opciones de tanda {: #heat-options }

El expansor de Opciones de tanda configura los tiempos automatizados, los ciclos de carrera y la secuencia de rotación:

- **Tiempo de avance automático (s)**: Segundos de espera tras finalizar una tanda antes de avanzar automáticamente a la siguiente.
- **Tiempo de calentamiento para avance (s)**: Intervalo previo antes de que se active el avance automático.
- **Tiempo de inicio automático (s)**: Retardo de cuenta atrás antes de iniciar automáticamente la siguiente tanda.
- **Tiempo de calentamiento para inicio (s)**: Duración del calentamiento previo al inicio automático.
- **Pasadas por tanda**: Especifica cuántas veces cada piloto completa la rotación total de tandas.
- **Tandas invertidas**: Invierte el orden programado de las tandas para correr en sentido inverso.
---

## Reglas de puntuación {: #scoring-rules }

#### Ajustes de Vueltas y Tiempo (Impacto en Clasificaciones y Métricas)

- **Método de clasificación de tanda**: Clasifique a los pilotos en cada tanda por **Más vueltas**, **Vuelta rápida** o **Tiempo total más rápido**, con criterios de desempate configurables.
- **Método de finalización**: Establece cómo se determina el final de una tanda (por **Número de vueltas** o **Tiempo** transcurrido en segundos).
- **Permitir llegada**: Elija cómo completan las vueltas los coches al terminar el líder o expirar el tiempo (por ejemplo, final inmediato, permitir terminar a todos, vuelta única o crédito de segmentos automáticos).
- **Método de clasificación general**: Clasifique la tabla general de la carrera tras todas las tandas con desempates y descartes personalizados.

### Ajustes de Temporizador
- **Retardo de Inicio / Reinicio**: Segundos de cuenta regresiva previa.
- **Tiempo Mínimo de Vuelta**: Tiempo mínimo permitido para filtrar falsos disparos de sensores.
- **Tiempo de Drift**: Ventana de detección para deslizamientos sobre la línea de meta.
- **Iniciar Detrás del Sensor**: Exige que los coches comiencen detrás del sensor en la vuelta cero.

---

## Grupos y etapas {: #groups-and-stages }

El expansor de Grupos y etapas separa a los pilotos en grupos diferenciados que no compiten entre sí en la pista:

- **Separación por grupos**: Los pilotos se organizan en grupos aislados y disputan sus tandas de forma independiente según la rotación configurada.
- **Máximo de grupos**: Establece el número máximo de grupos permitidos para la carrera.
- **Equilibrar grupos**: Distribuye automáticamente el número de pilotos de manera uniforme entre todos los grupos.
- **Permitir carriles vacíos**: Permite disputar tandas con carriles desocupados cuando los grupos no dividen uniformemente las pistas.
- **Forzar múltiplo del máximo**: Garantiza que el total de tandas se dispute en múltiplos de la capacidad máxima de grupo.
- **Rotar tandas de grupo**: Alterna las tandas entre distintos grupos en lugar de completar un grupo antes de comenzar el siguiente.
- **Mínimo de clasificados**: Sitúa automáticamente a los mejores pilotos de cada grupo en la parte superior de la clasificación general.
- **Nombres de grupo**: Asigna nombres personalizados a cada grupo (por ejemplo, Pro, Semipro, Grupo A/B/C).
---

## Métodos de salida {: #start-methods }

El expansor de Métodos de salida configura el inicio de las tandas, la posición de los coches en la pista y las penalizaciones:

- **Tiempo de salida / reinicio (s)**: Duración de la cuenta atrás antes de iniciar o reiniciar una tanda.
- **Retardo aleatorio (s)**: Retardo aleatorio añadido a la cuenta atrás para evitar anticipaciones a la señal de salida.
- **Salida detrás del sensor**: Obliga a posicionar los coches detrás del sensor de meta en la vuelta cero.
- **Salida en posición actual**: Permite reanudar la carrera desde la posición física actual en pista tras una pausa.
- **Salidas lanzadas**: Mantiene la corriente activa en la salida para acelerar inmediatamente al terminar la cuenta atrás.
- **Reiniciar en salida falsa**: Detiene y reinicia automáticamente la cuenta atrás si se detecta una salida falsa.
- **Penalizaciones por salida falsa**: Configura deducciones de vueltas o penalizaciones de tiempo para salidas anticipadas.
---

## Opciones de carrera en equipo {: #team-racing }

El expansor de Opciones de carrera en equipo habilita formatos de resistencia con varios pilotos por equipo:

- **Modo de carrera en equipo**: Activa la puntuación por equipos donde los pilotos comparten las tandas.
- **Estrategia de rotación de pilotos**: Alterna automáticamente a los pilotos en orden rotativo a lo largo de las tandas.
- **Relevos durante la tanda**: Permite a los pilotos relevarse durante las paradas en boxes o en hitos de vueltas.
- **Límites de turnos (stints)**: Turnos de conducción mínimos y máximos por piloto para garantizar una participación equilibrada.
- **Relevos obligatorios**: Exige un número mínimo de paradas y cambios de piloto por tanda o carrera.

---

## Editor de carreras - Simulación de combustible analógico {: #analog-fuel-simulation }

El combustible analógico simula el consumo **por vuelta**. Dado que las pistas analógicas detectan los coches al cruzar los sensores de cronometraje de meta, el combustible se calcula y descuenta cada vez que se completa una vuelta.

#### Opciones de configuración

- **Habilitar combustible analógico**: Interruptor principal del seguimiento analógico. Si está desmarcado, la simulación se deshabilita para la carrera y los coches compiten sin restricciones de combustible.
- **Tipo de consumo de combustible**: Determina la curva matemática empleada para calcular el consumo según el ritmo de vuelta:
    - **Lineal**: El consumo escala linealmente con el tiempo de vuelta. Las vueltas más rápidas queman más combustible, mientras que las vueltas el doble de lentas consumen la mitad del combustible base.
    - **Cuadrático**: El consumo escala con el inverso del cuadrado del tiempo de vuelta, penalizando intensamente las vueltas muy rápidas.
    - **Cúbico**: El consumo aumenta vertiginosamente en vueltas rápidas, castigando drásticamente a los pilotos que arriesgan en busca de vueltas récord.
    - **Curva personalizada**: Permite moldear de forma interactiva y punto a punto la curva de consumo directamente en el gráfico SVG.
- **Tiempo más rápido (s)**: El tiempo de vuelta más rápido esperado para la pista y categoría del coche (en segundos).
- **Tiempo más lento (s)**: El tiempo de vuelta más lento (en segundos) para el consumo mínimo de combustible.
- **Consumo máx. de combustible por vuelta más rápida**: Unidades de combustible consumidas por vuelta al rodar al **Tiempo más rápido** o más veloz.
- **Consumo mín. de combustible por vuelta más lenta**: Unidades de combustible consumidas por vuelta al rodar al **Tiempo más lento** o más lento.
    - Para tiempos de vuelta entre el tiempo más rápido y el más lento, el consumo transiciona suavemente según el **Tipo de consumo** seleccionado (Lineal, Cuadrático, Cúbico o Curva personalizada).
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
- **Consumo de combustible por vuelta**: Muestra las unidades exactas consumidas en el espectro de tiempos de vuelta (desde Tiempo más rápido hasta Tiempo más lento). En modo Curva personalizada, los nodos interactivos y botones de restablecimiento permiten moldear la curva al instante mientras los 3 modelos base continúan visibles para referencia.
- **Tiempo hasta parada en boxes**: Estima el tiempo total de carrera (o vueltas) antes de vaciar el depósito a un ritmo de vuelta constante en todos los modelos.
- **Leyenda interactiva y visibilidad**: Haga clic izquierdo en cualquier curva de la leyenda para activarla o desactivarla. Al ocultar una curva se reajustan dinámicamente las escalas de los ejes para examinar con mayor detalle las curvas restantes.
- **Tarjetas flotantes comparativas**: Al pasar el ratón por los gráficos se muestra la telemetría comparativa de todas las curvas visibles en el punto examinado, con muestras de color, valores y el indicador `(Activo)` en el modelo seleccionado.

---

---

## Editor de carreras - Simulación de combustible digital {: #digital-fuel-simulation }

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
    - **Curva personali

---

## Puntuación de temporada {: #season-scoring }

El expansor de Puntuación de temporada define la distribución de puntos para campeonatos y series:

- **Tabla de puntos por posición**: Asigne puntos para cada posición final (por ejemplo, 25 al 1º, 18 al 2º, etc.).
- **Puntos por tanda**: Otorgue opcionalmente puntos por resultados de tandas individuales además del resultado general.
- **Puntos de bonificación**:
    - *Vuelta rápida*: Puntos adicionales para el piloto con la vuelta más rápida de la carrera.
    - *Pole position*: Puntos de bonificación por la mejor posición de clasificación.
    - *Más vueltas lideradas*: Puntos por liderar la mayor cantidad de vueltas.
- **Agregación del campeonato**: Suma automática de puntos de temporada con soporte para descartar los peores resultados.
