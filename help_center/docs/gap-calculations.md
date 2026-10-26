# Gap Calculations & Gap Widgets

Race Coordinator AI features an automated server-side gap calculation engine (`GapCalculator`) that determines real-time time differentials and lap intervals between competitors. All calculations are performed continuously on the server and synchronized to client displays, custom UI widgets, audio callouts, and spreadsheet exports.

---

## Overview of Gap Calculations

Whenever race standings update, the engine sorts all competitors by their current running order according to the active scoring rules (Most Laps, Fastest Total Time, or Points). Once sorted, gap metrics are computed for two distinct reference frames:

- **Gap to Leader (`leader`)**: The interval between a competitor and the current 1st-place race leader (P1). The leader's gap to leader is always `0.0` (rendered as `--`).
- **Gap to Position Ahead (`position`)**: The interval between a competitor and the car running immediately ahead in the standings (for example, P3 compared to P2). The 1st-place leader's gap to position is always `0.0` (rendered as `--`).

### Data Scopes: Heat Gaps vs. Overall Gaps

Race Coordinator AI supports gap evaluation across two distinct data scopes:

| Scope | Column Key | Description | Target Use Case |
| :--- | :--- | :--- | :--- |
| **Heat Data** | `gap` | Evaluates intervals strictly between the cars actively competing on track in the current heat. Resting drivers display dashes (`--`). | Live heat racing, driver station lane cards, broadcast heat leaderboards. |
| **Overall Race Data** | `overallGap` | Evaluates cumulative tournament intervals across all registered event participants, spanning all completed heats. | Tournament standings grids, multi-heat event leaderboards, championship tracking. |

> [!NOTE]
> Existing layouts using legacy column keys (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, `overallGapPosition`, `overallGapLeaderF1`, `overallGapPositionF1`) are automatically migrated to `gap` or `overallGap` with matching target and calculation mode settings when loaded.

---

## The 2 Configurable Gap Widgets

Race Coordinator AI provides **2 configurable gap widgets** (available as grid columns, standalone lane column cards, and custom insets):

```
                          ┌──────────────────────────────────────────────┐
                          │             RACE GAP WIDGETS                 │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │     HEAT GAP (`gap`)    │                                 │ OVERALL GAP (`overallGap`)│
      │   Active Heat Drivers   │                                 │   All Event Competitors │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │    TARGET SELECTOR    │           │   CALCULATION MODE    │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Leader (P1)         │           │ • Always Time         │
                   │ • Position Ahead      │           │ • Time and Laps Down (F1) │
                   │                       │           │ • Always Laps (Delta) │
                   └───────────────────────┘           └───────────────────────┘
```

### Gap Target Selection
- **Leader (`leader`)**: Interval relative to the current race leader (P1). The leader displays dashes (`--`).
- **Position Ahead (`position`)**: Interval relative to the car immediately ahead in the standings (e.g., P3 vs P2). The 1st-place leader displays dashes (`--`).

### Calculation Modes
1. **Always Time (`always_time`)**:
   - Continuous mathematical pace projection in seconds.
   - Formatted as `+X.XXX` with configurable time decimals (1 to 3 decimal places).
2. **Time and Laps Down (`laps_and_time`)**:
   - Formula 1 broadcast style timing.
   - Displays seconds (`+X.XXX`) when competitors are on the lead lap.
   - Displays lap deficits (`+1 Lap`, `+N Laps`) when competitors are lapped.
3. **Always Laps (`always_laps`)**:
   - Exact lap count delta calculated whenever a competitor crosses the line to complete a lap.
   - Incorporates partial lap progress of the compared driver at that exact moment.
   - Formatted with configurable lap decimal places (0 to 3 decimal places).

---

## Detailed Calculation Formulas

All gap math is calculated in `com.antigravity.race.GapCalculator` on the Java server.

Let `leadParticipant` be the driver ahead (leader or car in position $N-1$) and `curParticipant` be the trailing driver.

### 1. Always Time Math (`always_time`)

Standard time gaps evaluate three possible lap scenarios:

#### Scenario A: Same Completed Laps
When both drivers have completed the exact same number of adjusted laps:
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Scenario B: Zero Completed Laps
If the trailing driver has not yet completed a full timed lap (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Scenario C: Different Completed Laps
When the driver ahead has completed more laps, the lap difference is calculated:
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

The projection formula adapts based on the race's configured **Finish Method**:

1. **Timed Finish Races** (e.g. 2-minute heats):
   In timed races, total heat durations are essentially identical at the buzzer. The gap is projected purely from the trailing driver's lap pace across the lap deficit:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Lap-Based Finish Races** (e.g. 50-lap heats):
   In lap-based races, total times diverge as drivers finish. The system combines the current elapsed time difference with the projected time for the remaining uncompleted laps:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > If unusual timing conditions or manual adjustments cause $\text{ProjectedGap}$ to evaluate to a negative value, the engine automatically falls back to $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### 2. Formula 1 Gap Math (`laps_and_time`)

Formula 1 gaps represent physical track positions measured as cars cross the start/finish loop:

#### 1. Laps Down Evaluation
The engine calculates whether the trailing driver has been physically lapped:
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- If $\text{LapsDown} > 0$: The trailing driver is lapped. `lapsDownLeader` (or `lapsDownPosition`) is stored, the time gap is set to `0.0`, and the UI displays `+X Laps`.
- If $\text{LapsDown} \le 0$: The trailing driver is on the lead lap ($\text{LapsDown} = 0$).

#### 2. Lead-Lap Time Difference
When drivers are on the same lap, the exact crossing time differential is calculated:

- **Equal Physical Laps Completed**: Both cars have crossed the line for the same lap number:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Leader Completed One Additional Lap**: The leader has crossed the line to begin their next lap, but the trailing driver is still finishing their current lap. The gap is measured back to when the leader completed that exact same lap:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> If timing anomalies produce a negative time gap, the value is clamped to `0.0`.

---

### 3. Always Laps Math (`always_laps`)

The Always Laps calculation measures the exact lap delta between competitors at each lap completion:

#### 1. Lap Completion Trigger
Whenever a competitor completes a lap, the server records their adjusted lap count. The reference target driver (either the leader or the position ahead) is identified.

#### 2. Partial Lap Progress Calculation
To ensure fair and accurate comparisons without penalizing the target driver for being mid-lap, the target driver's partial lap progress is computed using their running time since their last lap:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> If the target driver has no valid median lap time ($\le 0$) or $\text{TimeSinceLastLap} \le 0$, the partial lap evaluates to $0.0$. Partial progress is clamped at $0.99$ to avoid premature whole lap increments before a physical line crossing.

#### 3. Effective Lap Delta
The target driver's effective lap count is determined:
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$

The lap gap for the competitor is:
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

Competitors hold their calculated lap gap until they complete their own next lap, at which point the delta is re-evaluated against the target's current progress.

---

## Comparison of Calculation Modes

| Feature | Always Time (`always_time`) | Time and Laps Down (`laps_and_time`) | Always Laps (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Calculation Approach** | Continuous statistical pace projection | Exact loop crossing timestamp comparisons | Lap count delta with partial lap progress |
| **Lapped Car Display** | Projected seconds (e.g. `+14.820`) | Lap deficit string (e.g. `+1 Lap`, `+3 Laps`) | Decimal lap delta (e.g. `+2.45`) |
| **Lead Lap Car Display** | Time difference in seconds (`+1.450`) | Exact time difference at line (`+1.450`) | Decimal lap delta (e.g. `+0.28`) |
| **Timing Basis** | Time decimals (1 to 3 places) | Time decimals (1 to 3 places) | Lap decimals (0 to 3 places) |
| **Update Moment** | Continuous projection updates | Start/finish line crossing | Completed lap crossing |
| **Best Application** | Slot car pacing awareness, time trials | Broadcast-style F1 TV timing boards | Lap-endurance races, lap-based standings |

---

## Using Gap Widgets in the UI Editor

### 1. In Grids and Leaderboards
In the UI Editor, select your Grid widget and navigate to the **Columns** tab. Under the **Gaps & Intervals** (Heat) or **Overall Gaps & Intervals** (Overall) subgroups, check **Heat Gap** (`gap`) or **Overall Gap** (`overallGap`) to add them to your leaderboard:
- Drag column cards up or down to reorder them relative to Driver Name, Laps, or Lap Times.
- Select the gap column card to open the **Column Inspector**.
- Under **Gap Configuration**, choose the **Target** (*Leader* or *Position Ahead*) and the **Calculation Mode** (*Always Time*, *Time and Laps Down*, or *Always Laps*).
- Multiple gap columns with different targets or calculation modes can be added to the same grid simultaneously!

### 2. Standalone Lane Column Cards
You can drag individual gap widgets directly from the Toolbox onto the canvas:
- In the **Lane Column Inspector**, bind the card to a specific **Track Lane** (e.g. Lane 1), **Heat Position** (e.g. Pos 2), or **Overall Standings Rank** (e.g. Overall Pos 1).
- Configure **Target** and **Calculation Mode** in the Gap Configuration section.
- Set layout orientation to **Vertical** (stacked title over gap) or **Horizontal** (side-by-side).

### 3. Inset Data on Other Cards
Gap metrics can be embedded directly as sub-badges inside other lane cards:
- Select any Lane Column card (e.g. Driver Avatar or Lap Count).
- In the **Card Insets** section, assign `gap` or `overallGap` to any of the 8 perimeter anchor positions (e.g. Bottom-Right).
- Configure the inset's Target and Calculation Mode directly in the Inset Settings popup.

---

## Integration with TTS, Audio & Exporting

Gap metrics are fully integrated across all Race Coordinator AI subsystems:

- **Text-to-Speech (TTS)**: Announce live intervals through dynamic speech interpolation:
  - `{driver.gapLeader}`: Spoken time gap to leader in seconds (e.g. *"Leader gap is one point two four seconds"*).
  - `{driver.gapPosition}`: Spoken time gap to the car ahead in seconds.
- **Custom HTML/JS Widgets**: Access live gap numbers in your custom widgets via `driver.gap_leader` and `driver.gap_position`.
- **Excel (XLS) Exports**: Include gap columns in your post-race export sheets using Jxls template tags:
  - `${driver.gapLeader}` and `${driver.gapPosition}` (Tournament overall standings).
  - `${heatDriver.gapLeader}` and `${heatDriver.gapPosition}` (Individual heat results).
