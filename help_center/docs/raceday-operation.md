# Race Day Operation

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Starting and Pausing

During race day, track operations transition through automated states managed by the race director controls, hotkeys, or hardware call buttons:

### Starting Heats
- **Staging & Countdown**: When a heat is started, Race Coordinator AI initiates an automated countdown (configured via the race editor's Auto Start or Start Delay options). Audio countdown tones and visual starting lights alert drivers.
- **Green Flag**: Once the countdown reaches zero, track power turns on and the race enters the active `Racing` state.
- **Reaction Time**: If "Start Behind Sensor" is enabled, each car's first sensor hit records their reaction time off the line rather than a lap count.

### Pausing & Yellow Flags
- **Triggering a Pause**: Pressing the Spacebar, clicking the **Pause** icon on the toolbar, or pressing an external track call button immediately throws a yellow flag and enters the `Paused` state.
- **Immediate Power Cutoff**: Track power relays instantly de-energize to halt racing.
- **Partial Lap Time Capture**: The exact millisecond the pause occurs, the hardware timing interface captures the elapsed partial lap time for every active car on the track and banks it into each driver's pending lap time.
- **Coasting Across the Line (Drift Laps)**: If a car was approaching the start/finish line when power cut, its forward momentum may carry it across the sensor.
    - If the sensor is triggered within the configured **Drift Time** window, the crossing is accepted as a **Drift Lap** (`isDrift: true`). A **`DRIFT`** badge appears on the lane column, urgent drift audio plays, and the lap is credited to the driver.
    - If the sensor is triggered after the drift window expires, the trigger is discarded to prevent accidental laps from track marshals.
    - For complete details on drifting mechanics, see [Race Editor: Drifting & Drift Timing Mechanics](race-editor.md#drifting-and-drift-timing).

### Resuming Racing
- **Green Flag Restart**: Releasing the pause restarts the countdown. When track power is restored, hardware timers reset to zero and the race resumes under the green flag.
- **Lap Completion (Laps With Drift in Them)**: When a car that stopped on the track resumes and completes its lap under green flag power, its total lap time combines the partial time from before the pause with the time after resuming. This is a **Lap With Drift in It**. If "Exclude Laps With Drift from Records" is enabled, this interrupted lap is credited to standings but disqualified from setting lap records.

## Heat Controls

*Content coming soon.*

## Lap & Time Adjustments

Race directors can manually adjust driver lap counts and elapsed heat times directly from the race day screen to resolve track marshaling issues, missed sensor triggers, or penalties:

### Opening the Adjustment Dialog
- **Cell Click**: Left-click any **Lap Count** (`lapCount`, `physicalLapCount`) or **Total Time** (`totalTime`, `overallTotalTime`) card or table cell for that lane.
- **Race Director Menu**: Open the **Race Director Menu** and select **Adjust Lap Sections/Time** to modify any driver across any current, previous, or unstarted heat in batch.
- **Results Screens**: Also accessible from the **Heat Results** and **Race Results** screens to edit recorded heats post-race.

### Quick Shortcuts (Laps)
When clicking on a clickable lap count cell:
- **`Shift + Left Click`**: Adds +0.25 laps (+1/4 lap) immediately without opening the dialog.
- **`Alt + Left Click`**: Deducts -0.25 laps (-1/4 lap) immediately without opening the dialog.

### Adjustment Controls in the Dialog
1. **Lap Sections**: Enter track sections (e.g., out of 100 sections per lap) to adjust the driver's lap count. A live preview indicates the fraction of laps represented (e.g., 25 sections = 0.25 laps).
2. **Time Adjustment**: Enter positive seconds (penalty time, e.g. `+5.000`) or negative seconds (time compensation, e.g. `-2.500`) with millisecond precision (`0.001s`).
3. **Live Total Time Preview**: The dialog calculates and previews the driver's adjusted heat total time in real time before applying changes.

### Effect on Standings and Race Metrics
- **Adjusted Laps**: Directly shifts the driver's position in **Most Laps** standings and updates lap differentials (`gapLeader`, `gapPosition`). It does not alter physical sensor lap counts, best lap time, median lap time, or average lap pace.
- **Adjusted Total Time**: Shifts the driver's position in **Fastest Total Time** standings, serves as the primary tiebreaker for drivers tied on laps, and updates the driver's **Average Lap Time** ($\text{Adjusted Total Time} / \text{Physical Laps}$) and time gaps.
- **Untouched Metrics**: **Best Lap Time** and **Median Lap Time** are strictly preserved based on actual physical sensor lap times and are never altered by time adjustments.

