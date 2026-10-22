# Race Day Operation

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Starting and Pausing

*Content coming soon.*

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

