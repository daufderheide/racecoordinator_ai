# Gap Calculation Logic

The gap leader and gap position calculations are performed consistently across both individual heats and overall standings. This calculation logic is unified in `GapCalculator.java` and applied to any entity implementing the `GapParticipant` interface (e.g., `DriverHeatData` and `RaceParticipant`).

## Overview of Gaps

First, drivers are sorted into their current race positions (1st, 2nd, 3rd, etc.) based on the scoring criteria. Once sorted, the gaps are calculated:

* **Gap Leader (`gapLeader`)**: For any given driver, this is the time gap between themselves and the driver currently in 1st place. The 1st place driver's gap leader is always `0.0`.
* **Gap Position (`gapPosition`)**: For any given driver, this is the time gap between themselves and the driver immediately ahead of them in the standings. For example, the 3rd place driver's gap position is the gap between them and the 2nd place driver.

### When are the gaps evaluated?

While both standard gaps and F1 gaps are updated continuously throughout the race (whenever standings are refreshed), they represent different points in time:
* **Standard Gaps**: Represent a continuously projected estimate. They use the trailing driver's average lap time to mathematically project the time difference based on their current pace and lap deficit.
* **Formula 1 Gaps**: Represent a precise historical snapshot measured *at the start/finish line*. The gap evaluates the exact physical time difference between when the leading driver completed a specific lap and when the trailing driver completed that exact same lap.

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

---

## Formula 1 Gaps (`gapLeaderF1` and `gapPositionF1`)

Formula 1 style gaps represent the actual physical time difference between two cars on the track, rather than a projected gap based on average lap times. Additionally, if a driver is lapped by the driver ahead, the gap is represented purely as the number of laps down, instead of a time gap.

Similar to standard gaps, these are calculated against both the overall leader (`gapLeaderF1`) and the immediate position ahead (`gapPositionF1`).

The calculation yields two distinct values: `lapsDown` and a `timeGap`.

Let `leader` be the driver ahead, and `current` be the trailing driver.

### 1. Laps Down
First, the system calculates how many full laps the trailing driver is behind the leading driver. This is based purely on physical laps completed.

```java
lapsDown = (leader.getPhysicalLapCount() - current.getPhysicalLapCount()) - 1
```

If `lapsDown` is greater than 0, the driver is considered lapped. The gap is presented as being `+X Laps` down, and the actual `timeGap` is forced to `0.0`.

### 2. Time Gap
If the trailing driver is on the same lap as the leader (`lapsDown <= 0`), the system calculates the actual time gap:

* **Same Laps Completed:** If both drivers have completed the exact same number of physical laps, the gap is the simple difference in their total times.
  ```java
  timeGap = current.getTotalTime() - leader.getTotalTime()
  ```
* **Leader is One Lap Ahead:** If the leader has completed exactly one more physical lap (meaning they have crossed the start/finish line to begin their next lap, but the trailing driver has not), the gap is measured back to when the leader was at the *same* lap.
  ```java
  timeGap = current.getTotalTime() - leader.getTimeAtLap(current.getPhysicalLapCount())
  ```

> **Note:** If the calculated `timeGap` is somehow negative (e.g., due to unusual timing anomalies), it is forced to `0.0`.
