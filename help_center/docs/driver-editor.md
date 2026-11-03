# Driver Editor

The **Driver Editor** allows you to create, view, and customize driver profiles, nicknames, avatars, and personalized audio callouts.

## Overview

The Driver Editor integrates driver selection and editing into a unified interface:

- **Driver Selector**: Located at the top header next to the page title, this dropdown lists all existing drivers and allows you to quickly switch between drivers, using previous and next buttons to browse through your roster with an active position counter (e.g., 1 / 8).
- **Read-Only Mode**: By default, opening the editor displays driver details in read-only mode. Form fields are locked to prevent accidental modifications while allowing you to audition audio clips.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the form inputs for editing. While in Edit Mode, the driver selector dropdown is locked to prevent accidental navigation away from unsaved edits.
- **Saving Changes**: Clicking the **Done Editing** (checkmark) icon validates your changes, saves them to the server, and returns the editor to Read-Only Mode.
- **Discarding Changes**: If you attempt to leave the editor with unsaved changes, the unsaved changes dialog prompts you to confirm. Discarding changes reverts all edits back to the last-saved version and restores Read-Only Mode.

## Toolbar Actions

The top toolbar provides quick access to common management actions. Click the pencil or checkmark button to switch between view and edit mode.

- **Back**: Returns to the previous view or Race Day Setup.
- **Add Driver (+)**: Creates a new driver template and enters Edit Mode.
- **Copy Driver**: Duplicates the currently selected driver profile into a new driver template.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode (keyboard shortcut: Cmd/Ctrl+E). When exiting Edit Mode, changes are validated and persisted.
- **Import Drivers**: Opens the Import Drivers modal to import driver profiles, avatars, and audio settings from external files.
- **Export Drivers**: Opens the Export Drivers modal to export drivers and their companion audio into a downloadable ZIP archive in CSV, Excel, or JSON format.
- **Expand / Collapse All**: Expands or collapses all accordion sections at once.
- **Delete Driver**: Deletes the selected driver profile after confirmation.
- **Help (?)**: Opens the interactive guided tour highlighting each section of the editor.

## Driver Profile {: #driver-profile }

Configure the driver's visual identity, text names, and classification labels:

- **Avatar**: Choose a custom image or preset icon to represent the driver on leaderboards and race displays. Click the avatar selector in Edit Mode to upload a new graphic or pick an existing asset.
- **Name**: The full official display name of the driver shown on leaderboards and race summary reports.
- **Nickname**: A shortened or phonetic callout name used for Text-to-Speech (TTS) race announcements.
- **Link Name & Nickname**: When linked, updating the Name field automatically mirrors the text into the Nickname field. Clicking the link icon unlinks them to allow distinct nicknames (e.g. "The Rocket" for "Dave Aufderheide").
- **Driver Labels**: Assign color-coded labels (similar to GitHub issue labels) to organize drivers into custom sets (such as "Pro", "Rookie", or "Class A"). Drivers can belong to any number of sets. In Edit Mode, click **Manage Labels** to create, edit, recolor, delete, or assign labels. On the Race Day Setup screen, you can filter available participants by label to quickly configure race rosters.

## Audio Callouts & Sounds {: #audio-callouts-sounds }

Configure personalized sound effects and Text-to-Speech (TTS) announcements for this driver across different racing events:

### Personal Lap Sounds {: #personal-lap-sounds }

- **Lap Audio**: Played upon completing a standard lap when no higher-priority record or lead sound is triggered.
- **Personal Best Lap**: Played when the driver records their best lap time of the current heat or session.

### Race & Heat Lap Sounds {: #race-lap-sounds }

- **Race Best Lap**: Played when the driver sets the fastest lap time of the active race across all lanes and competitors.
- **Race Lane Best Lap**: Played when the driver sets the fastest lap time of the active race in their assigned lane.
- **Heat Best Lap**: Played when the driver records the fastest lap time in the current heat.
- **New Race Leader**: Played when this driver takes over 1st place in overall race standings.
- **New Heat Leader**: Played when this driver takes over 1st place in the current heat.

### Overall Best Lap Sounds {: #overall-best-lap-sounds }

- **Overall Best Lap**: Played when the driver breaks the all-time track record fastest lap across all historical races.
- **Overall Lane Best Lap**: Played when the driver sets the all-time record fastest lap for a specific track lane across all historical races.

### Event Sounds {: #event-sounds }

- **Pit In Audio**: Played when the driver enters pit lane and begins refueling.
- **Fuel Level Sounds**: Verbal warnings or sound effects corresponding to driver fuel level thresholds (e.g. Warning, Low, Empty, Full).
- **False Start / Penalty Audio**: Played when a false start or jump start infraction is assessed against this driver.
- **Drift Lap Audio**: Played when a driver successfully triggers a drift sensor or drift condition.

## Importing Drivers

Race Coordinator AI supports batch importing drivers from external files, including bulk creation, conflict resolution, custom audio and image assets, and blank audio defaulting.

### Supported File Formats

- **CSV (`.csv`)**: Comma, semicolon, or tab-delimited text files. Column headers are matched flexibly (case-insensitive, ignoring whitespace and underscores).
- **Excel (`.xlsx`, `.xls`)**: Microsoft Excel spreadsheets. The first sheet is processed using header column names.
- **JSON (`.json`)**: An array of driver objects or an object containing a `"drivers"` array.
- **ZIP Package (`.zip`)**: A ZIP archive containing a data file (`drivers.csv`, `drivers.xlsx`, or `drivers.json`) alongside referenced audio (`.wav`, `.mp3`, `.ogg`) and avatar image files (`.png`, `.jpg`, `.jpeg`).

### Column & Field Mapping

The following columns and JSON fields are recognized:

| Field | Recognized Column Aliases | Description | Default / Fallback |
| :--- | :--- | :--- | :--- |
| **Name** | `Name`, `Driver`, `Driver Name`, `Full Name` | Full driver name (required). | None (row error if empty) |
| **Nickname** | `Nickname`, `Nick`, `Callout`, `Display Name` | Shortened or spoken callout name. | Falls back to **Name** if blank. Validated against duplicates. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Relative filename (e.g. `john.png`), asset name, or URL. | None |
| **Default Audio** | `Default Audio`, `Blank Audio`, `Audio Default` | Directive for blank audio slots: `none` / `muted` or `system` / `default`. | From file directive or modal selector |
| **Lap Audio** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Audio played on standard lap completion. | Defaulted per audio mode |
| **Personal Best Audio**| `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Audio played when setting personal best. | Defaulted per audio mode |
| **Track Record Audio** | `Track Record Audio`, `Track Record`, `Record Audio` | Audio played when breaking track record. | Defaulted per audio mode |
| **Race Lead Audio** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Audio played when taking the race lead. | Defaulted per audio mode |
| **Min Lap Time Audio** | `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Audio played when driver goes under min lap time. | Defaulted per audio mode |
| **Drift Lap Audio** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Audio played during drift lap. | Defaulted per audio mode |
| **False Start Audio** | `False Start Audio`, `False Start`, `Penalty Audio` | Audio played on false start or jump start. | Defaulted per audio mode |
| **Pit In Audio** | `Pit In Audio`, `Pit In`, `Pit Stop` | Audio played when entering pit lane. | Defaulted per audio mode |
| **Fuel Warning Audio** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Audio for low fuel warning. | Defaulted per audio mode |
| **Fuel Out Audio** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Audio when vehicle runs out of fuel. | Defaulted per audio mode |

### Audio Slot Syntax

Audio values can use any of the following formats:
- **`none`** or **`off`** / **`mute`**: Slot is muted (no audio).
- **`tts:<text>`** or **`${nickname} takes the lead`**: Text-to-Speech announcement. Single braces `{nickname}` and `${driver}` are supported.
- **`preset:<sound>`**: Uses built-in system sound (e.g. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Filename (e.g. `cheer.wav`, `v8_rev.mp3`)**: Refers to a companion media file dropped with the import or bundled inside a ZIP.

### File Directives for Blank Audio

You can declare how blank audio slots should be handled directly in the file:
- In CSV: `# default-audio: none` or `# default-audio: system` in comment headers.
- In JSON: `"default_audio": "none"` at the root object level.
- In Excel/CSV: Specify a `Default Audio` column per driver row.
- In UI: Use the **Blank Audio Slots** dropdown in the Import modal to override file defaults.

### Resource & Media Auto-Import

When importing drivers with custom avatars or sound effects:
1. **Multi-File Drag & Drop**: Drop your `.csv` or `.xlsx` file along with any `.wav`, `.mp3`, `.png`, or `.jpg` companion files simultaneously into the upload dropzone.
2. **ZIP Bundle**: Place your data file and media assets into a `.zip` archive and upload the archive.
3. **Automatic Registration**: The server ingests media into the internal Asset Manager, computes SHA-256 deduplication hashes, and automatically links the resulting assets to the respective driver avatars and audio slots.

### Conflict Resolution

When a driver in the file matches an existing driver name or nickname in the database, the interactive preview table identifies the conflict and offers three resolution policies:
- **Auto-Rename**: Renames the incoming driver (e.g. `Alice Walker (1)`) so existing profiles remain unchanged.
- **Overwrite Existing**: Updates the existing driver profile with the newly imported attributes, avatar, and audio configurations.
- **Skip**: Ignores the conflicting row during import.

You can set resolutions individually per row, apply a resolution to all conflicts at once, or edit the name and nickname inline in the preview table.

## Exporting Drivers

Race Coordinator AI allows you to export your drivers into a portable ZIP package that can be imported onto any other computer running Race Coordinator AI or used for bulk spreadsheet editing.

### Choosing an Export Format

When you click **Export Drivers** on the toolbar, you can select from three data formats:
- **CSV (`.csv`)**: Comma-separated values format, suitable for spreadsheet applications or text editors.
- **Excel (`.xlsx`)**: Microsoft Excel workbook format with styled column headers and formatted data rows.
- **JSON (`.json`)**: Formatted JSON array containing complete driver profile and audio configuration objects.

### Logical Sorting & Label Export

- **Logical Sorting**: In all export formats (CSV, Excel, and JSON), drivers are sorted logically by name so that numeric names follow intuitive ordering (e.g. `Driver 9` is listed before `Driver 10`).
- **Dedicated Label Columns**: Every possible driver label in the system is exported into its own dedicated column (`Label 1`, `Label 2`, `Label 3`, etc.), sorted logically by label name. If a driver has that label assigned, the cell contains the label name; if unassigned, the cell remains empty.
- **JSON Labels**: In JSON exports, each driver includes a `labels` array of assigned label names as well as individual `label1`, `label2`, etc. properties.
- **Label Auto-Creation on Import**: When importing drivers from any format, columns labeled `Label 1..N`, `labels` (comma-separated list), or matching existing label names are automatically recognized. Any imported labels not yet present in your database are automatically created and assigned upon commit, with randomized colors chosen to make each new label distinct from existing labels and other newly imported labels.

### Companion Audio & Media Bundling

- All audio files and avatar images (both custom media and default preset sounds or helmets) referenced by the exported drivers are automatically collected and packaged into the ZIP archive alongside the data file (`drivers.csv`, `drivers.xlsx`, or `drivers.json`). Default assets are bundled to make the archive fully self-contained, guaranteeing a seamless import even if default assets were removed or altered on the target system.
- **Deduplication**: If two or more drivers share the same sound effect or avatar image, the file is packaged **only once** inside the ZIP archive. Relative references in the export data file point to the shared asset name.
- **Preserved Presets & TTS**: Muted slots and custom Text-to-Speech (TTS) callouts are preserved in the export file.
- **Re-import Ready**: The resulting ZIP package is immediately ready to be dragged and dropped into the **Import Drivers** modal on any computer.
