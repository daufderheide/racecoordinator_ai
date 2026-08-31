# Custom Widgets Guide

Race Coordinator AI allows you to build, import, and arrange **Custom Widgets** within your raceday layouts and multi-screen displays without needing to rewrite entire pages from scratch.

---

## Overview: Custom Widgets vs Custom UI

| Feature | Custom Widgets | Custom UI |
| :--- | :--- | :--- |
| **Scope** | Modular visual components (e.g. Telemetry gauges, Delta timers, Sponsor tickers) | Full page replacements (`raceday`, `raceday-setup`, etc.) |
| **Placement** | Can be dragged, resized, and placed on any Custom UI canvas | Replaces the entire page layout and rendering tree |
| **Inspector Controls** | Configurable via schema-driven inspector properties in UI Editor | Controlled directly via custom code |
| **Multi-Screen Displays** | Add to custom layouts and assign to Themes for dedicated secondary screens | Dedicated screen files |

---

## Setting the Custom Widgets Folder

To enable custom widgets:

1. Launch **Race Coordinator AI**.
2. Open the **Options** menu from the main screen.
3. Select **Custom UI** (UI Editor).
4. Scroll down to the **Custom UI** section.
5. In the **Custom Widgets Folder** selector, click **Select Folder** and choose a local directory where your widget subfolders reside.
6. The app will immediately scan all subdirectories, compile the widgets, and register them into the widget palette.

> [!TIP]
> **Starter Widget Examples**: If your folder is empty or you want reference examples, click the **Update Sample Widgets** button in the UI Editor. Race Coordinator AI will automatically generate ready-to-use sample widgets in your selected folder:
> - `sample-telemetry-gauge/`: Live speedometer and telemetry gauge with configurable colors and thresholds.
> - `sample-lap-delta/`: Real-time lap time deltas and intervals between race leaders.
> - `sample-sponsor-banner/`: Animated sponsor ticker and announcement marquee.
> - `sample-detailed-leaderboard/`: Rich leaderboard with configurable columns and row limits.

---

## Widget Structure & Files

Each custom widget lives in its own dedicated subfolder inside your selected Custom Widgets directory:

```text
MyCustomWidgets/
├── my-telemetry-gauge/
│   ├── widget.json       # Required: Manifest & schema definition
│   ├── widget.html       # Required: Angular template
│   ├── widget.css        # Optional: Scoped CSS styling
│   └── widget.ts         # Optional: TypeScript component class
└── my-sponsor-banner/
    ├── widget.json
    └── widget.html
```

### 1. `widget.json` (Manifest)

The manifest defines widget metadata, default dimensions, and custom property schemas displayed in the UI Editor Inspector:

```json
{
  "id": "my-telemetry-gauge",
  "name": "Live Telemetry",
  "version": "1.0.0",
  "description": "Displays live driver telemetry and lap records",
  "author": "Track Operator",
  "defaultWidth": 400,
  "defaultHeight": 250,
  "minWidth": 200,
  "minHeight": 150,
  "settingsSchema": [
    {
      "key": "unitLabel",
      "label": "Unit Label",
      "type": "string",
      "default": "MPH"
    },
    {
      "key": "showMaxSpeed",
      "label": "Show Max Speed",
      "type": "boolean",
      "default": true
    },
    {
      "key": "dialColor",
      "label": "Dial Color",
      "type": "color",
      "default": "#38bdf8"
    },
    {
      "key": "warningThreshold",
      "label": "Warning Threshold",
      "type": "number",
      "default": 80,
      "min": 10,
      "max": 200,
      "step": 5
    },
    {
      "key": "displayMode",
      "label": "Display Mode",
      "type": "select",
      "default": "full",
      "options": [
        { "label": "Full Dial", "value": "full" },
        { "label": "Compact Bar", "value": "compact" }
      ]
    }
  ]
}
```

#### Supported Schema Field Types:
- `boolean`: Checkbox toggle.
- `number`: Numeric input with optional `min`, `max`, and `step`.
- `string`: Text input field.
- `color`: Interactive color picker with hex code support.
- `select`: Dropdown menu with defined `{ label, value }` options.

---

## Template & Data Binding Reference

When building `widget.html` and `widget.ts`, your template and component automatically inherit from `CustomWidgetBaseComponent`. All of the following properties, data structures, and helper methods are available directly in your template expressions (`{{ }}`) and TypeScript code (`this.`):

### 1. General Race & Event Telemetry

| Binding / Property | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `raceName` | `string` | Name of the active race event | `{{ raceName }}` |
| `trackName` | `string` | Name of the active track | `{{ trackName }}` |
| `formattedTime` | `string` | Current race clock formatted as `MM:SS.mmm` | `{{ formattedTime }}` |
| `autoStatusLabel` | `string` | Status message (e.g., Green Flag, Caution, Warmup) | `{{ autoStatusLabel }}` |
| `isWarmup` | `boolean` | `true` if current heat is in warmup mode | `<div *ngIf="isWarmup">` |
| `totalHeats` | `number` | Total number of heats scheduled in the race | `{{ totalHeats }}` |
| `currentFlagUrl` | `string` | Image path for the current race flag status | `<img [src]="currentFlagUrl">` |

---

### 2. Driver Standings & Leaderboard Data

#### `driverStandings`
An array of sorted participant standings. Each object in `driverStandings` contains:

```typescript
{
  name: string;              // Driver nickname or full name (e.g. "Dave", "Speedy")
  rank: number;              // 1-based position: 1, 2, 3, etc.
  rankValue: number;         // Current score (lap count or total time)
  lapCount: number;          // Number of laps completed
  total_laps: number;        // Alias for lapCount
  total_time: number;        // Elapsed race time in seconds (e.g. 112.13)
  best_lap_time: number;     // Fastest lap time in seconds (e.g. 4.125)
  last_lap_time: number;     // Most recent lap time in seconds (e.g. 4.301)
  avg_lap_time: number;      // Average lap time in seconds (e.g. 4.250)
  gap_leader: number;        // Gap to current race leader in seconds
  gap_position: number;      // Gap to preceding driver position
  driver: Driver;            // Full driver domain object (id, avatar, car, etc.)
}
```

*Template Example:*
```html
<div class="leader-banner" *ngIf="driverStandings.length > 0">
  <span>Leader: {{ driverStandings[0].name }}</span>
  <span>Best Lap: {{ driverStandings[0].best_lap_time.toFixed(3) }}s</span>
</div>

<table class="standings-table">
  <tr *ngFor="let driver of driverStandings">
    <td>#{{ driver.rank }}</td>
    <td>{{ driver.name }}</td>
    <td>{{ driver.lapCount }} Laps</td>
    <td>{{ driver.best_lap_time ? driver.best_lap_time.toFixed(3) + 's' : '--.---' }}</td>
  </tr>
</table>
```

#### `heatDrivers`
An array of drivers currently on track in the active heat, including their assigned lanes and live status.

---

### 3. Inspector Settings & Configurations

| Method / Property | Description | Example |
| :--- | :--- | :--- |
| `getSetting(key, default)` | Reads a user-configured setting defined in `settingsSchema`, falling back to `default` if unset | `getSetting('unitLabel', 'MPH')` |
| `customSettings` | Dictionary object of all raw configured values | `customSettings['dialColor']` |

*Template Example:*
```html
<div class="custom-card" 
     [style.background]="getSetting('cardBgColor', 'rgba(15, 23, 42, 0.85)')"
     [style.border-color]="getSetting('accentColor', '#38bdf8')">
  <h3 *ngIf="getSetting('showTitle', true)">{{ getSetting('customTitle', 'Live Telemetry') }}</h3>
</div>
```

---

### 4. Injected Application Services (TypeScript)

In `widget.ts`, you have direct access to injected services:
- `this.dataService`: Access to WebSocket messages, database queries, and live updates.
- `this.raceService`: Race state engine and race control events.
- `this.settingsService`: General application settings and sound preferences.
- `this.themeService`: Active theme palette tokens and custom UI styling.
- `this.translationService`: Localization strings.

---

### 5. Template Syntax Guidelines

Dynamic widgets are compiled at runtime using Angular:
- **Conditionals**: Use standard `*ngIf="condition; else fallbackTemplate"`.
- **Loops / Lists**: Use `*ngFor="let item of list"`.
- **Interpolation**: Use standard `{{ value }}`.
- **Null Safety**: Use safe navigation operators `{{ driverStandings[0]?.name }}` or `*ngIf` guards to handle states before a race begins.
- **Pipes**: Standard pipes (`number`, `date`, `translate`, `async`) are available.

---

## Adding Custom Widgets to Layouts

1. Open **Options -> Custom UI**.
2. Expand the **Custom UI Layouts** section and select a layout (or create a new one).
3. In the widget toolbox on the left, your custom widgets will appear alongside standard widgets.
4. Drag the widget onto the preview canvas.
5. Click on the widget to select it; the **Widget Inspector** on the right will dynamically render all properties defined in your `settingsSchema`.
6. Position, resize, and configure the properties as desired.

---

## Fullscreen & Secondary Displays via Themes

To use custom widgets on secondary monitor displays or fullscreen setups:

1. In the **UI Editor**, create a new Custom UI (e.g. named *"Pit Lane Telemetry"*).
2. Add your custom widget(s) (such as `sample-telemetry-gauge` or `sample-lap-delta`) and scale them to fill the desired canvas resolution.
3. Scroll to the **Themes** section in the UI Editor and create or edit a Theme (e.g. *"Telemetry Screen"*).
4. In the Theme's settings, set **Custom UI Layout** to your newly created layout (*"Pit Lane Telemetry"*).
5. On the **Raceday** screen or secondary monitor window, select this Theme from the menu to display the fullscreen widget view.
