# Race Coordinator AI - Driver Import Test Samples

This directory contains test files designed to test and verify the driver import engine across formats (`.csv`, `.xlsx`, `.json`, `.zip`), directives, collision resolution strategies, and automatic media asset importing.

---

## Sample Files Overview

| File | Format | Primary Test Focus | Expected Result |
| :--- | :--- | :--- | :--- |
| [`01_basic_drivers.csv`](file:///Users/dave/dev/racecoordinator_ai/sample_imports/01_basic_drivers.csv) | CSV | `# default-audio: none` directive, TTS variable interpolation (`${nickname}`), omitted nickname fallback | **5 Valid**, 0 Conflicts, 0 Errors |
| [`02_conflict_resolution.csv`](file:///Users/dave/dev/racecoordinator_ai/sample_imports/02_conflict_resolution.csv) | CSV | Existing database driver collisions, in-file duplicate detection, missing name error handling | **2 Valid**, **3 Conflicts**, **1 Error** |
| [`03_full_configuration.json`](file:///Users/dave/dev/racecoordinator_ai/sample_imports/03_full_configuration.json) | JSON | Structured audio objects (`type: tts`), per-driver `defaultAudio` overrides, default helmet paths | **3 Valid**, 0 Conflicts, 0 Errors |
| [`04_drivers_spreadsheet.xlsx`](file:///Users/dave/dev/racecoordinator_ai/sample_imports/04_drivers_spreadsheet.xlsx) | Excel (`.xlsx`) | Binary spreadsheet parsing, styled header row, mixed audio presets & TTS callouts | **5 Valid**, 0 Conflicts, 0 Errors |
| [`05_media_bundle.zip`](file:///Users/dave/dev/racecoordinator_ai/sample_imports/05_media_bundle.zip) | ZIP Archive | Automatic extraction of `drivers.csv` + bundled media assets (`.png` avatars and `.wav` sounds) | **2 Valid**, **4 Assets Auto-Imported** |

---

## Detailed File Descriptions & Test Scenarios

### 1. `01_basic_drivers.csv` (Standard Clean CSV)
- **Directive**: `# default-audio: none` at the top sets all blank/unspecified audio slots to mute (`none`) instead of system defaults.
- **Nickname Fallback**: The driver row `Lando Norris` leaves `Nickname` empty. The importer automatically falls back to using the driver's name `Lando Norris` for the nickname.
- **Audio Expressions**: Demonstrates variable interpolation with `${nickname}` (e.g. `tts:${nickname} completed a lap`), standard presets (`preset:default_driveby`), and explicit `none`.

### 2. `02_conflict_resolution.csv` (Collision & Error Handling)
Exercises the preview table's conflict resolution dropdowns and error filtering:
- **Database Collision (Row 1 & 2)**: `Dave` and `Abby` match existing drivers in the database. The status is marked **CONFLICT**. You can test switching their resolution between:
  - **Auto Rename**: Proposes an incremented name (e.g., `Dave (1)`).
  - **Overwrite**: Updates the existing driver's audio and avatar settings.
  - **Skip**: Leaves the existing driver untouched and skips this row during commit.
- **In-File Duplicate (Row 4)**: The second `Carlos Sainz` entry detects a collision with a prior row in the same file and flags a **CONFLICT**.
- **Validation Error (Row 5)**: Has an empty driver name. Marked as **ERROR** with the error banner explanation; invalid rows cannot be imported.
- **Valid Entry (Rows 3 & 6)**: `Carlos Sainz` (first entry) and `George Russell` show as **VALID**.

### 3. `03_full_configuration.json` (Hierarchical JSON)
- **JSON Structure**: Uses `{ "defaultAudio": "system", "drivers": [ ... ] }`.
- **Structured Audio Objects**: Demonstrates rich JSON audio objects like `{"type": "tts", "text": "Five second penalty for ${nickname}"}`.
- **Per-Driver Overrides**: Shows how `defaultAudio: "none"` on an individual driver overrides the file-level default.
- **Avatar Asset Paths**: References default helmet assets like `assets/defaults/helmets/helmet_yellow.png`.

### 4. `04_drivers_spreadsheet.xlsx` (Native Excel)
- **Excel Ingestion**: Uses Apache POI to parse native Microsoft Excel files.
- **Directive in First Cell**: Cell `A1` contains `# default-audio: system`.
- **Roster**: 5 Grand Prix legends with formatted table headers, testing cross-platform spreadsheet support without requiring CSV export.

### 5. `05_media_bundle.zip` (All-in-One Package with Media)
Contains `drivers.csv` together with 4 companion binary assets:
- `speedy_avatar.png` (Custom yellow badge image)
- `mcqueen_avatar.png` (Custom red badge image)
- `turbo_sound.wav` (Custom rising sweep audio)
- `engine_rev.wav` (Custom engine rev audio)

**What happens on upload:**
1. The server unpacks the ZIP package in memory.
2. It detects the media files and automatically uploads them to the SQLite Asset Manager via `AssetService`, generating SHA-256 deduplicated records.
3. The server links the imported asset URLs to `Avatar`, `Lap`, and `BestLap` columns based on filename matching.
4. The UI displays the green banner: `4 assets imported from package`.
5. When committed, the drivers are created with their custom avatars and sounds already linked!

---

## How to Test in the Web UI

1. Open the Race Coordinator AI client in your browser (e.g. `http://localhost:4200`).
2. Navigate to the **Drivers** editor page from the sidebar menu.
3. In the top action bar, click the **Import** button (or press `Alt+I`).
4. Drag and drop any of the sample files above directly into the dashed dropzone, or click **Choose File** to browse.
5. Inspect the **Preview Table**:
   - Check the **Summary Badges** (Total Rows, Valid, Conflicts, Errors).
   - Try toggling conflict strategies (`Auto Rename`, `Overwrite`, `Skip`) on `02_conflict_resolution.csv`.
6. Click **Import Drivers** to commit the previewed rows to the database.
7. Observe that the driver list immediately updates with the newly imported drivers!
