# Custom Widgets

Race Coordinator AI allows you to create, customize, and place **Custom Widgets** within your race screen layouts or secondary displays without having to build a completely new page.

---

## Overview

Custom Widgets are self-contained visual components (such as live telemetry dials, lap time delta indicators, or sponsor marquees) that can be dragged directly onto your Custom UI layouts. Each widget can define its own settings schema to provide interactive controls (colors, thresholds, text inputs, toggles) directly inside the UI Editor's **Widget Inspector**.

---

## Starter Widget Examples

Race Coordinator AI includes three built-in starter widget examples that you can immediately export and test:

1. **`sample-telemetry-gauge`**: A live speedometer and telemetry dial that tracks speed, peak speed records, best lap times, and last lap times with configurable warning thresholds and dial accent colors.
2. **`sample-lap-delta`**: A real-time gap and lap delta timer comparing the current race leader (P1) against the closest competitor (P2).
3. **`sample-sponsor-banner`**: An animated sponsor ticker and announcement marquee with adjustable scrolling speeds and accent colors.

### Updating and Testing Sample Widgets

To load or update the sample widgets:
1. Open **Options -> Custom UI**.
2. Scroll to the **Custom UI** section at the bottom.
3. Under **Custom Widgets Folder**, click **Select Folder** and choose any folder on your computer.
4. Click the **Update Sample Widgets** button.
5. Race Coordinator AI will automatically generate/update the sample widgets inside a dedicated `sample/` folder in your selected directory and reload them into the **sample** group in the widget toolbox.

---

## Authoring Custom Widgets & Organizing Groups

Custom widgets are organized into groups and sub-groups in the Widget Toolbox based on your folder structure:
- Folders directly under your selected root folder become **Groups** (e.g. `sample/`, `my-pack/`).
- Subfolders within a group become **Sub-Groups** (e.g. `sample/telemetry/`).
- Standalone widget folders directly under root appear under **Custom Root**.

```text
MyCustomWidgets/
├── sample/                       # Group: "sample"
│   └── sample-telemetry-gauge/   # Widget in root of "sample" group
│       ├── widget.json           # Required: Manifest & settingsSchema
│       ├── widget.html           # Required: Angular template
│       ├── widget.css            # Optional: Scoped stylesheet
│       └── widget.ts             # Optional: Component logic
└── my-pack/                      # Group: "my-pack"
    └── my-widget/                # Widget in root of "my-pack" group
```

### Manifest Schema (`widget.json`)
The manifest configures metadata and inspector controls:

```json
{
  "id": "my-telemetry-widget",
  "name": "Telemetry Dial",
  "description": "Displays live telemetry stats",
  "defaultWidth": 400,
  "defaultHeight": 250,
  "settingsSchema": [
    {
      "key": "unitLabel",
      "label": "Unit Label",
      "type": "string",
      "default": "MPH"
    },
    {
      "key": "accentColor",
      "label": "Dial Color",
      "type": "color",
      "default": "#38bdf8"
    },
    {
      "key": "showMaxSpeed",
      "label": "Show Max Speed",
      "type": "boolean",
      "default": true
    },
    {
      "key": "warningThreshold",
      "label": "Warning Threshold",
      "type": "number",
      "default": 80,
      "min": 10,
      "max": 200
    }
  ]
}
```

### Template & Data Binding Reference

Custom widget templates (`widget.html`) and TypeScript components (`widget.ts`) have built-in access to all live race telemetry and configured settings:

#### 1. Live Race & Track Properties
- `raceName`: Name of the active race event (e.g. `"Grand Prix"`).
- `trackName`: Name of the active track.
- `formattedTime`: Current race clock / heat timer (`02:15.340`).
- `autoStatusLabel`: Race status (e.g., Green Flag, Caution, Yellow Flag, Warmup).
- `isWarmup`: Boolean indicating if currently in warmup mode.
- `totalHeats`: Total number of scheduled heats.
- `currentFlagUrl`: Image path for the active race flag.

#### 2. Standings & Telemetry Collections
- `driverStandings`: Array of overall participant standings objects:
  - `driver.name`: Driver name / nickname.
  - `driver.rank`: 1-based overall position (1, 2, 3...).
  - `driver.lapCount` / `driver.total_laps`: Number of laps completed.
  - `driver.total_time`: Total elapsed time in seconds.
  - `driver.best_lap_time`: Fastest lap time in seconds (e.g. `3.892`).
  - `driver.last_lap_time`: Most recent lap time in seconds.
  - `driver.avg_lap_time` / `driver.average_lap_time`: Average lap time in seconds.
  - `driver.gap_leader`: Gap to current race leader in seconds.
  - `driver.gap_position`: Gap to driver ahead in position.
- `heatDrivers`: Drivers currently competing in the active heat with lane assignments and live heat telemetry.

#### 3. Reading Configured Settings
- `getSetting('key', defaultValue)`: Helper function to read settings defined in your `settingsSchema`.
- `customSettings`: Direct key-value dictionary of all saved properties.

```html
<!-- Example: Using getSetting and driverStandings in widget.html -->
<div class="custom-card" [style.border-color]="getSetting('accentColor', '#38bdf8')">
  <h3>{{ raceName }} Leaderboard</h3>
  <div *ngFor="let d of driverStandings">
    <span>#{{ d.rank }} {{ d.name }}</span> - <span>{{ d.lapCount }} Laps</span>
  </div>
</div>
```

---

## Secondary & Fullscreen Displays via Themes

To display custom widgets on a dedicated secondary monitor or fullscreen television:

1. In the **UI Editor**, create a new Custom UI layout (e.g. *"Pit Wall Leaderboard"*).
2. Drag your custom widget onto the layout canvas and resize it to fill the screen.
3. In the **Themes** section of the UI Editor, create or select a Theme.
4. Set the theme's **Custom UI Layout** to *"Pit Wall Leaderboard"*.
5. In the **Raceday** screen or in a secondary window opened from the Theme menu, select this theme to display your fullscreen custom widget layout.
