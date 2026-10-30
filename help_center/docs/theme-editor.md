# Theme Editor

The **Theme Editor** provides a dedicated, streamlined interface for managing visual flags, countdown lighting sequences, fuel gauges, race control audio callouts, and driver audio overrides for Race Coordinator AI. It shares the same unified toolbar, object selection, read-only protection, and edit mode lifecycle used across the Driver, Track, Race, and Layout editors.

---

## Overview & Navigation

The Theme Editor is accessible from several key locations:

- **Race Day Setup Toolbar**: Select **Config > Theme Editor** (`/theme-editor` or `/theme-manager`).
- **Race Day Options Menu**: Click the gear menu on the Raceday toolbar and select **Theme Editor** (`/theme-editor`). Navigating during an active race preserves race connection and state.
- **UI Editor**: Click **Open Theme Editor** from the Themes card in the UI Editor (`/ui-editor`).

### Read-Only and Edit Mode Lifecycle

- **Read-Only Mode (Default)**: Theme properties, image asset slots, audio settings, and driver audio overrides are protected against accidental modifications.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the theme for editing.
- **Auto-Save & Validation**: When leaving edit mode, changes are validated (e.g. ensuring a unique, non-empty theme name) and saved. Invalid configurations prompt an alert and keep the editor in Edit Mode.
- **Discard Changes**: Exiting or navigating away with unsaved edits displays the standard discard confirmation modal, protecting against data loss.
- **Undo / Redo**: Fully integrated with standard undo/redo controls (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> and <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Toolbar Actions

The top toolbar provides standardized theme management actions:

- **Theme Selector**: Dropdown to select any system or user-defined theme, sorted naturally with default themes first.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode.
- **Expand / Collapse All (<span class="material-icons">unfold_more</span> / <span class="material-icons">unfold_less</span>)**: Toggles all collapsible configuration sections at once.
- **Add Theme (<span class="material-icons">add</span>)**: Creates a new theme template based on the default system theme.
- **Copy Theme (<span class="material-icons">content_copy</span>)**: Duplicates the currently selected theme under a unique name (e.g. *Theme Name (Copy)*).
- **Delete Theme (<span class="material-icons">delete</span>)**: Deletes the current custom theme after confirmation. System default themes are protected and cannot be deleted.
- **Help Tour (<span class="material-icons">help_outline</span>)**: Launches an interactive guided tour highlighting the theme selector, toolbar, name and layout bindings, flag graphics, countdown lights, fuel gauge, audio slots, and driver audio overrides.

---

## Theme Configuration Sections

### Theme Details & Layout Bindings

- **Theme Name**: Enter a distinct, descriptive name for the theme.
- **Custom UI Layout**: Select the default screen layout paired with this theme.
- **Driver Station Theme**: Select the theme used when opening or scanning into a single-lane driver station window or device.
- **Driver View Theme**: Select the theme used when opening or scanning into the driver view schedule window or personal device display.

### Flag Images

Configure visual flag assets for all 12 behavioral race control flag states:

- **Racing** (`flag.racing`): Active green-flag racing status.
- **Heat Paused** (`flag.heat_paused`): Yellow flag / caution period.
- **Heat Over** (`flag.heat_over`): Heat conclusion banner.
- **Race Over** (`flag.race_over`): Checkered flag signaling total race completion.
- **Not Started** (`flag.not_started`): Pre-race staging display.
- **Starting** (`flag.starting`): Countdown in progress.
- **Restarting** (`flag.restarting`): Caution restart sequence.
- **One Lap To Go** (`flag.one_lap_to_go`): White flag signaling final lap.
- **Heat Finishing** (`flag.heat_finishing`): Final laps concluding for active heat.
- **Warmup** (`flag.warmup`): Practice or track warmup mode.
- **Driver Finished** (`flag.driver_finished`): Displayed for drivers who have completed their heat distance.
- **Penalty** (`flag.penalty`): Disqualification or track penalty indicator.

### Countdown Images

Configure start sequence lights:

- **Red Off / Dim** (`lamp.red.dim`): Inactive countdown light.
- **Red On** (`lamp.red.on`): Active red staging light.
- **Green** (`lamp.green`): Start / GO lamp.

### Fuel Gauge Images

- **Fuel Gauge** (`gauge.fuel`): Image set representing stepped fuel tank levels from empty to full.

### Main Audio Slots

Customize system-wide sound effects, uploaded audio files, or synthesized speech (TTS) for race control events:

- **Yellow Flag**: Caution sirens or warning horns.
- **Countdown**: Start sequence beeps or tones.
- **Seconds Left**: Remaining heat duration announcements.
- **Laps Left**: Remaining laps for the heat leader.
- **Auto-Start**: Automated countdown before heat starts.
- **Auto-Advance**: Automated countdown before advancing to the next heat.
- **Halfway**: Announcements at the halfway point of a heat.
- **Heat Over & Race Over**: Finish horns or celebration audio cues.
- **Minimum Lap Time**: Violation alert tones.

### Driver Audio Overrides

Themes can selectively override driver-level audio settings across all participants while the theme is active. By default, each driver's individual configuration (set in the [Driver Editor](driver-editor.md)) is played. Enabling an override on the theme forces that sound, speech phrase, or silence (**None**) across all drivers running under the theme.

