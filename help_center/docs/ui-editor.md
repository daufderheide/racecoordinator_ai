# UI Editor

## Overview

The UI Editor allows you to design custom raceday layouts, configure driver leaderboard columns, customize theme sound effects and assets, and load modular [Custom Widgets](custom-widgets.md).

## Custom Widgets & Widget Folder

Custom widgets can be added to your Custom UI layouts:
- **Custom Widgets Folder**: Set your local widgets folder in the **Custom UI** section at the bottom of the editor.
- **Update Sample Widgets**: Click **Update Sample Widgets** to generate or update ready-to-use sample widgets in a `sample/` folder (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget Library Groups**: The Widget Library organizes widgets into groups (**Race Coordinator AI**, **Custom Root**, and custom folders like **sample**) with nested sub-groups (such as **Actions** and **Heat Data** with categorized subfolders) and an instant search filter.
- **Dynamic Configuration**: When a custom widget is selected on the canvas, its custom properties (colors, thresholds, toggles, text fields) appear dynamically in the Widget Configuration panel.

For complete widget development details, see the [Custom Widgets Guide](custom-widgets.md).

## Layout & Column Configuration

- Drag and drop widgets from the palette onto the canvas.
- Resize, reposition, and align widgets to match your screen resolution. All widgets are bounded to prevent dragging or resizing past the canvas frame.
- **Widget Configuration Controls**:
  - **Position & Size**: Precisely position and dimension the selected widget using the **X**, **Y**, **Width**, and **Height** numeric inputs.
  - **Delete Widget**: Click the trash icon in the configuration header to remove the selected widget.
- **Keyboard Shortcuts**:
  - <kbd>Delete</kbd> or <kbd>Backspace</kbd>: Removes the selected widget from the layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Nudges the selected widget by 1px (or 10px holding <kbd>Shift</kbd>).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Undo previous action (including widget deletions and nudges).
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>: Redo previous action.
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
- **Live Preview**: The configuration panel includes an instant live preview demonstrating how the selected options format across different race time checkpoints (`> 1 hr`, `> 1 min`, `< 1 min`, and `< 10s`).

> [!NOTE]
> These exact time formatting options (Display Format presets, Sub-second timing modes, threshold, and decimals slider with live preview) are also supported for **Total Time** widgets (Heat Total Time and Race/Overall Total Time) and for **Total Time** columns in the Lane View. In the Lane View column list, click the timer options icon (<span class="material-icons">more_time</span>) next to any Total Time column to customize its time format.

## Camera QR Code Widget

The **Camera QR Code** widget (found under the **Media & Chrome** toolbox palette) displays a scannable pairing QR code directly on your Raceday screen:

- **Instant Mobile Pairing**: Enables track marshals and drivers to connect a mobile device camera for optical lap detection without navigating to the Track Editor.
- **Interactive Details**: Clicking the widget on the live Raceday screen opens a modal dialog with an enlarged QR code, direct URL, one-click clipboard copying, and a local test launcher.
- **Network Resolution**: Dynamically provides either a secure Cloudflare HTTPS tunnel URL or your local network IP and port based on your current setup.

## Countdown Widget Configuration

The **Countdown** widget displays visual start lights and triggers start audio during the starting sequence:

- **Maximum Lamps**: Sets the maximum number of lamps to display (defaults to 5, range 1 to 10). When the start countdown duration exceeds this number (for example, a 6-second start countdown with 5 maximum lamps), all lamps remain off/dim for the initial difference (1 second) before sequentially illuminating the countdown lamps.
- **Fade In Animation**: Controls whether the countdown overlay and background blur smoothly fade in when the countdown begins. When unchecked, the lights and background appear immediately.
- **Orientation**: Switch between **Horizontal** and **Vertical** light bar arrangements.
- **Glow & Blur Effects**: Customize lamp illumination halos, red/green overlap scaling, and background blur amount or target area.

## Lane Column Widgets & Replication

The **Lane Column** widget allows individual data columns from the lane view (such as Driver Info, Last Lap Time, Best Lap / Personal Record, Fuel %, Last Laps history, Sector Speeds, Position, etc.) to be placed anywhere on the canvas as independent modular cards.

- **Target Driver & Standalone Cards**:
  - Individual cards placed outside of a grid select which driver to display: by **Track Lane** (Lane 1 through Lane 8), by **Heat Position** (1st, 2nd, etc.), by **Overall Standings** rank, or by **Driver Seed**.

### Grid Data Sources: Heat Data vs. Overall Race Data

Every data grid in the UI Editor has a **Data Source** setting on the Grid tab that dictates which drivers populate the grid rows:

- **Heat Data (`heat`)**:
  - **Driver Scope**: Binds exclusively to the participants actively racing in the current heat (`heatDrivers`).
  - **Display Behavior**: Only drivers currently on track in the active heat are shown. Resting drivers or participants scheduled in other heats are omitted.
  - **Paging & Scrolling**: Row count is bounded by the active heat drivers and physical track lanes. The grid will never scroll past the active heat participants into empty rows.
- **Overall Race Data (`overall`)**:
  - **Driver Scope**: Binds to **all registered participants** across the entire tournament or event (`participants`).
  - **Display Behavior**: Every driver registered in the event can be displayed in the grid, regardless of whether they are on track in the current heat or resting.
  - **Paging & Scrolling**: Row count reflects the entire tournament field (e.g. 16, 24, or 32 racers across multiple heats). If the grid has fewer visible rows than total participants, it automatically supports multi-page auto-scrolling to cycle through the full event standings.
  - **Off-Track Drivers**: For drivers not currently on track, cumulative participant statistics are supplied automatically.

### Widgets: Heat Data Widgets vs. Overall Race Data Widgets

The Toolbox organizes data columns and cards into **Heat Data** and **Overall Data** groups. The choice of widget determines what statistics are calculated and displayed for each row:

- **Heat Data Widgets** (e.g. *Lap Count, Last Lap Time, Heat Best Lap, Segment Time, Reaction Time, Heat Position / Rank, Heat Gaps, Fuel / Telemetry, Ghost Pacing*):
  - Extract performance metrics strictly from the **active heat**.
  - **In a Heat Data Grid**: Every row displays live, real-time telemetry and lap times for the cars currently racing on track.
  - **In an Overall Race Data Grid**: Drivers currently on track display their live heat telemetry; however, inactive or resting drivers who are not on track in this heat display dashes (`--`) or zeros for heat-specific metrics because they have no live heat data.
- **Overall Race Data Widgets** (e.g. *Overall Rank, Overall Total Laps, Overall Physical Laps, Overall Total Time, Best Race Lap Time, Overall Average Lap Time, Overall Median Lap Time, Overall Consistency, Overall Gaps, Win Probability / Predictions, Heats Raced / Heats Remaining*):
  - Extract cumulative performance metrics across **all completed heats** in the tournament.
  - **In an Overall Race Data Grid**: Every driver row (whether currently racing or resting in the pits between heats) displays their full cumulative race statistics, total tournament laps, event-best lap time, and tournament standing.
  - **In a Heat Data Grid**: The active heat drivers display their cumulative overall standings and event-wide statistics alongside their live heat metrics (e.g. showing a driver's overall tournament rank while watching their active heat laps).

#### Heats Raced & Remaining Widget

The **Heats Raced** (`heatsRaced`) widget displays heat participation progress for each competitor:

- **Heats Raced (Default Mode)**: Displays the number of heats the competitor has already completed or is currently racing in during the event.
- **Heats Remaining Mode**: When the widget's **Heats Display Mode** setting is toggled from *Heats Raced* to *Heats Remaining*, the card displays how many scheduled heats the driver still has left to run. If no custom column header label is provided, the header automatically changes from `HEATS RACED` to `HEATS REMAINING`.
- This configuration is also available for insets attached to any lane column card.

#### Gap Widgets (Gaps & Intervals)

Race Coordinator AI supports **4 distinct gap widgets** across both Heat Data and Overall Race Data:

1. **Gap to Leader (`gapLeader` / `overallGapLeader`)**: Standard continuous projected time gap behind the current race leader (P1).
2. **Gap to Position Ahead (`gapPosition` / `overallGapPosition`)**: Standard continuous projected time gap behind the car running immediately ahead in the standings.
3. **Formula 1 Gap to Leader (`gapLeaderF1` / `overallGapLeaderF1`)**: Exact start/finish line time differential behind the leader on the same lap, or lap deficit (`+1 Lap`, `+N Laps`) when lapped.
4. **Formula 1 Gap to Position Ahead (`gapPositionF1` / `overallGapPositionF1`)**: Exact start/finish line time differential behind the car ahead on the same lap, or lap deficit (`+1 Lap`, `+N Laps`) when lapped.

For complete mathematical formulas, finish type adaptations, and timing specifications, see the [Gap Calculations Guide](gap-calculations.md).

### Grid Sorting & Interaction Matrix

The **Grid Sorting** dropdown on the Grid tab controls the row ordering. Its behavior depends directly on whether the grid's **Data Source** is set to **Heat Data** or **Overall Data**:

| Sorting Option | In a Heat Data Grid (`gridType: heat`) | In an Overall Data Grid (`gridType: overall`) |
| :--- | :--- | :--- |
| **Track Lane** | Static ordering by physical track lane (Lane 1, Lane 2, ...). Each row is tied to a specific lane and its active driver. | Active drivers currently on track appear first in physical lane order (Lane 1, Lane 2, ...), followed by all resting/off-track participants sorted by their overall standings rank. |
| **Heat Position** | Dynamic live reordering by running position in the active heat (1st, 2nd, 3rd in the heat). Rows reorder live as cars cross the finish line and pass each other. | Active heat drivers appear at the top sorted by their live heat position (1st, 2nd, ...), followed by all inactive participants sorted by overall tournament rank. |
| **Overall Standings** | Sorts the **active heat drivers only** by their tournament/event standing. (For example, if drivers ranked 2nd, 5th, 8th, and 14th overall are competing in the heat, the 4 rows order them #2, #5, #8, #14). The grid never displays non-heat drivers or scrolls into empty rows. | Sorts the **entire field of event participants** by their overall race standings (1st overall, 2nd overall, 3rd overall, ...). The entire field dynamically reorders as cumulative points and laps update across the event. |
| **Driver Seed** | Sorts the active heat drivers by their initial qualifying/seed number (lowest seed first). | Sorts all event participants by initial qualifying/seed position (Seed 1, Seed 2, Seed 3, ...) across the entire field. |
- **Orientation**: Supports **Vertical** (stacked header over value) and **Horizontal** (side-by-side header and value) layouts.
- **Title Bar Styling & Customization**:
  - The title bar is styled identically to the Lane View column header by default (semi-transparent dark background `rgba(68, 68, 68, 0.7)`, bold white text, rounded top corners, and divider border).
  - **Show Header**: Toggle the title bar on or off. When disabled, the title bar is completely removed from the card, maximizing the area for primary values and insets.
  - **Custom Header Label**: Override the default data point name with custom title text.
  - **Typography & Alignment**: Customize the header font family, font size, and text alignment (Left, Center, Right).
  - **Header Text & Background Color**: Customize the title bar background color and text color with full color picker support and one-click reset to default.
- **Color Inheritance & Overrides**: Cards default to inheriting the assigned lane's background and foreground colors (`Use Lane Colors`), or can be given custom background, text, and border color overrides.
- **Replicate Across Lanes / Positions**:
  - Rather than creating and aligning cards for each lane manually, configure a single lane or position setup and click **Replicate Across Lanes / Positions...** in the configuration panel.
  - Choose the layout direction (**Horizontal** side-by-side or **Vertical** stacked), total target lanes/positions (defaulting to the maximum lane count across all tracks in the database), spacing mode (**Auto-fit to Canvas** or **Preserve Spacing**), and optionally replace existing widgets on target lanes.
  - **Realtime Replication Mode**: When replicating, the editor enters an interactive blueprint replication mode with visual lane cell guides and magnetic snapping. While in this mode, you place, resize, and design widgets in Lane 1 (Master), and changes immediately mirror in real time across all lanes. Mirrored widgets in Lanes 2..N are non-editable live previews; clicking on any mirrored widget directs focus to the Lane 1 master.
  - **Intelligent Grid Bounds & Resizing**: The replication space automatically expands in all four directions to fill available canvas space until meeting the boundary of any existing non-grid widget. You can adjust the overall replication area dynamically using the 8 perimeter resize handles on the blueprint overlay.
  - Clicking **Done** bakes the layout into independent widgets.
  - **Template Re-entry & Detach**: Selecting any baked grid widget later shows a configuration card allowing you to click **Edit Grid Template** to re-enter realtime replication mode anytime, or **Detach from Grid** to permanently break the link.

### Grid Synchronization: Link Columns vs. Mirror Rows

A grid in Race Coordinator AI is a two-dimensional matrix organized into:

- **Rows (Competitor Slots)**: Representing each individual physical track lane (**Lane 1, Lane 2, ...**) or race running position (**Position 1, Position 2, ...**). When the grid layout direction is horizontal, these competitor slots are displayed as vertical columns.
- **Columns (Data Fields)**: Representing each data metric displayed within a slot (e.g. *Driver Name, Heat Lap Count, Last Lap Time, Best Lap, Gap, Car Image*).

The Grid Inspector provides two core synchronization controls in the **Grid Structure & Layout** section: **Link Columns** and **Mirror Rows** (labeled **Mirror Columns** when grid layout direction is horizontal).

#### Link Columns

**Link Columns** governs visual styling synchronization across all the different data columns in the grid.

- **Checked (Default)**:
  - All data columns share identical visual styling.
  - Modifying any styling property on any column automatically and immediately synchronizes that change across all columns in the grid.
  - **Synchronized Properties**:
    - **Header Styling**: Font family, font size, text color, background color, text alignment, and header height.
    - **Data Cell Styling**: Font family, font size, text color, background color, lane color toggling (`useLaneColors`), and value alignment.
    - **Border Styling**: Border visibility, border color, border width, and corner radius.
    - **Time Formatting**: Decimal places, display format, and subsecond precision settings.
    - **Lap Telemetry Highlights**: Row highlight on lap trigger.
  - **Interaction with Unmirrored Rows**: When **Mirror Rows** is unchecked, rows are decoupled from each other. If **Link Columns** is enabled, modifying visual styles (such as background color, text color, or fonts) on any column within a row propagates that change across all columns in that specific row, without altering any other rows.
- **Unchecked**:
  - Uncouples column styling. Each column can have its own independent font sizes, colors, borders, and alignments (e.g. you can make the *Driver Name* column large and bold with a bright background, while keeping the *Laps* column smaller with a transparent background).
  - When unchecked, dedicated **Apply [Header / Value / Border / Format] Style to All Columns** buttons appear in the inspector under each styling section, allowing you to selectively push one specific category of styles across all columns on demand.
- **Unchecking Behavior**:
  - Takes effect immediately in configuration.
  - **Grid Visual State**: Existing column styles do **not** change immediately upon unchecking; the grid maintains its current appearance.
  - **User Action Required**: To see visual differences, the user must select a specific column and edit its style settings. Only the selected column will reflect the new edits.
- **Re-checking Behavior**:
  - Re-engages automatic synchronization for future edits.
  - **Grid Visual State**: Simply re-checking the box does **not** immediately overwrite other columns with the currently selected column's styling; existing column styles remain untouched.
  - **User Action Required**: The user must modify a styling property (e.g. change a font size by 1px, adjust a color, or toggle a border) on any column. As soon as that edit occurs, the updated property immediately propagates across all columns in the grid. Alternatively, the user can click any of the explicit "Apply Style to All Columns" buttons.

#### Mirror Rows (or Mirror Columns)

**Mirror Rows** governs row-to-row replication and geometry synchronization from the **Master Row (Lane 1 / Position 1)** to all other rows (**Lanes 2..N**).

- **Checked (Default)**:
  - All non-master rows strictly mirror the Master row.
  - Any movement, resizing, layout adjustments, or property changes made to the Master cell immediately replicate to all other lanes/positions in real time.
  - Non-master widgets in the grid are locked to the master and display the **Mirrored** badge (e.g. `Lane 2 (Mirrored)`).
- **Unchecked**:
  - Decouples non-master rows from the master template.
  - Non-master widgets display the **Independent** badge (e.g. `Lane 2 (Independent)`).
  - The user can click on any individual row (e.g. Lane 2 or Position 3) and customize its properties, text colors, background colors, or specific data overrides independently without altering the Master row or other lanes.
  - A **Re-mirror to All Rows** button appears directly beneath the checkbox in the inspector.
- **Unchecking Behavior**:
  - Takes effect immediately in configuration.
  - **Grid Visual State**: The grid layout and existing cell positions do **not** move or change immediately; current positions and styles are preserved.
  - **User Action Required**: The user must select a non-master cell (e.g. Lane 2) and modify its properties to introduce independent customizations.
- **Re-checking Behavior**:
  - Re-enables master replication across the grid.
  - **Immediate Grid Update**:
    - If the user re-checks the **Mirror Rows** checkbox while editing the **Master widget**, the Master row's layout and settings immediately re-synchronize down to all mirrored lanes, replacing any independent lane overrides.
    - If the user clicks the **Re-mirror to All Rows** button, the editor immediately re-synchronizes all master columns across all rows in the entire grid (`syncAllMasterWidgetsToLanes`), bakes the grid, and updates both the UI Editor canvas and the live raceday preview instantly without requiring any further action.

#### Summary Comparison

| Control | Direction / Scope | What It Synchronizes | Behavior When Unchecked | Behavior When Re-checked | Immediate vs. User Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Link Columns** | Horizontal (Across Columns) | Visual styling: fonts, sizes, text/bg colors, borders, header styles, time formats, highlights | Columns become independent; existing styles are retained; manual "Apply to All" buttons appear | Re-engages auto-sync for subsequent edits; does not instantly overwrite other columns | **User Action Required**: Changing the checkbox does not alter existing column styles. The user must edit a styling property for the new linking behavior to take effect across columns. |
| **Mirror Rows** | Vertical (Across Rows / Lanes) | Geometry and properties: cell width/height, offsets, bindings, and settings replicated from Lane 1 Master to Lanes 2..N | Rows become independent; inspector displays `Independent` badges; individual lanes can be customized; `Re-mirror to All Rows` button appears | Re-establishes master replication; master template overwrites independent lane customizations | **Immediate when Master is selected or button clicked**: Clicking `Re-mirror to All Rows` or re-checking on Master immediately snaps all rows to the Master. Unchecking preserves current layout until a row is edited. |
