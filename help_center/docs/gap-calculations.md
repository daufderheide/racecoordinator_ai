# Gap Calculations & Gap Widgets

Race Coordinator AI features an automated server-side gap calculation engine (`GapCalculator`) that determines real-time time differentials and lap intervals between competitors. All calculations are performed continuously on the server and synchronized to client displays, custom UI widgets, audio callouts, and spreadsheet exports.

---

## Overview of Gap Calculations

Whenever race standings update, the engine sorts all competitors by their current running order according to the active scoring rules (Most Laps, Fastest Total Time, or Points). Once sorted, gap metrics are computed for two distinct reference frames:

- **Gap to Leader (`gapLeader` / `overallGapLeader`)**: The time interval between a competitor and the current 1st-place race leader (P1). The leader's gap to leader is always `0.0` (rendered as `--`).
- **Gap to Position Ahead (`gapPosition` / `overallGapPosition`)**: The time interval between a competitor and the car running immediately ahead in the standings (for example, P3 compared to P2). The 1st-place leader's gap to position is always `0.0` (rendered as `--`).

### Data Scopes: Heat Gaps vs. Overall Gaps

Race Coordinator AI supports gap evaluation across two distinct data scopes:

| Scope | Column Keys | Description | Target Use Case |
| :--- | :--- | :--- | :--- |
| **Heat Data** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Evaluates intervals strictly between the cars actively competing on track in the current heat. Resting drivers display dashes (`--`). | Live heat racing, driver station lane cards, broadcast heat leaderboards. |
| **Overall Race Data** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Evaluates cumulative tournament intervals across all registered event participants, spanning all completed heats. | Tournament standings grids, multi-heat event leaderboards, championship tracking. |

---

## The 4 Gap Widgets We Support

Race Coordinator AI provides **4 distinct gap widgets** (available as grid columns, standalone lane column cards, and custom insets) categorized by calculation method and reference target:

```
                          ┌──────────────────────────────────────────────┐
                          │             RACE GAP WIDGETS                 │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │      STANDARD GAPS      │                                 │     FORMULA 1 GAPS      │
      │  Continuous Projection  │                                 │   Exact Line Crossing   │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │ (P1 Target) │     │(Ahead Target│                         │ (P1 Target) │     │(Ahead Target│
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Gap to Leader (Standard)
- **UI Toolbox Keys**: `gapLeader` (Heat) / `overallGapLeader` (Overall)
- **Toolbox Group**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Default Labels**: `HEAT GAP LEADER`, `OVERALL GAP LEADER`, or `GAP LEADER`
- **Measurement Model**: Continuous mathematical pace projection.
- **Display Output**: Formatted as `+X.XXX` seconds with configurable decimal places (1 to 3 decimal places). The race leader displays `--`.
- **Purpose**: Provides a real-time projected time deficit to the leader. Even when the leader has completed more laps, this widget projects the time gap using the trailing car's average lap pace.

### 2. Gap to Position Ahead (Standard)
- **UI Toolbox Keys**: `gapPosition` (Heat) / `overallGapPosition` (Overall)
- **Toolbox Group**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Default Labels**: `HEAT GAP POSITION`, `OVERALL GAP POSITION`, or `GAP POSITION`
- **Measurement Model**: Continuous mathematical pace projection.
- **Display Output**: Formatted as `+X.XXX` seconds. The 1st-place leader displays `--`.
- **Purpose**: Displays the time deficit required to overtake the competitor immediately ahead in the standings. Crucial for head-to-head battles and position defense.

### 3. Formula 1 Gap to Leader (`F1`)
- **UI Toolbox Keys**: `gapLeaderF1` (Heat) / `overallGapLeaderF1` (Overall)
- **Toolbox Group**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Default Labels**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP`, or `GAP LEADER`
- **Measurement Model**: Exact physical timing measured at the start/finish line.
- **Display Output**:
  - **On the Same Lap**: Formatted as `+X.XXX` seconds, showing the physical time difference when crossing the line.
  - **Lapped Drivers**: Automatically replaces the time display with `+1 Lap` or `+N Laps` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Leader**: Displays `--`.
- **Purpose**: Emulates professional Formula 1 timing broadcasts. Rather than showing large projected time gaps for lapped cars, it clearly indicates lap deficits.

### 4. Formula 1 Gap to Position Ahead (`F1`)
- **UI Toolbox Keys**: `gapPositionF1` (Heat) / `overallGapPositionF1` (Overall)
- **Toolbox Group**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Default Labels**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP`, or `GAP POSITION`
- **Measurement Model**: Exact physical timing measured at the start/finish line.
- **Display Output**:
  - **On the Same Lap**: Formatted as `+X.XXX` seconds behind the competitor ahead.
  - **Lapped by Car Ahead**: Displays `+1 Lap` or `+N Laps`.
  - **Leader**: Displays `--`.
- **Purpose**: Gives an authentic broadcast feel for interval battles, showing immediate lap differentials when cars are lapped by the competitor directly ahead.

---

## Detailed Calculation Formulas

All gap math is calculated in `com.antigravity.race.GapCalculator` on the Java server.

Let `leadParticipant` be the driver ahead (leader or car in position $N-1$) and `curParticipant` be the trailing driver.

### Standard Gap Projection Math

Standard gaps evaluate three possible lap scenarios:

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

### Formula 1 Gap Math

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

## Comparison: Standard Gaps vs. Formula 1 Gaps

| Feature | Standard Gaps (`gapLeader`, `gapPosition`) | Formula 1 Gaps (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Calculation Approach** | Continuous statistical pace projection | Exact loop crossing timestamp comparisons |
| **Lapped Car Display** | Projected seconds (e.g. `+14.820`) | Lap deficit string (e.g. `+1 Lap`, `+3 Laps`) |
| **Lead Lap Car Display** | Time difference in seconds (`+1.450`) | Exact time difference at identical lap line (`+1.450`) |
| **Finish Method Adaptation** | Differentiates Timed vs. Lap-Based finishes | Loop crossing driven across all race types |
| **Best Application** | Slot car pacing awareness, time trial tracking | Broadcast-style visual displays, spectator boards |

---

## Using Gap Widgets in the UI Editor

### 1. In Grids and Leaderboards
In the UI Editor, select your Grid widget and navigate to the **Columns** tab. Under the **Gaps & Intervals** (Heat) or **Overall Gaps & Intervals** (Overall) subgroups, check any of the gap columns to add them to your leaderboard:
- Drag column cards up or down to reorder them relative to Driver Name, Laps, or Lap Times.
- Configure time decimal precision (1, 2, or 3 decimals) in the Column Inspector.

### 2. Standalone Lane Column Cards
You can drag individual gap widgets directly from the Toolbox onto the canvas:
- In the **Lane Column Inspector**, bind the card to a specific **Track Lane** (e.g. Lane 1), **Heat Position** (e.g. Pos 2), or **Overall Standings Rank** (e.g. Overall Pos 1).
- Set layout orientation to **Vertical** (stacked title over gap) or **Horizontal** (side-by-side).

### 3. Inset Data on Other Cards
Gap metrics can be embedded directly as sub-badges inside other lane cards:
- Select any Lane Column card (e.g. Driver Avatar or Lap Count).
- In the **Card Insets** section, assign `gapLeader` or `gapPositionF1` to any of the 8 perimeter anchor positions (e.g. Bottom-Right).

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
