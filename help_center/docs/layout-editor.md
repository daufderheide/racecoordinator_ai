# Layout Editor

The **Layout Editor** provides a dedicated, full-screen canvas interface for customizing, organizing, and designing visual screen layouts for Race Coordinator AI. It shares the same unified toolbar, object selection, read-only protection, and edit mode lifecycle used across the Driver, Track, and Race editors.

---

## Overview & Navigation

The Layout Editor is accessible from several locations across the application:

- **Race Day Setup Toolbar**: Select **Config > Layout Editor** (`/layout-editor` or `/layout-manager`).
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
- **Add Layout (<span class="material-icons">add</span>)**: Creates a new layout template based on the default system layout.
- **Copy Layout (<span class="material-icons">content_copy</span>)**: Duplicates the currently selected layout under a unique name (e.g. *Layout Name (Copy)*).
- **Delete Layout (<span class="material-icons">delete</span>)**: Deletes the current custom layout after confirmation. System default layouts are protected and cannot be deleted.
- **Help Tour (<span class="material-icons">help_outline</span>)**: Launches an interactive guided tour highlighting the layout selector, header actions, raceday canvas, widget library, and widget inspector.

---

## Canvas & Resolution Controls

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

### Widget Library & Toolbox Controls
- **Widget Library (<span class="material-icons">widgets</span>)**: Toggles visibility of the floating Widget Library toolbox. Clicking also unminimizes the toolbox and ensures it is clamped within the visible screen area if previously moved off-screen.
- **Reset Position (<span class="material-icons">restart_alt</span>)**: Located in the floating toolbox header to instantly return the toolbox to its default top-left origin `(0, 0)`.
- **Minimize (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Collapses the toolbox to a compact header bar to free up canvas workspace while keeping the library immediately accessible.

---

## Widget Canvas & Inspector

- **Placement & Selection**: Click any widget on the canvas or select it from the widget dropdown selector.
- **Repositioning & Sizing**: Drag widgets freely within the canvas bounds. Use the Inspector sidebar to enter exact numeric **X**, **Y**, **Width**, and **Height** values.
- **Keyboard Nudging**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Nudges the selected widget by 1px.
  - <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Nudges the selected widget by 10px.
  - <kbd>Delete</kbd> or <kbd>Backspace</kbd>: Removes the selected widget.
- **Replicate Lanes**: Replicate a selected lane column card across all active lanes, positions, overall standings, or driver seeds.
- **Stacked Columns Detection & Repair**:
  - The editor automatically detects duplicate or overlapping columns across lane grids.
  - An alert banner provides one-click **Quick Fix** or **Review Issues** in an interactive dialog.

---

## Import, Export & Migration

- **Import Layout**: Import an existing layout JSON file via the file input.
- **Export Layout**: Download the active layout as a standalone JSON file.
- **Pre-Migration Backups**: For layouts upgraded from legacy versions, restore pre-migration backup snapshots or export migration diagnostics for troubleshooting.
