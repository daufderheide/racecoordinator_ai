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

## Lane Column Widgets & Replication

The **Lane Column** widget allows individual data columns from the lane view (such as Driver Info, Last Lap Time, Best Lap / Personal Record, Fuel %, Last Laps history, Sector Speeds, Position, etc.) to be placed anywhere on the canvas as independent modular cards.

- **Binding Modes**:
  - **Physical Lane**: Binds the card to a specific track lane (Lane 1 through Lane 8). The card maintains that lane's data throughout the race.
  - **Heat Standings Position**: Binds the card to a current standings rank (1st Place, 2nd Place, etc.). The card dynamically follows position changes, leader overtakes, and adjusts its background/accent colors to match the lane of whoever is currently in that position.
- **Orientation**: Supports **Vertical** (stacked header over value) and **Horizontal** (side-by-side header and value) layouts.
- **Color Inheritance & Overrides**: Cards default to inheriting the assigned lane's background and foreground colors (`Use Lane Colors`), or can be given custom background, text, and border color overrides.
- **Replicate Across Lanes / Positions**:
  - Rather than creating and aligning cards for each lane manually, configure a single lane or position setup and click **Replicate Across Lanes / Positions...** in the inspector.
  - Choose the layout direction (**Horizontal** side-by-side or **Vertical** stacked), total target lanes/positions (defaulting to the maximum lane count across all tracks in the database), spacing mode (**Auto-fit to Canvas** or **Preserve Spacing**), and optionally replace existing widgets on target lanes.
  - **Realtime Replication Mode**: When replicating, the editor enters an interactive blueprint replication mode with visual lane cell guides and magnetic snapping. While in this mode, you place, resize, and design widgets in Lane 1 (Master), and changes immediately mirror in real time across all lanes. Mirrored widgets in Lanes 2..N are non-editable live previews; clicking on any mirrored widget directs focus to the Lane 1 master.
  - **Intelligent Grid Bounds & Resizing**: The replication space automatically expands in all four directions to fill available canvas space until meeting the boundary of any existing non-grid widget. You can adjust the overall replication area dynamically using the 8 perimeter resize handles on the blueprint overlay.
  - Clicking **Done** bakes the layout into independent widgets.
  - **Template Re-entry & Detach**: Selecting any baked grid widget later shows an inspector card allowing you to click **Edit Grid Template** to re-enter realtime replication mode anytime, or **Detach from Grid** to permanently break the link.
