# Cálculos de Diferencias (Gaps) y Widgets de Distancia

Race Coordinator AI incorpora un motor automatizado del lado del servidor para el cálculo de diferencias (`GapCalculator`), el cual determina en tiempo real los intervalos de tiempo y las distancias de vueltas entre competidores. Todos los cálculos se ejecutan de forma continua en el servidor y se sincronizan con las pantallas cliente, widgets de interfaz personalizados, avisos de voz (TTS) y exportaciones en hojas de cálculo.

---

## Resumen de los Cálculos de Diferencias

Cada vez que se actualizan las clasificaciones de la carrera, el motor ordena a todos los competidores por su posición actual según las reglas activas de puntuación (Mayor Número de Vueltas, Tiempo Total Más Rápido o Puntos). A continuación, se calculan las diferencias respecto a dos puntos de referencia:

- **Diferencia con el Líder (`gapLeader` / `overallGapLeader`)**: Intervalo de tiempo entre un competidor y el líder de la carrera en 1.ª posición (P1). La diferencia del líder consigo mismo siempre es `0.0` (mostrado como `--`).
- **Diferencia con la Posición Precedente (`gapPosition` / `overallGapPosition`)**: Intervalo de tiempo entre un competidor y el coche inmediatamente anterior en la clasificación (por ejemplo, P3 respecto a P2). La diferencia del líder siempre es `0.0` (mostrado como `--`).

### Ámbitos de Datos: Diferencias de Tanda vs. Diferencias Generales

Race Coordinator AI evalúa las diferencias en dos ámbitos de datos:

| Ámbito | Claves de Columna | Descripción | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Datos de Tanda (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Evalúa las diferencias estrictamente entre los coches que compiten en la pista en la tanda activa. Los pilotos en espera muestran guiones (`--`). | Carreras en directo, tarjetas de carril, tablas de clasificación de la tanda. |
| **Datos Generales (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Evalúa las diferencias acumuladas en el torneo entre todos los participantes registrados, abarcando todas las tandas concluidas. | Tablas de clasificación general del evento, seguimiento de campeonatos. |

---

## Los 4 Widgets de Diferencias Soportados

Race Coordinator AI ofrece **4 widgets de diferencias específicos** (disponibles como columnas de cuadrícula, tarjetas de columna independientes e inserciones personalizadas), organizados por método de cálculo y objetivo de referencia:

```
                          ┌──────────────────────────────────────────────┐
                          │         WIDGETS DE DIFERENCIA (GAPS)         │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │  DIFERENCIAS ESTÁNDAR   │                                 │  DIFERENCIAS FÓRMULA 1  │
      │   Proyección de Ritmo   │                                 │ Paso Exacto por Meta    │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │(Líder P1)   │     │(Coche Del.) │                         │(Líder P1)   │     │(Coche Del.) │
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Diferencia con el Líder (Estándar)
- **Claves en la Caja de Herramientas**: `gapLeader` (Tanda) / `overallGapLeader` (General)
- **Grupo de Caja de Herramientas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etiquetas Predeterminadas**: `HEAT GAP LEADER`, `OVERALL GAP LEADER` o `GAP LEADER`
- **Modelo de Medición**: Proyección matemática continua de ritmo.
- **Formato Visual**: Formateado como `+X.XXX` segundos con precisión configurable (1 a 3 decimales). El líder muestra `--`.
- **Propósito**: Ofrece una estimación en tiempo real de la desventaja temporal respecto al líder. Aunque el líder haya completado más vueltas, proyecta la diferencia usando el ritmo medio del perseguidor.

### 2. Diferencia con la Posición Precedente (Estándar)
- **Claves en la Caja de Herramientas**: `gapPosition` (Tanda) / `overallGapPosition` (General)
- **Grupo de Caja de Herramientas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etiquetas Predeterminadas**: `HEAT GAP POSITION`, `OVERALL GAP POSITION` o `GAP POSITION`
- **Modelo de Medición**: Proyección matemática continua de ritmo.
- **Formato Visual**: Formateado como `+X.XXX` segundos. El 1.º muestra `--`.
- **Propósito**: Muestra el tiempo necesario para alcanzar y adelantar al piloto inmediatamente anterior. Esencial en batallas directas posición por posición.

### 3. Diferencia Fórmula 1 con el Líder (`F1`)
- **Claves en la Caja de Herramientas**: `gapLeaderF1` (Tanda) / `overallGapLeaderF1` (General)
- **Grupo de Caja de Herramientas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etiquetas Predeterminadas**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` o `GAP LEADER`
- **Modelo de Medición**: Medición física exacta en la línea de meta.
- **Formato Visual**:
  - **En la misma vuelta**: `+X.XXX` segundos de diferencia real al cruzar la línea.
  - **Pilotos doblados**: Sustituye el tiempo por `+1 Vuelta` o `+N Vueltas` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Líder**: Muestra `--`.
- **Propósito**: Replica el estilo de retransmisión de Fórmula 1. Evita números de tiempo gigantescos para coches doblados, mostrando con claridad el número de vueltas perdidas.

### 4. Diferencia Fórmula 1 con la Posición Precedente (`F1`)
- **Claves en la Caja de Herramientas**: `gapPositionF1` (Tanda) / `overallGapPositionF1` (General)
- **Grupo de Caja de Herramientas**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etiquetas Predeterminadas**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` o `GAP POSITION`
- **Modelo de Medición**: Medición física exacta en la línea de meta.
- **Formato Visual**:
  - **En la misma vuelta**: `+X.XXX` segundos respecto al competidor anterior.
  - **Doblado por el coche anterior**: Muestra `+1 Vuelta` o `+N Vueltas`.
  - **Líder**: Muestra `--`.
- **Propósito**: Proporciona una experiencia de retransmisión fidedigna en duelos directos, indicando vueltas perdidas en caso de haber sido doblado por el coche anterior.

---

## Fórmulas Detalladas de Cálculo

Todo el cálculo de diferencias se realiza en `com.antigravity.race.GapCalculator` en el servidor Java.

Sea `leadParticipant` el piloto de referencia por delante (líder o coche en posición $N-1$) y `curParticipant` el piloto perseguidor.

### Proyección de Diferencia Estándar

Las diferencias estándar contemplan tres escenarios posibles:

#### Escenario A: Mismo Número de Vueltas
Cuando ambos pilotos han completado el mismo número de vueltas ajustadas:
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Escenario B: Cero Vueltas Completadas
Si el perseguidor aún no ha completado una vuelta cronometrada completa (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Escenario C: Distinto Número de Vueltas
Cuando el piloto de cabeza tiene más vueltas completadas, se calcula la diferencia de vueltas:
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La fórmula de proyección se adapta según el **Método de Finalización (Finish Method)** de la carrera:

1. **Carreras por Tiempo (Timed Finish)** (ej. tandas de 2 minutos):
   Al sonar el aviso final, los tiempos totales son prácticamente idénticos. La diferencia se calcula multiplicando el ritmo medio del perseguidor por las vueltas de desventaja:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Carreras por Vueltas (Lap Finish)** (ej. tandas de 50 vueltas):
   Los tiempos totales divergen a medida que los pilotos finalizan. El sistema combina la diferencia de tiempo actual con el tiempo proyectado para las vueltas restantes:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Si por anomalías o ajustes manuales $\text{ProjectedGap}$ resulta negativo, el sistema recurre automáticamente a $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### Matemáticas de Diferencias Fórmula 1

Las diferencias de F1 reflejan el paso de los coches por la línea de meta:

#### 1. Cálculo de Vueltas Perdidas (Laps Down)
El motor evalúa si el perseguidor ha sido doblado físicamente:
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Si $\text{LapsDown} > 0$: El perseguidor ha sido doblado. Se guarda el valor, el tiempo se fija en `0.0` y la interfaz muestra `+X Vueltas`.
- Si $\text{LapsDown} \le 0$: El perseguidor está en la misma vuelta que el coche de referencia ($\text{LapsDown} = 0$).

#### 2. Diferencia en la Vuelta del Líder
Si ambos están en la misma vuelta, se calcula la diferencia temporal exacta al cruzar la meta:

- **Mismo Número de Vueltas Físicas Completadas**: Ambos cruzaron la meta en la misma vuelta:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **El Líder Completó una Vuelta Adicional**: El líder ya inició su siguiente vuelta, pero el perseguidor aún no ha completado la actual. La diferencia se mide con respecto al momento en que el líder terminó esa misma vuelta:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Si la diferencia resultara negativa por desviaciones de cronometraje, se ajusta a `0.0`.

---

## Comparativa: Diferencias Estándar vs. Fórmula 1

| Característica | Diferencias Estándar (`gapLeader`, `gapPosition`) | Diferencias Fórmula 1 (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Enfoque de Medición** | Proyección estadística continua de ritmo | Comparación exacta de tiempos al cruzar meta |
| **Coches Doblados** | Segundos proyectados (ej. `+14.820`) | Texto de vueltas perdidas (ej. `+1 Vuelta`, `+2 Vueltas`) |
| **En la Misma Vuelta** | Diferencia temporal en segundos (`+1.450`) | Diferencia temporal en meta para la misma vuelta (`+1.450`) |
| **Tipo de Finalización** | Distingue carreras por tiempo y por vueltas | Basado en el cruce de meta en todo formato |
| **Aplicación Recomendada** | Control de ritmo en pista de slot | Retransmisión televisiva, pantallas para espectadores |

---

## Uso de Widgets de Diferencias en el Editor de IU

### 1. En Cuadrículas y Tablas
En el Editor de IU, seleccione el widget Grid y vaya a la pestaña **Columnas (Columns)**. En los grupos **Gaps & Intervals** (Tanda) u **Overall Gaps & Intervals** (General), active las columnas deseadas:
- Ordene las columnas arrastrándolas hacia arriba o hacia abajo.
- Configure la precisión de decimales (1, 2 o 3) en el inspector de columna.

### 2. Tarjetas de Columna Independientes
Puede arrastrar widgets de diferencias individuales directamente desde la Caja de Herramientas hacia el lienzo:
- En el **Inspector de Columna de Carril**, asocie la tarjeta a un **Carril Físico**, una **Posición en la Tanda** o a la **Clasificación General**.
- Configure la orientación: **Vertical** (título sobre el valor) u **Horizontal** (lado a lado).

### 3. Inserciones (Insets) en Otras Tarjetas
Puede incrustar valores de diferencia directamente dentro de otras tarjetas:
- Seleccione cualquier tarjeta (por ejemplo, el avatar del piloto o el contador de vueltas).
- En la sección **Card Insets**, asigne `gapLeader` o `gapPositionF1` a cualquiera de las 8 posiciones perimetrales (ej. Inferior Derecha).

---

## Integración con Voz (TTS), Audio y Exportación

- **Texto a Voz (TTS)**: Anuncios verbales con interpolación dinámica:
  - `{driver.gapLeader}`: Diferencia con el líder hablada en segundos.
  - `{driver.gapPosition}`: Diferencia con el coche precedente en segundos.
- **Widgets HTML/JS Personalizados**: Acceso directo mediante `driver.gap_leader` y `driver.gap_position`.
- **Exportación a Excel (XLS)**: Etiquetas de plantilla Jxls:
  - `${driver.gapLeader}` y `${driver.gapPosition}` (Clasificación general).
  - `${heatDriver.gapLeader}` y `${heatDriver.gapPosition}` (Resultados de la tanda).
