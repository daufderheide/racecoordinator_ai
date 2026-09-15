# UI Editor

## Overview

The UI Editor allows you to design custom raceday layouts, configure driver leaderboard columns, customize theme sound effects and assets, and load modular [Custom Widgets](custom-widgets.md).

## Custom Widgets & Widget Folder

Custom widgets can be added to your Custom UI layouts:
- **Custom Widgets Folder**: Set your local widgets folder in the **Custom UI** section at the bottom of the editor.
- **Update Sample Widgets**: Click **Update Sample Widgets** to generate or update ready-to-use sample widgets in a `sample/` folder (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget Toolbox Groups**: The Widget Toolbox organizes widgets into high-level groups (**Race Coordinator AI**, **Custom Root**, and custom folders like **sample**) with nested sub-groups (such as **Actions**) and an instant search filter.
- **Dynamic Inspector**: When a custom widget is selected on the canvas, its custom properties (colors, thresholds, toggles, text fields) appear dynamically in the Widget Inspector.

For complete widget development details, see the [Custom Widgets Guide](custom-widgets.md).

## Layout & Column Configuration

- Drag and drop widgets from the palette onto the canvas.
- Resize, reposition, and align widgets to match your screen resolution.
- Configure column order, column visibility, anchors, and width preferences.

## Timer Widget Configuration

The **Timer** widget displays the elapsed or remaining heat/race time with configurable presentation styles:

- **Display Format**:
  - **Dynamic (1:23 / 45s)**: Compact display that omits leading zeros and drops the minute unit when under one minute.
  - **Minutes & Seconds (01:23 / 00:45)**: Constant two-digit minutes and seconds, preventing character length jumps and auto-scale font resizing when dropping below one minute.
  - **Minutes & Seconds (1:23 / 0:45)**: Keeps minutes displayed below one minute (`0:45`), using single-digit minutes when over one minute (`1:23`).
  - **Full Clock (00:01:23 / 00:00:45)**: Fixed eight-character digital clock (`HH:MM:SS`), ideal for endurance racing.
  - **Total Seconds (83s / 45s)**: Displays total remaining or elapsed seconds without minute or hour subdivision.
- **Sub-second Timing**:
  - **When Below Threshold**: Shows fractional seconds (1 to 3 decimal places) when time drops below the configured threshold (e.g. final 10 seconds).
  - **Always**: Displays fractional seconds continuously throughout the entire heat.
  - **Never**: Restricts the timer to whole seconds only.
- **Live Preview**: The inspector includes an instant live preview demonstrating how the selected options format across different race time checkpoints (`> 1 hr`, `> 1 min`, `< 1 min`, and `< 10s`).



