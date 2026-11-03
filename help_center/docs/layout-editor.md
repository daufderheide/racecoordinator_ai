# Layout Editor

The **Layout Editor** provides a dedicated, full-screen canvas interface for customizing, organizing, and designing visual screen layouts for Race Coordinator AI. It shares the same unified toolbar, object selection, read-only protection, and edit mode lifecycle used across the Driver, Track, and Race editors.

---

## Overview & Navigation

The Layout Editor is accessible from several locations across the application:

- **Race Day Setup Toolbar**: Select **Config > Layout Editor** (`/layout-editor` or `/layout-manager`).
- **Race Day Manage Menu**: Select **Manage > Layout Editor** (`/layout-editor`). Navigating during an active race preserves race connection and state.
- **UI Editor**: Click **Open Layout Editor** from the UI Layouts section in the UI Editor (`/ui-editor`).

### Read-Only and Edit Mode Lifecycle

- **Read-Only Mode (Default)**: Layout properties, canvas widgets, dimensions, and inspector fields are protected against accidental modifications.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the layout canvas, zoom controls, widget repositioning/resizing, and inspector editing.
- **Auto-Save & Validation**: When leaving edit mode, changes are validated (e.g. ensuring a unique, non-empty layout name) and saved. Invalid configurations prompt an alert and keep the editor in Edit Mode.
- **Discard Changes**: Exiting or navigating away with unsaved edits displays the standard discard confirmation modal, protecting against data loss.
- **Undo / Redo**: Fully integrated with standard undo/redo controls (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> and <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Toolbar Actions

The top toolbar provides standardized management actions:

- **Layout Selector**: Dropdown to select any system or user-defined layout, sorted naturally with localized default names (*Default Raceday UI*, *Default Practice UI*, *Default Driver Station UI*).
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode.
- **Add Layout (<span class="material-icons">add</span>)**: Opens a template selection dialog allowing you to create a new layout from any default Race Coordinator AI layout (*RC AI*, *Practice*, *Fuel*, *Driver Station*) or start from a completely empty layout.
- **Copy Layout (<span class="material-icons">content_copy</span>)**: Duplicates the currently selected layout under a unique name (e.g. *Layout Name (Copy)*).
- **Delete Layout (<span class="material-icons">delete</span>)**: Deletes the current custom layout after confirmation. System default layouts are protected and cannot be deleted.
- **Help Tour (<span class="material-icons">help_outline</span>)**: Launches an interactive guided tour highlighting the layout selector, header actions, raceday canvas, widget library, and widget inspector.

---

## Canvas & Resolution Controls {: #layout-controls }

Located in the controls bar beneath the toolbar:

### Aspect Ratio & Resolution Presets
Select an aspect ratio preset (**16:9**, **16:10**, **4:3**, **21:9**, **Custom**) to automatically scale base canvas dimensions (e.g. 1920×1080, 1920×1200, 1440×1080).

### Scaling Modes
- **Auto-Fit (Uniform Scale)**: Preserves widget aspect ratio while fitting the target screen.
- **Stretch to Fit**: Stretches widgets independently across width and height.
- **Fixed / 1:1 Pixel Mapping**: Retains exact coordinate dimensions without scaling.

### Zoom Controls
- Adjust zoom smoothly from **25%** to **400%** using the **-** and **+** buttons or by typing a percentage directly.
- Click **Reset Zoom** to restore 100% zoom.
- Zoom settings are remembered in local browser storage per layout.

### Start Countdown Preview
- Click **Preview Lights** (<span class="material-icons">timer</span>) to toggle a live countdown light sequence preview on the canvas without starting an actual race.

### Widget Library & Configuration Controls {: #widget-panels }
- **Widget Library (<span class="material-icons">widgets</span>)**: Toggles visibility of the floating Widget Library toolbox. Clicking also unminimizes the toolbox and ensures it is clamped within the visible screen area if previously moved off-screen.
- **Widget Configuration (<span class="material-icons">tune</span>)**: Toggles visibility of the Widget Configuration sidebar panel. When hidden, the canvas can extend across the full width of the page if it makes sense for the layout's aspect ratio (just like in read-only mode).
- **Reset Position (<span class="material-icons">restart_alt</span>)**: Located in the floating toolbox header to instantly return the toolbox to its default top-left origin `(0, 0)`.
- **Minimize (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Collapses the toolbox to a compact header bar to free up canvas workspace while keeping the library immediately accessible.

---

## Widget Canvas & Inspector {: #canvas-and-widgets }

The canvas serves as an authentic live preview of your layout exactly as drivers and spectators will experience it during a race event. In **Edit Mode**, you can add, remove, reposition, resize, and configure the widgets that make up the layout.

### Canvas Interactions
- **Placement & Selection**: Click any widget directly on the canvas or pick it from the **Select Widget** dropdown in the top controls bar.
- **Repositioning & Sizing**: Drag widgets freely across the canvas. Use the Configuration Inspector panel to enter exact numeric **X**, **Y**, **Width**, and **Height** coordinates.
- **Keyboard Nudging**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Nudges the selected widget by 1px.
  - <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Nudges the selected widget by 10px.
  - <kbd>Delete</kbd> or <kbd>Backspace</kbd>: Removes the selected widget.
- **Replicate Lanes**: Replicate a selected lane column card across all active track lanes, heat positions, overall standings, or driver seeds.
- **Stacked Columns Detection & Repair**: The editor automatically detects duplicate or overlapping columns across lane grids. An alert banner provides one-click **Quick Fix** or **Review Issues** in an interactive dialog.

### Available Widgets & Configuration Options

Race Coordinator AI includes a comprehensive collection of built-in widgets:

1. **Leaderboard / Grid**:
   - **Purpose**: Displays a live tabular leaderboard of drivers, positions, lap counts, telemetry metrics, and gaps.
   - **Configuration Options**: Data source (**Heat Data** vs. **Overall Race Data**), custom column order and visibility, row heights, sorting rules, automatic paging for fields larger than the screen, and custom typography.
2. **Lane Column (Modular Cards)**:
   - **Purpose**: Renders telemetry data for a single lane, finishing position, or overall rank as an independent modular card.
   - **Configuration Options**: Target binding (**Track Lane 1–8**, **Heat Position**, **Overall Standings**, or **Driver Seed**), up to 8 perimeter **Inset Slots** (for avatars, secondary metrics, or custom badges), text alignment, and font scaling.
3. **Timer & Total Time**:
   - **Purpose**: Displays the heat remaining time, heat elapsed time, or overall event duration.
   - **Configuration Options**: Display presets (**Dynamic**, **Minutes & Seconds**, **Full Clock**, **Total Seconds**), sub-second precision thresholds (e.g. show decimals in the final 10 seconds), and format preview.
4. **Countdown Widget (Start Lights)**:
   - **Purpose**: Visual start sequence lights with synchronized start audio.
   - **Configuration Options**: Lamp count (1 to 10), horizontal or vertical orientation, fade-in animation, background blur, and lamp glow effects.
5. **Action Buttons**:
   - **Purpose**: Interactive touch and click buttons for race control.
   - **Configuration Options**: Trigger actions (**Start/Pause**, **Yellow Flag / Track Call**, **Audio Callout**, **Reset**, **Layout Switch**), custom button text, vector Material Icons, and color styling.
6. **Records Widget**:
   - **Purpose**: Displays track and session records (all-time fastest lap, fastest lane lap, total laps record) and driver achievements.
   - **Configuration Options**: Record metric types, title formatting, typography, and background styling.
7. **Image Widget**:
   - **Purpose**: Renders circuit diagrams, sponsor banners, club logos, and graphic assets.
   - **Configuration Options**: Image URL/path from asset manager, scaling mode (**Fit**, **Fill**, **Stretch**), opacity, and border radius.
8. **Text Info Widget**:
   - **Purpose**: Displays static titles, announcements, or dynamic race metadata tags (Race Name, Current Heat, Track Name).
   - **Configuration Options**: Text template with variable interpolation (`{race_name}`, `{heat_number}`), font size, alignment, and colors.
9. **Menu Widget**:
   - **Purpose**: Compact in-race overlay menu for quick access to sound toggles, layout switching, and race controls.
   - **Configuration Options**: Icon style, menu item visibility, and anchor positioning.
10. **Upcoming Heats (On Deck)**:
    - **Purpose**: Informs drivers of upcoming heat schedules and scheduled lane rotations.
    - **Configuration Options**: Number of upcoming heats to preview, driver name formatting, and layout spacing.
11. **Custom Widgets**:
    - **Purpose**: Dynamically loads external web components and telemetry gauges from your custom widgets folder.
    - **Configuration Options**: Custom property fields (colors, thresholds, toggles, text labels) defined in the widget manifest.

For complete widget styling details, formulas, and custom widget development, see the [UI Editor Guide](ui-editor.md) and [Custom Widgets Guide](custom-widgets.md).

---

## Import, Export & Migration

- **Import Layout**: Import an existing layout JSON file via the file input.
- **Export Layout**: Download the active layout as a standalone JSON file.
- **Pre-Migration Backups**: For layouts upgraded from legacy versions, restore pre-migration backup snapshots or export migration diagnostics for troubleshooting.
