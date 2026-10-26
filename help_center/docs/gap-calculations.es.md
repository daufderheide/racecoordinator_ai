# Cálculos de Diferencias y Widgets de Diferencia (Gaps)

Race Coordinator AI cuenta con un motor automatizado en el servidor para el cálculo de diferencias (`GapCalculator`), que determina en tiempo real las diferencias de tiempo y los intervalos de vueltas entre los competidores. Todos los cálculos se realizan continuamente en el servidor y se sincronizan con las pantallas del cliente, widgets personalizados, avisos por voz y exportaciones de hojas de cálculo.

---

## Descripción General de los Cálculos de Diferencias

Cada vez que se actualizan las clasificaciones de la carrera, el motor ordena a todos los competidores según su orden de carrera actual de acuerdo con las reglas de puntuación activas (Más Vueltas, Tiempo Total Más Rápido o Puntos). A continuación, se calculan las métricas de diferencia respecto a dos marcos de referencia:

- **Diferencia con el Líder (`leader`)**: El intervalo entre un competidor y el líder de la carrera (P1). La diferencia del líder consigo mismo siempre es `0.0` (mostrado como `--`).
- **Diferencia con la Posición Precedente (`position`)**: El intervalo entre un competidor y el coche inmediatamente anterior en la clasificación (por ejemplo, P3 respecto a P2). La diferencia del líder siempre es `0.0` (mostrado como `--`).

### Ámbitos de Datos: Diferencias de Ronda vs. Diferencias Generales

Race Coordinator AI admite la evaluación de diferencias en dos ámbitos de datos:

| Ámbito | Clave de Columna | Descripción | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Datos de Ronda (Heat Data)** | `gap` | Evalúa intervalos estrictamente entre los coches que compiten activamente en la ronda actual. Los pilotos en espera muestran guiones (`--`). | Carreras en vivo, tarjetas de carril, tablas de posiciones de ronda. |
| **Datos Generales (Overall Data)** | `overallGap` | Evalúa intervalos acumulados entre todos los participantes del torneo, a lo largo de todas las rondas completadas. | Cuadrículas generales, clasificaciones de campeonato. |

> [!NOTE]
> Los diseños existentes que utilicen claves de columna anteriores (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, etc.) se migran automáticamente al cargar a `gap` u `overallGap` con los ajustes de objetivo y modo de cálculo correspondientes.

---

## Los 2 Widgets de Diferencia Configurables

Race Coordinator AI proporciona **2 widgets de diferencia configurables** (disponibles como columnas de cuadrícula, tarjetas de carril independientes e inserciones personalizadas):

```
                          ┌──────────────────────────────────────────────┐
                          │         WIDGETS DE DIFERENCIA DE CARRERA     │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │DIFERENCIA DE RONDA(`gap`)│                                 │DIFERENCIA GENERAL(`overallGap`)│
      │  Pilotos Ronda Activa   │                                 │Todos los Participantes  │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │ SELECTOR DE OBJETIVO  │           │    MODO DE CÁLCULO    │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Líder (P1)          │           │ • Siempre tiempo      │
                   │ • Posición anterior   │           │ • Tiempo y vueltas(F1)│
                   │                       │           │ • Siempre vueltas     │
                   └───────────────────────┘           └───────────────────────┘
```

### Selección del Objetivo
- **Líder (`leader`)**: Intervalo relativo al líder actual de la carrera (P1). El líder muestra guiones (`--`).
- **Posición por delante (`position`)**: Intervalo relativo al coche inmediatamente anterior en la clasificación (ej. P3 vs P2). El líder muestra guiones (`--`).

### Modos de Cálculo
1. **Siempre tiempo (`always_time`)**:
   - Proyección matemática continua del ritmo en segundos.
   - Formateado como `+X.XXX` con decimales de tiempo configurables (1 a 3 decimales).
2. **Tiempo y vueltas perdidas (`laps_and_time`)**:
   - Cronometraje estilo Fórmula 1.
   - Muestra segundos (`+X.XXX`) cuando están en la misma vuelta.
   - Muestra déficit de vueltas (`+1 Vuelta`, `+N Vueltas`) cuando están doblados.
3. **Siempre vueltas (`always_laps`)**:
   - Diferencia exacta de vueltas calculada cada vez que un competidor cruza la meta para completar una vuelta.
   - Incorpora el progreso de vuelta parcial del piloto objetivo en ese momento exacto.
   - Formateado con decimales de vuelta configurables (0 a 3 decimales).

---

## Fórmulas de Cálculo Detalladas

Todo el cálculo de diferencias se procesa en `com.antigravity.race.GapCalculator` en el servidor Java.

Sea `leadParticipant` el piloto que va delante (líder o posición $N-1$) y `curParticipant` el piloto perseguidor.

### 1. Fórmula: Siempre Tiempo (`always_time`)

Las diferencias de tiempo estándar evalúan tres escenarios:

#### Escenario A: Mismas Vueltas Completadas
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Escenario B: Cero Vueltas Completadas
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Escenario C: Diferente Número de Vueltas
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La fórmula de proyección se adapta según el **Método de Finalización**:
1. **Carreras por Tiempo**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$
2. **Carreras por Vueltas**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

---

### 2. Fórmula: Fórmula 1 (`laps_and_time`)

#### 1. Evaluación de Vueltas Perdidas
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$
- Si $\text{LapsDown} > 0$: El piloto está doblado (`+X Vueltas`).
- Si $\text{LapsDown} \le 0$: En la vuelta del líder.

#### 2. Diferencia en la Vuelta del Líder
- **Mismas vueltas completadas**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Líder con una vuelta más**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Fórmula: Siempre Vueltas (`always_laps`)

El cálculo mide la diferencia exacta de vueltas al completar cada vuelta:

#### 1. Activador al Completar Vuelta
Cuando un competidor cruza la meta para completar una vuelta, el servidor registra sus vueltas ajustadas y determina al piloto objetivo de referencia.

#### 2. Cálculo de Vuelta Parcial
Para garantizar una comparación justa, se calcula el progreso de vuelta parcial del piloto objetivo según el tiempo transcurrido desde su última vuelta:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Si el piloto objetivo no tiene un tiempo mediano válido ($\le 0$) o $\text{TimeSinceLastLap} \le 0$, la vuelta parcial es $0.0$. Se limita a $0.99$ para no incrementar una vuelta completa antes del cruce físico.

#### 3. Diferencia Efectiva de Vueltas
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

El competidor mantiene este valor calculado hasta que complete su propia vuelta siguiente.

---

## Comparación de Modos de Cálculo

| Característica | Siempre tiempo (`always_time`) | Tiempo y vueltas perdidas (`laps_and_time`) | Siempre vueltas (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Enfoque** | Proyección matemática continua del ritmo | Comparaciones exactas en la línea de meta | Diferencia de vueltas con vuelta parcial |
| **Coches Doblados** | Segundos proyectados (ej. `+14.820`) | Texto de vueltas perdidas (`+1 Vuelta`) | Delta decimal de vueltas (ej. `+2.45`) |
| **En Vuelta de Líder**| Diferencia en segundos (`+1.450`) | Diferencia exacta en meta (`+1.450`) | Delta decimal de vueltas (ej. `+0.28`) |
| **Base Decimal** | Decimales de tiempo (1 a 3) | Decimales de tiempo (1 a 3) | Decimales de vuelta (0 a 3) |
| **Momento Actualización**| Actualizaciones continuas | Cruce de línea de meta | Cruce de vuelta completada |
| **Aplicación Ideal** | Pacing de slot car, entrenamientos | Transmisiones estilo F1 TV | Carreras de resistencia por vueltas |

---

## Uso de Widgets de Diferencia en el Editor de IU

### 1. En Cuadrículas y Tablas
En el Editor de IU, seleccione el widget de Cuadrícula y vaya a la pestaña **Columnas**. En **Gaps e Intervalos**, active **Diferencia de Ronda** (`gap`) o **Diferencia General** (`overallGap`):
- Seleccione la columna para abrir el **Inspector de Columnas**.
- En **Configuración de diferencia**, elija el **Objetivo** (*Líder* o *Posición anterior*) y el **Modo de cálculo** (*Siempre tiempo*, *Tiempo y vueltas perdidas* o *Siempre vueltas*).
- Se pueden añadir varias columnas de diferencia con objetivos o modos distintos simultáneamente a la misma cuadrícula.

### 2. Tarjetas de Carril Independientes
Arrastre widgets de diferencia directamente desde la barra de herramientas al lienzo y configure su objetivo y modo en el inspector.

### 3. Inserciones (Insets)
Las diferencias pueden integrarse en tarjetas de carril asignando `gap` u `overallGap` a cualquiera de las 8 posiciones de inserción perimetrales.

---

## Integración con TTS, Audio y Exportación

- **Texto a voz (TTS)**: `{driver.gapLeader}` y `{driver.gapPosition}`.
- **Widgets personalizados HTML/JS**: `driver.gap_leader` y `driver.gap_position`.
- **Exportaciones de Excel**: `${driver.gapLeader}` y `${driver.gapPosition}`.
