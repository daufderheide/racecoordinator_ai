# Customizing XLS Export

Race Coordinator AI uses [Jxls](https://jxls.sourceforge.net/) to generate Excel (`.xlsx`) exports. Jxls transforms your Excel workbook into a dynamic template: you design the layout, colors, typography, formulas, and charts using Microsoft Excel or LibreOffice, and insert lightweight markup tags so Race Coordinator AI automatically fills in drivers, lap times, heat statistics, and season standings.

---

## Managing Export Templates in Race Coordinator AI

All template management is available directly in the application:

1. Open the Race Coordinator AI client.
2. Navigate to **UI Editor** (or press the **Settings** cog icon).
3. Scroll to the **Export Template** section (`#help-export-template`).

Here you have five actions:
- **Download Template**: Downloads the active template (either your custom template if one is selected, or the factory template if none is selected). This ensures you can always retrieve the exact template in use!
- **Select Custom Template**: Uploads your customized `.xlsx` template. Whenever you make edits in Excel, click this button again to re-upload your updated file (you do not need to reset to default first).
- **Test Export**: Immediately renders and downloads a sample Excel export using simulated race data so you can verify your template in 1 click without needing an active race or track hardware.
- **Variable Reference**: Opens an interactive in-app cheat sheet listing every available `${...}` variable with search and 1-click copy.
- **Reset to Default**: Clears your custom template and reverts to the built-in system template.

---

## The Microsoft Excel Trap: "Notes" vs. "Comments"

!!! danger "Crucial: Use 'Notes', NOT 'Comments'"
    In modern Microsoft Excel (Microsoft 365, Excel 2021, and Excel 2019), there are two distinct types of cell annotations:
    
    1. **Threaded Comments** (purple icon / chat bubble): Used for conversational replies. **Jxls cannot read these.** If you use "New Comment", your template directives will be completely ignored!
    2. **Legacy Notes** (yellow sticky note with a small red triangle in the top-right corner): **Jxls requires legacy Notes.**

### How to insert a Note in Excel:
- **Keyboard Shortcut**: Press `Shift + F2` (Windows) or `Shift + F2` / `Cmd + Shift + F2` (Mac).
- **Right-Click Menu**: Right-click the cell and select **New Note** (do *not* click "New Comment").
- **Ribbon Menu**: Go to the **Review** tab -> click **Notes** -> **New Note**.

---

## Understanding Jxls Directives

Jxls commands are written inside cell notes. The two most important commands are `jx:area` and `jx:each`.

### 1. `jx:area(lastCell="...")` (The Template Canvas)
Every sheet that uses Jxls markup **must** have a `jx:area` directive in cell `A1`. This directive tells Jxls the rectangular boundary of the template to process.

```text
jx:area(lastCell="P5")
```

!!! warning "The `lastCell` Silent Drop Trap"
    If you add a new column in Column `Q` or add rows down to Row `10`, but cell `A1` still has `lastCell="P5"`, Jxls **silently ignores** everything outside `A1:P5`!
    Whenever you add rows or columns to a sheet, always update `lastCell` in cell `A1` (and any enclosing `jx:each` loops).

### 2. `jx:each(items="..." var="..." lastCell="...")` (Vertical Looping)
Duplicates a range of rows for each item in a collection.

- **`items`**: The collection to iterate over (e.g. `standings`, `heat.drivers`, `laps`).
- **`var`**: The loop variable name (e.g. `driver`, `heatDriver`, `lap`).
- **`lastCell`**: The bottom-right cell of the repeating block.

*Example (Cell A5 Note):*
```text
jx:each(items="standings", var="driver", lastCell="P5")
```
When exported, Row 5 is duplicated for every driver in the standings.

### 3. `direction="RIGHT"` (Horizontal Column Expansion)
By default, `jx:each` duplicates rows downwards. Setting `direction="RIGHT"` duplicates columns across to the right. This is used for lane headers, lap breakdown columns, and segment times:

```text
jx:each(items="heat.columnHeaders", var="ch", direction="RIGHT", lastCell="B10")
```

### 4. `multisheet="..."` (Dynamic Tabs)
Clones an entire sheet for every item in a list:

```text
jx:each(items="heats", var="heat", multisheet="heatSheetNames", lastCell="I11")
```
This tells Jxls to clone the template sheet once per heat, naming the resulting tabs `Heat 1`, `Heat 2`, etc.

---

## Complete Variable Encyclopedia (`${...}` or `{...}`)

Expressions in template cells and notes can be enclosed in either `${...}` or `{...}` syntax (e.g. `${driver.bestLapTime}` or `{driver.bestLapTime}`). Race Coordinator AI automatically normalizes both formats, ensuring full interoperability with **Raceday Custom UI Widgets** and **Text-to-Speech (TTS) Audio Callouts** so you can copy and paste expressions between systems seamlessly. Property names use clean camelCase.

### 1. Overall Standings (`items="standings" var="driver"`)

Available on the `Overall Standings` sheet. Each item is a `RaceParticipant`.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${driver.rank}` | Integer | `1` | Finishing rank in the overall standings |
| `${driver.driver.name}` | String | `Dave` | Registered driver or team name |
| `${driver.totalLaps}` | Decimal | `45.820` | Cumulative total laps completed (including fractional lap) |
| `${driver.totalTime}` | Decimal | `184.210` | Cumulative total racing time across all heats in seconds |
| `${driver.bestLapTime}` | Decimal | `3.892` | Fastest single lap time recorded during the race |
| `${driver.averageLapTime}` | Decimal | `4.105` | Mean lap time across all completed laps |
| `${driver.medianLapTime}` | Decimal | `4.088` | Median lap time |
| `${driver.gapLeader}` | String | `+1.240` / `+2 Laps` | Gap to the overall race leader |
| `${driver.gapPosition}` | String | `+0.410` | Gap to the car in the next position ahead |
| `${driver.laneLaps[0]}` | Decimal | `12.0` | Total laps completed on **Lane 1** (0-indexed: `[0]` = Lane 1) |
| `${driver.laneLaps[1]}` | Decimal | `11.5` | Total laps completed on **Lane 2** |
| `${driver.laneLaps[2]}` | Decimal | `11.2` | Total laps completed on **Lane 3** |
| `${driver.laneLaps[3]}` | Decimal | `11.12` | Total laps completed on **Lane 4** |
| `${driver.positionPoints}` | Decimal | `25.0` | Points awarded for final overall finishing position |
| `${driver.overallBonusPoints}` | Decimal | `1.0` | Overall bonus points (e.g. fastest lap of the race) |
| `${driver.heatPositionPoints}` | Decimal | `15.0` | Sum of position points earned across individual heats |
| `${driver.heatBonusPoints}` | Decimal | `2.0` | Sum of bonus points earned across individual heats |
| `${driver.totalPoints}` | Decimal | `43.0` | Total points scored (`positionPoints + bonusPoints`) |

---

### 2. Heats & Heat Summaries (`items="heats" var="heat"`)

Available when looping over heats. Each item is a `Heat` object.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${heat.heatNumber}` | Integer | `1` | Number of the heat |
| `${heat.group}` | Integer/String | `1` | Assigned heat group |
| `${heat.getDriverNameOnLane(0)}` | String | `Austin` | Name of the driver assigned to **Lane 1** in this heat |
| `${heat.getDriverNameOnLane(1)}` | String | `Dave` | Name of the driver assigned to **Lane 2** in this heat |
| `${heat.getDriverNameOnLane(2)}` | String | `Abby` | Name of the driver assigned to **Lane 3** in this heat |
| `${heat.getDriverNameOnLane(3)}` | String | `Noah` | Name of the driver assigned to **Lane 4** in this heat |
| `${heat.drivers}` | List | - | List of `DriverHeatData` objects for drivers in this heat |
| `${heat.driverHeaders}` | List | - | List of driver names formatted for horizontal header expansion |
| `${heat.totalLapHeaders}` | List | - | List of total laps formatted for horizontal header expansion |
| `${heat.columnHeaders}` | List | - | Column titles (`Lane 1`, `Seg 1`, `Lane 2`...) for the lap grid |
| `${heat.lapRows}` | List | - | List of `HeatLapRow` objects representing lap rows in this heat |

---

### 3. Heat Driver Data (`items="heat.drivers" var="heatDriver"`)

Available on individual heat sheets inside the driver summary table.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${heatDriver.actualDriver.name}` | String | `Austin` | Name of the physical person driving (resolves team rotation) |
| `${heatDriver.driver.name}` | String | `Team Red` | Registered entry name |
| `${heatDriver.lane}` | Integer | `1` | Lane number for this heat (1-indexed: 1, 2, 3...) |
| `${heatDriver.adjustedLapCount}` | Decimal | `15.420` | Laps completed in this specific heat |
| `${heatDriver.totalTime}` | Decimal | `60.050` | Total time run in this heat in seconds |
| `${heatDriver.bestLapTime}` | Decimal | `3.912` | Fastest lap time in this heat |
| `${heatDriver.averageLapTime}` | Decimal | `4.110` | Average lap time in this heat |
| `${heatDriver.medianLapTime}` | Decimal | `4.095` | Median lap time in this heat |
| `${heatDriver.gapLeader}` | String | `+0.850` | Gap to the heat winner |
| `${heatDriver.gapPosition}` | String | `+0.210` | Gap to the driver immediately ahead in this heat |

---

### 4. Heat Lap & Segment Matrix (`items="heat.lapRows" var="lap"`)

Available in the detailed lap breakdown grid on heat sheets.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${lap.lapNumber}` | Integer | `1` | Lap sequence number (`1`, `2`, `3`...) |
| `${val}` | Decimal | `4.120` | Dynamic cell value expanded horizontally via `${lap.values}` (contains the lap time or segment time for each lane) |
| `${dh}` | String | `Austin` | Driver name header expanded via `${heat.driverHeaders}` |
| `${tlh}` | Decimal | `15.42` | Driver total laps header expanded via `${heat.totalLapHeaders}` |
| `${ch}` | String | `Lane 1` / `Seg 1` | Column header expanded via `${heat.columnHeaders}` |

---

### 5. Driver Statistics & Consistency (`items="driverSummaries" var="ds"`)

Available on the `Driver Template` sheet, duplicated once per driver via `multisheet="driverSheetNames"`.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${ds.driverName}` | String | `Austin` | Name of the driver for this sheet |
| `${ds.laneStats}` | List | - | List of per-lane statistics for this driver |
| **Lane Stat (`var="ls"`)** | | | |
| `${ls.laneName}` | String | `Lane 1` | Name of the lane |
| `${ls.totalLaps}` | Decimal | `15.0` | Laps driven by this driver on this lane |
| `${ls.totalTime}` | Decimal | `60.120` | Time spent on this lane in seconds |
| `${ls.bestLapTime}` | Decimal | `3.850` | Fastest lap on this lane |
| `${ls.averageLapTime}` | Decimal | `4.020` | Average lap time on this lane |
| `${ls.medianLapTime}` | Decimal | `3.990` | Median lap time on this lane |
| `${ls.standardDeviation}` | Decimal | `0.112` | Standard deviation (lap-to-lap variance) |
| `${ls.consistencyScore}` | Decimal | `97.8` | Consistency score as a percentage (higher = more consistent) |
| `${ls.averageTop5}` | Decimal | `3.890` | Average time of driver's top 5 fastest laps |
| `${ls.averageTop10}` | Decimal | `3.940` | Average time of driver's top 10 fastest laps |
| `${ls.averageTop15}` | Decimal | `3.990` | Average time of driver's top 15 fastest laps |
| `${ls.top2Consecutive}` | Decimal | `7.720` | Combined time of driver's fastest 2 consecutive laps |
| `${ls.top3Consecutive}` | Decimal | `11.590` | Combined time of driver's fastest 3 consecutive laps |

---

### 6. Raw Lap Log (`items="laps" var="lap"`)

Available on the `Lap Data` sheet for deep data analysis or importing into database tools.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${lap.driverName}` | String | `Team Red` | Registered entry name |
| `${lap.actualDriverName}` | String | `Austin` | Person who completed the lap |
| `${lap.heatNumber}` | Integer | `1` | Heat number |
| `${lap.laneNumber}` | Integer | `2` | Lane number |
| `${lap.absoluteHeatLapTime}` | Decimal | `12.450` | Timestamp from heat start when the lap completed |
| `${lap.absoluteLapTime}` | Decimal | `142.150` | Timestamp from overall race start |
| `${lap.lapTime}` | Decimal | `4.102` | Duration of this individual lap in seconds |
| `${segment}` | Decimal | `1.420` | Individual sector/segment time (if sectors are enabled) |

---

### 7. Season Standings (`items="seasonStandings" var="standing"`)

Available when the race is part of a championship season.

| Variable Expression | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `${seasonName}` | String | `Summer Slot Car Championship` | Name of the active season |
| `${standing.rank}` | Integer | `1` | Current season standing rank |
| `${standing.driverName}` | String | `Dave` | Driver name |
| `${standing.netPoints}` | Decimal | `95.0` | Points counted toward the championship (after drops) |
| `${standing.grossPoints}` | Decimal | `110.0` | Total unadjusted points scored |
| `${standing.racesRun}` | Integer | `5` | Number of season events participated in |

---

### 8. Race & Track Metadata (`var="race"`)

Available on the `Race Information` sheet.

| Variable Expression | Example | Description |
| :--- | :--- | :--- |
| `${race.name}` | `Friday Night Shootout` | Name of the race event |
| `${race.startTime}` | `2026-09-11 19:30:00` | Start date and time of the event |
| `${race.track.name}` | `Monza Oval` | Configured track name |
| `${race.track.sections}` | `3` | Number of track sectors/segments configured |
| `${race.raceModel.minLapTime}` | `2.5` | Minimum lap time filter threshold |
| `${race.raceModel.heatRotationType}` | `Round Robin` | Configured heat rotation method |
| `${race.raceModel.heatScoring.finishMethod}` | `Lap Limit` | Finish condition (Lap Limit, Time Limit, etc.) |
| `${race.raceModel.heatScoring.finishValue}` | `20` | Finish target value (e.g. 20 laps or 120 seconds) |

---

## Dissection of the 7 Default Template Sheets

Here is how each sheet in `race_export_template.xlsx` works under the hood:

### 1. `Season Standings`
- **Cell `A1` Note**: `jx:area(lastCell="E6")`
- **Cell `A6` Note**: `jx:each(items="seasonStandings" var="standing" lastCell="E6")`
- **Explanation**: A straightforward single-table vertical loop. If the race does not belong to a season, Race Coordinator AI automatically omits this sheet from the export.

### 2. `Race Information`
- **Cell `A1` Note**: `jx:area(lastCell="B81")`
- **Cell `A10` Note**: `jx:each(items="race.track.lanes", var="lane", lastCell="B10")`
- **Explanation**: Injects scalar race configuration properties (e.g. `${race.name}`) into cells `B6:B9` and iterates track lanes dynamically in rows 10+.

### 3. `Heat List`
- **Cell `A1` Note**: `jx:area(lastCell="C5")`
- **Cell `A5` Note**: `jx:each(items="allHeats", var="heat", lastCell="C5")`
- **Explanation**: Uses `${heat.getDriverNameOnLane(0)}`, `${heat.getDriverNameOnLane(1)}`, etc., to build a grid of which driver is on which lane for every scheduled heat. Race Coordinator AI dynamically inserts additional lane columns based on how many lanes your track has.

### 4. `Overall Standings`
- **Cell `A1` Note**: `jx:area(lastCell="P5")`
- **Cell `A5` Note**: `jx:each(items="standings", var="driver", lastCell="P5")`
- **Explanation**: The main leaderboard. Columns `E` and `F` reference `${driver.laneLaps[0]}` and `${driver.laneLaps[1]}`. When your track has 4, 6, or 8 lanes, Race Coordinator AI automatically expands columns and copies cell styles to accommodate all lanes.

### 5. `Heat Template` (Dual-Table Sheet)
- **Cell `A1` Note**: `jx:area(lastCell="I11")` and `jx:each(items="heats", var="heat", multisheet="heatSheetNames", lastCell="I11")`
- **Table 1 (Driver Summaries, Rows 4–5)**:
  - Cell `A5` Note: `jx:each(items="heat.drivers", var="heatDriver", lastCell="I5")`
  - Loops vertically over each driver in the heat.
- **Table 2 (Lap & Segment Matrix, Rows 8–11)**:
  - Cell `B8` Note: `jx:each(items="heat.driverHeaders", var="dh", direction="RIGHT", lastCell="B8")` (expands driver names horizontally).
  - Cell `B9` Note: `jx:each(items="heat.totalLapHeaders", var="tlh", direction="RIGHT", lastCell="B9")` (expands total laps horizontally).
  - Cell `B10` Note: `jx:each(items="heat.columnHeaders", var="ch", direction="RIGHT", lastCell="B10")` (expands lane headers and segment columns horizontally).
  - Cell `A11` Note: `jx:each(items="heat.lapRows", var="lap", lastCell="B11")` (loops vertically over lap numbers).
  - Cell `B11` Note: `jx:each(items="lap.values", var="val", direction="RIGHT", lastCell="B11")` (expands lap & segment times horizontally across the columns).
- **Lane Coloring**: Race Coordinator AI automatically detects lane numbers and applies your track's configured lane colors (e.g. Red, White, Blue, Yellow) to both Table 1 rows and Table 2 columns.

### 6. `Driver Template`
- **Cell `A1` Note**: `jx:area(lastCell="B16")` and `jx:each(items="driverSummaries", var="ds", multisheet="driverSheetNames", lastCell="B16")`
- **Cell `B4` Note**: `jx:each(items="ds.laneStats", var="ls", direction="RIGHT", lastCell="B16")`
- **Explanation**: Clones one sheet per driver. Loops horizontally across columns `B`, `C`, `D`... to place each lane's statistics side-by-side.

### 7. `Lap Data`
- **Cell `A1` Note**: `jx:area(lastCell="H2")`
- **Cell `A2` Note**: `jx:each(items="laps", var="lap", lastCell="H2")`
- **Cell `H2` Note**: `jx:each(items="lap.segments", var="segment", direction="RIGHT", lastCell="H2")`
- **Explanation**: Flat, database-ready log. Lists every single lap chronologically with sector times expanding to the right.

---

## Step-by-Step Cookbook Recipes

### Recipe 1: Adding a Column to Overall Standings (e.g. Median Lap Time)

1. Open `race_export_template.xlsx` in Excel.
2. Select the `Overall Standings` sheet.
3. Right-click column header `J` (Gap to Leader) and click **Insert** (this creates a new blank column `J`).
4. In cell `J4`, type the column header: `Median Lap Time`.
5. In cell `J5`, type the variable expression: `${driver.medianLapTime}`.
6. Format cell `J5` (e.g., center alignment, `0.000` number format).
7. **Update the Notes**:
   - Right-click cell `A1` -> **Edit Note**. Change `lastCell="P5"` to `lastCell="Q5"`.
   - Right-click cell `A5` -> **Edit Note**. Change `lastCell="P5"` to `lastCell="Q5"`.
8. Save the file, upload it in Race Coordinator AI, and click **Test Export** to verify your new column appears.

---

### Recipe 2: Removing Sheets You Do Not Need

If your club does not want individual driver analysis sheets or raw lap logs:
1. Open your custom `.xlsx` in Excel.
2. Right-click the `Driver Template` tab -> click **Delete**.
3. Right-click the `Lap Data` tab -> click **Delete**.
4. Save the workbook.
Race Coordinator AI will seamlessly process only the remaining sheets (`Overall Standings`, `Heat List`, `Heat Template`, etc.).

---

### Recipe 3: Adding Native Excel Formulas (e.g. Summary Rows)

Jxls supports standard Excel formulas alongside template tags:
1. Below your data rows (e.g. in Row 7 under a table spanning rows 4–5):
2. Type `=AVERAGE(D5:D5)` or `=SUM(C5:C5)`.
3. When Jxls expands Row 5 for 20 drivers, it automatically updates Excel formula ranges (e.g. `=AVERAGE(D5:D24)`).

---

## Frequently Asked Questions & Troubleshooting

### Q: Why are my newly added cells completely blank in the exported file?
**A:** Check cell `A1` on that sheet! You likely forgot to update `lastCell=".."` in the `jx:area` note. If your new column is in Column `J` but `lastCell` says `I5`, Jxls ignores Column `J`.

### Q: Why did Jxls ignore the comment I typed?
**A:** You probably inserted a modern Microsoft Excel **Comment** instead of a legacy **Note**. Delete the comment, right-click the cell, and select **New Note** (yellow box with a red triangle in the corner).

### Q: Why is my variable showing literally as `${driver.bestLapTime}` instead of a number?
**A:** Check for typos. Property names are case-sensitive. `${driver.bestLapTime}` works, but `${driver.bestlaptime}` or `${driver.BestLapTime}` will fail.

### Q: Why didn't my Excel edits appear after I saved the file?
**A:** Race Coordinator AI stores template files internally in its configuration. When you edit and save your template file in Microsoft Excel, Race Coordinator does not automatically monitor or reload files from your disk. To apply your changes, return to **Settings -> UI Editor -> Export Template** and click **Select Custom Template (.xlsx)** again to re-upload your modified file. You do **not** need to reset to default first!

### Q: How do I get a copy of the template currently in use?
**A:** Click **Download Template** in **Settings -> UI Editor -> Export Template**. If a custom template is currently selected, it downloads that custom template; if no custom template is selected, it downloads the default factory template.

### Q: Can I use Excel formatting (decimal places, bold fonts, borders)?
**A:** Yes! Any formatting you apply to the template cells (font colors, borders, number formatting like `0.000`, alignment) is preserved by Jxls when data is injected.

