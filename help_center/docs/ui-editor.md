# Customize UI

The **Customize UI** page allows you to configure system-wide interface settings, directory locations for custom UI files and modular custom widgets, post-race Excel export templates, screen transition animations, and master audio and Text-to-Speech (TTS) parameters.

> [!NOTE]
> To visually design custom raceday screens and leaderboards, visit the [Layout Editor](layout-editor.md). To configure visual flag, countdown, and fuel gauge image sets or race sound effects, visit the [Theme Editor](theme-editor.md).

---

## Overview {: #overview }

The Customize UI settings page provides centralized control over global interface behaviors and application-level audio configurations:

- **Global Scope**: Changes made on this page apply across the entire application and all race sessions.
- **Continuous Auto-Save**: Adjustments to volume, voice pitch, queue timings, directory selections, and transitions take effect immediately and are saved automatically.
- **Collapsible Setting Expanders**: Settings are organized into dedicated, collapsible sections for **Customize UI Settings** and **Audio Settings**.
- **Undo / Redo Support**: Modifications made during your current session can be quickly undone or reapplied using the toolbar controls.

---

## Toolbar Actions {: #toolbar-actions }

The top toolbar provides essential navigation and session-level actions:

- **Back**: Returns to the previous screen or navigation menu.
- **Undo / Redo**: Reverts or reapplies recent setting changes made during the current editing session.
- **Help (?)**: Launches the interactive guided tour highlighting each section and expander on the page.

---

## Customize UI Settings {: #customize-ui-settings }

The **Customize UI Settings** section configures local filesystem directories, custom Excel export templates, and application screen animations:

### Custom UI Directory

Specifies a local folder used to override built-in application templates and store client log files when needed:

- **Directory Path**: Displays the active folder name and absolute file path. When unset, the application uses default internal locations.
- **Select Directory**: Opens a native folder selection dialog to browse and select a local directory.
- **Enter Path**: Opens a modal allowing you to manually type or paste an absolute filesystem directory path (useful when running headless or across network shares).
- **Reset to Default**: Clears the custom directory path and restores built-in defaults.

> [!WARNING]
> Setting a custom UI directory overrides core application templates and is intended only for advanced users developing custom interfaces or troubleshooting client logs.

### Custom Widgets Directory

Configures the root directory where Race Coordinator AI searches for modular [Custom Widgets](custom-widgets.md):

- **Directory Path**: Displays the selected custom widget folder name and path.
- **Select Directory**: Opens a folder picker to choose a local folder containing custom widget packages.
- **Enter Path**: Manually enter an absolute folder path.
- **Export Starter Widgets**: Copies ready-to-use starter widget packages into a `sample/` subfolder within your selected widgets directory (including `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, and `sample-detailed-leaderboard`). This button is enabled once a valid widget directory is selected.
- **Reset to Default**: Clears the custom widget directory path.

For full technical specifications on creating custom widgets, see the [Custom Widgets Guide](custom-widgets.md).

### Custom Export Template

Manages the custom Microsoft Excel (`.xlsx`) template used when exporting race results and statistics:

- **Template Status**: Displays the file name of the currently active custom Excel workbook template, or indicates when the system default template is active.
- **Select Template**: Uploads a custom `.xlsx` workbook from your local computer to embed as your export template.
- **Download Template**: Downloads the currently active template file to your computer for viewing or editing in Microsoft Excel.
- **Test Export**: Generates and downloads a sample `.xlsx` export file populated with dummy race results, heats, and telemetry data to test your template formatting, formulas, and charts.
- **Template Variables**: Opens an interactive reference modal listing all supported replacement tags (such as `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, etc.) that you can place in Excel cells to dynamically insert race data.
- **Reset to Default**: Reverts to the built-in standard Excel export template.

> [!TIP]
> If you edit your Excel template file externally in Microsoft Excel or another spreadsheet program, be sure to re-upload it using **Select Template** so the updated workbook is saved into Race Coordinator AI. For complete template token details, see the [Custom XLS Export Guide](custom-xls-export.md).

### Page Transitions

Controls the visual animation style used when navigating between screens and views in the application:

- **Slide** (Default): Smooth horizontal sliding transition between pages.
- **Fade**: Smooth opacity dissolve between views.
- **Zoom**: Modern zoom-in scale transition.
- **Flip**: 3D card flip transition effect.
- **None**: Instantaneous page switching without animation (recommended for lower-power devices or dedicated kiosks).

---

## Audio Settings {: #audio-settings }

The **Audio Settings** section manages system-wide master volume levels, dispatcher queue behaviors, and synthesized Text-to-Speech (TTS) callouts:

### Master Volume

Controls the overall master volume level (0% to 100%) for all audio output in Race Coordinator AI. Adjusting this slider scales all sound effects, countdown beeps, warning horns, and voice announcements simultaneously.

### Urgent Queue Timeout

Sets how long high-priority urgent alerts (such as *Yellow Flag*, *Heat Finished*, or *False Start*) will wait in the audio queue if another urgent message is already being spoken:

- **3 Seconds**: Aggressive timeout; discards queued alerts quickly to ensure spoken notifications stay tightly synchronized with real-time track action.
- **5 Seconds** (Default): Balanced duration ensuring urgent alerts are heard without falling significantly behind live events.
- **10 Seconds**: Relaxed timeout; allows longer announcements to finish before skipping subsequent urgent notifications.

Expired alerts that exceed the timeout limit are automatically dropped so old alerts are not played out of context.

### Callout Spacing

Configures the minimum silence buffer between consecutive spoken announcements to prevent overlapping or clipped audio:

- **None (0ms)**: Consecutive announcements play immediately back-to-back.
- **Short (500ms)** (Default): Brief half-second pause between callouts, providing natural pacing while keeping announcements timely.
- **Normal (1000ms)**: 1-second pause between callouts for clearer separation.
- **Relaxed (1500ms)**: 1.5-second pause between announcements for a relaxed commentary pace.

### Text-to-Speech (TTS) Voice

Selects which synthesized voice is used for spoken lap times, positions, leader announcements, and fuel status callouts:

- **System Default**: Uses the operating system or browser default synthesized voice.
- **Installed Voices**: Lists all speech synthesis voices detected on your operating system or browser, displaying each voice's display name and language/locale tag (e.g. `en-US`, `de-DE`, `es-ES`, `fr-FR`).

### Speech Rate

Controls the playback speed of spoken Text-to-Speech announcements via a slider ranging from **0.1x** (very slow) to **2.0x** (double speed) in increments of 0.05. The default speed is **1.0x**.

### Voice Pitch

Controls the vocal pitch/frequency of Text-to-Speech announcements via a slider ranging from **0.0x** (low pitch) to **2.0x** (high pitch) in increments of 0.05. The default pitch is **1.0x**.

### Voice Volume

Independent volume slider (0% to 100%) specifically controlling Text-to-Speech voice announcements. This allows you to fine-tune the volume of spoken commentary relative to master sound effects and countdown horns.

### Test Voice

Click the **Test Voice** button to speak a sample test sentence using your currently selected voice, speech rate, pitch, and volume settings to verify clarity and intelligibility.
