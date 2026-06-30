# Gap Calculation Logic

The gap leader and gap position calculations are performed consistently across both individual heats and overall standings. This calculation logic is unified in `GapCalculator.java` and applied to any entity implementing the `GapParticipant` interface (e.g., `DriverHeatData` and `RaceParticipant`).

## Overview of Gaps

First, drivers are sorted into their current race positions (1st, 2nd, 3rd, etc.) based on the scoring criteria. Once sorted, the gaps are calculated:

* **Gap Leader (`gapLeader`)**: For any given driver, this is the time gap between themselves and the driver currently in 1st place. The 1st place driver's gap leader is always `0.0`.
* **Gap Position (`gapPosition`)**: For any given driver, this is the time gap between themselves and the driver immediately ahead of them in the standings. For example, the 3rd place driver's gap position is the gap between them and the 2nd place driver.

---

## How the Time Gap is Calculated

The system uses a time projection formula to estimate the actual time gap between two drivers. The math depends heavily on whether the drivers have completed the same number of laps, and how the race finish is configured (Timed vs. Lap-based finishes).

Let `leader` be the driver ahead, and `current` be the trailing driver.

### 1. Same Number of Laps
If both drivers have the exact same number of adjusted laps (`getAdjustedLapCount()`), the gap is simply the difference in their total times:
```java
current.getTotalTime() - leader.getTotalTime()
```

### 2. Zero Completed Laps
If the trailing driver has not completed any full laps (`hasNoFullLaps()`), the gap defaults to the leading driver's total time:
```java
leader.getTotalTime()
```

### 3. Different Number of Laps
If the leading driver has more laps, the system calculates the lap difference (`lapDiff = leader.getAdjustedLapCount() - current.getAdjustedLapCount()`) and projects the time gap using the trailing driver's average lap time (`avgLapTime = current.getAverageLapTime()`).

The projection differs based on the `FinishMethod` of the heat/race:

#### Timed Finish
In a timed race, drivers stop exactly when the time limit expires (meaning their total times should be nearly identical if they both finish under normal conditions). Thus, the gap is solely determined by the number of laps they are behind, multiplied by their average pace:
```java
gap = avgLapTime * lapDiff
```

#### Lap-based Finish
In a lap-based race, drivers finish as soon as they complete the target number of laps. This means their total times will naturally differ. The system projects the gap by taking the time difference they already have and adding the projected time for the remaining laps they are behind:
```java
timeDiff = current.getTotalTime() - leader.getTotalTime()
projectedGap = timeDiff + (avgLapTime * lapDiff)
```

> **Note:** If the `projectedGap` calculation somehow yields a negative number (e.g., due to unusual timing anomalies or manual adjustments), the system falls back to the `Timed Finish` projection logic (`avgLapTime * lapDiff`).
