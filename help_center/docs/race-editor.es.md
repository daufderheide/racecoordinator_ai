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
- **Reglas de bandera amarilla**: Pausas automáticas o manuales de bandera amarilla con corte de energía en pista.
- **Opciones de interfaz personalizada**: Tablas de clasificación y widgets de telemetría especializados.

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
