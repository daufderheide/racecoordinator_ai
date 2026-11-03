# Asset Manager

## Overview {: #overview }

The **Asset Manager** allows you to upload, organize, and manage all your digital race assets, including audio files, custom images, image sets, and rotation schemes used throughout Race Coordinator AI.

Assets are custom resources used across the application to personalize the race experience. These include:

- **Sound Files:** Custom audio callouts, start beeps, finish horns, and commentary clips.
- **Audio Sets:** Grouped collections of audio files or Text-to-Speech (TTS) callouts mapped to specific trigger values (time in seconds, remaining laps, or fuel percentage).
- **Images:** Car graphics, driver avatars, custom flags, sponsor logos, and background images.
- **Image Sets:** Collections of related images (such as fuel gauges or countdown sequences).
- **Custom Rotations:** User-defined heat rotation assets for complex or custom rotation schemes.

---

## Adding Assets {: #adding-assets }

The left panel of the Asset Manager provides four controls to add new assets to your library individually or in bulk:

1. **Upload Assets Drop Zone:** Drag and drop one or more files directly into the dashed upload area, or click the zone to open your computer's file browser. You can upload multiple files at once.
   - Supported image formats: `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`.
   - Supported audio formats: `.wav`, `.mp3`, `.ogg`.
2. **New Image Set:** Opens the Image Set Editor to create a grouped collection of image frames. Image sets are used for multi-frame animations and state indicators, such as progressive fuel gauges or countdown sequences.
3. **New Audio Set:** Opens the Audio Set Editor to create multi-cue audio sequences triggered by countdown timers, remaining laps, or fuel percentage levels.
4. **New Custom Rotation:** Opens the Custom Rotation Editor to design or import specialized lane rotation schemes for unique race formats.

---

## Asset Library & Actions {: #asset-library }

The main library panel displays all visual and audio assets stored in your database. 

Hovering over any asset card in the library reveals quick-action controls:
- **Audio Playback:** Click the play button on audio cards to preview sound effects and audio sets directly without opening an editor.
- **Image Preview:** Displays full-resolution previews of graphic assets and frame progressions for image sets.
- **Inline Rename:** Click the asset name or edit action to quickly rename the asset directly in the grid.
- **Delete Asset:** Click the trashcan icon to remove an unused asset from the database.

You can also click assets to select them. When assets are selected, the top toolbar provides batch editing and deletion actions.

---

## Filtering & Layout Options {: #filter-tabs }

The Asset Manager provides powerful controls along the top of the library to find and display assets:

- **Filter Tabs:** Quickly filter the library by resource type:
  - **All:** Displays every asset in the database.
  - **Images:** Shows only individual static image files (`.png`, `.jpg`, `.svg`, etc.).
  - **Image Sets:** Shows only grouped multi-frame image animations and fuel gauge sequences.
  - **Sounds:** Shows only individual audio clips (`.wav`, `.mp3`, `.ogg`).
  - **Audio Sets:** Shows only multi-cue threshold-triggered audio collections.
  - **Custom Rotations:** Shows only custom lane rotation schemes.
- **View Layout Switcher:** Switch between **List View**, **Small Thumbnails**, **Medium Thumbnails**, and **Large Thumbnails** to fit more assets on screen or inspect detailed image previews.
- **Filter by Name:** Real-time search input that narrows the asset list instantly as you type.

---

## Audio Sets & Trigger Values

An **Audio Set** allows you to configure a series of sounds or spoken phrases triggered at specific numerical thresholds. Depending on where the audio set is assigned in Race Coordinator AI, its entry values represent different units:

*   **Time in Seconds:** Used in Theme settings for **Start Countdown**, **Remaining Seconds**, **Auto-Start**, and **Auto-Advance** announcements. For example, entries at `5`, `4`, `3`, `2`, `1`, and `0` seconds.
*   **Lap Count:** Used in Theme settings for **Laps Left** announcements. Entries define callouts when the heat leader reaches specific remaining lap counts (e.g., `10`, `5`, `1`, and `0` laps remaining).
*   **Fuel Percentage (%):** Used in Driver settings for **Fuel Level Sounds**. Entries define callouts when the driver's fuel level hits warning, critical, or full thresholds (e.g., `20%`, `10%`, `0%` empty, or `100%` refueled).

Within the **Audio Set Editor**, you can add entries, select preset audio files or write TTS phrases (with template variable substitutions like `{driver.nickname}`), set trigger values, and use the **Auto-Extract Values from Names** button to automatically populate values from numbered audio filenames (e.g. `10.mp3`, `5.mp3`).

### Dual Trigger Modes: Remaining vs. Elapsed

Each entry in an Audio Set can be configured with a **Trigger Mode**:

*   **Remaining (Count Down):** Triggers when the race is approaching zero or the finish line. For example, playing when there are 10 laps remaining, or 30 seconds left in the heat. This is the default mode for countdowns and finish approaches.
*   **Elapsed (Count Up):** Triggers when the race is progressing forward from the start. For example, playing when the leader completes 10 laps, or when 30 seconds have elapsed into the heat.

#### Same-Value Dual Cues
Race Coordinator AI supports configuring two entries with the exact same numerical value (e.g., value `10`):
- One entry configured as **Elapsed** will play as the heat progresses past the milestone (e.g. at 10 laps completed).
- Another entry configured as **Remaining** will play as the race nears completion (e.g. when only 10 laps remain).

#### Natural Race Progression Preview
When previewing or auto-playing an Audio Set in the Asset Manager or Audio Selector, sounds play in natural race progression order:
1. All **Elapsed** entries play first in ascending count-up order (0 → N).
2. All **Remaining** entries play next in descending countdown order (N → 0).

---

## Using Assets in Themes & UI Layouts

Once uploaded or created, your assets become immediately available across the application:

- Select custom sound effects in the [Theme Editor](themes.md) for lap callouts, leader changes, countdown cues, and finish fanfare.
- Assign custom graphics in the [Driver Editor](driver-editor.md) for car images, driver avatars, and nicknames.
- Configure visual widgets and gauge animations in the [Layout Editor](layout-editor.md).
- Link custom rotation files within the [Race Editor](race-editor.md) for advanced heat rotations.
