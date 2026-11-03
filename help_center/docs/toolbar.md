# Toolbar Actions

The **Editor Toolbar** provides a standardized, unified set of controls across all management screens in Race Coordinator AI, including the Driver, Team, Track, Race, Layout, Theme, and Database editors.

## Overview {: #overview }

The toolbar standardizes the editor lifecycle across the entire application:

- **Read-Only Mode**: By default, opening an editor displays details in read-only mode. Form inputs are locked to prevent accidental modifications while allowing you to inspect properties, test audio cues, and explore settings safely.
- **Edit Mode**: Clicking the **Edit** (pencil) icon unlocks the editor controls for modification. While in Edit Mode, the top selector dropdown is locked to protect unsaved work.
- **Saving & Exiting**: Clicking **Done Editing** (checkmark) validates your changes, commits them to the local SQLite database, and returns the editor to Read-Only Mode.

## Icon Reference {: #icons }

Below is a complete description of each action icon that may appear on the editor toolbar:

### Edit / Done Editing {: #edit }
- **Icons**: `edit` (pencil) / `check` (checkmark)
- **Shortcut**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Description**: Toggles between Read-Only Mode and Edit Mode. When in Edit Mode, clicking the checkmark icon validates your changes, persists them to the server, and returns the editor to Read-Only Mode.

### Add / Create New {: #add }
- **Icon**: `add` (plus)
- **Description**: Creates a new blank item template and immediately enters Edit Mode so you can configure its properties.

### Duplicate / Save as New {: #copy }
- **Icon**: `content_copy` (overlapping documents)
- **Description**: Duplicates the currently selected item into a new profile or configuration with a unique name, allowing you to create variations quickly.

### Delete {: #delete }
- **Icon**: `delete` (trash can)
- **Description**: Permanently deletes the currently selected item after prompting for confirmation.

### Undo {: #undo }
- **Icon**: `undo` (counter-clockwise arrow)
- **Shortcut**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Description**: Reverts the last form field edit or configuration change made during the active editing session.

### Redo {: #redo }
- **Icon**: `redo` (clockwise arrow)
- **Shortcut**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` or `Ctrl+Y` (Windows/Linux)
- **Description**: Re-applies the most recent change that was reverted using Undo.

### Expand / Collapse All {: #expand-collapse }
- **Icon**: `unfold_more` / `unfold_less` (vertical arrows)
- **Description**: Expands or collapses all accordion sections in the editor at once, making it easy to see all fields or keep the screen clean.

### Activate Item {: #activate }
- **Icon**: `check_circle` (circled checkmark)
- **Description**: Sets the selected theme or profile as the active preset used during live racing sessions.

### Import {: #import }
- **Icon**: `download` / `file_upload` (downward arrow / tray)
- **Description**: Opens a file dialog to import profiles, databases, or asset configurations from external files (`.json`, `.zip`, `.csv`).

### Export {: #export }
- **Icon**: `upload` / `file_download` (upward arrow)
- **Description**: Exports the current configuration or database to an external archive (`.zip`, `.xlsx`, `.csv`) for backup or sharing.

### Reset to Factory Defaults {: #reset }
- **Icon**: `restart_alt` (counter-clockwise reset arrow)
- **Description**: Resets the current database or settings back to original factory defaults.

### Clear Layout {: #clear }
- **Icon**: `delete_sweep` (broom / sweep)
- **Description**: Clears the canvas or configuration back to an empty state in layout editing tools.

### Regenerate Heats {: #regenerate }
- **Icon**: `sync` (rotating arrows)
- **Description**: Re-runs the heat rotation generator to recalculate lane assignments and match-ups.

### Lane Distribution Check {: #lane-check }
- **Icon**: `check` (checkmark / balance)
- **Description**: Validates that all lanes are equally utilized across the scheduled heats. Displays a warning icon if an unequal distribution is detected.

### Zoom In / Out & Slider {: #zoom }
- **Icons**: `zoom_in` / `zoom_out` with slider
- **Description**: Adjusts the magnification level of the visual layout canvas between 50% and 150%.

### Usage Analytics Opt-In {: #analytics }
- **Icon**: `analytics` (bar chart with optional slash)
- **Description**: Toggles anonymous usage metrics and error telemetry on or off to help improve Race Coordinator AI.

### Guided Help Tour {: #help }
- **Icon**: `lightbulb` (lightbulb)
- **Description**: Launches an interactive, step-by-step guided walkthrough highlighting key sections and controls on the current page.

