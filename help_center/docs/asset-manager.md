# Asset Manager

The **Asset Manager** allows you to upload, organize, and manage all your digital race assets, including audio files, custom images, image sets, and rotation schemes used throughout Race Coordinator AI.

## Overview

Assets are custom resources used across the application to personalize the race experience. These include:

- **Sound Files:** Custom audio callouts, start beeps, finish horns, and commentary clips.
- **Audio Sets:** Grouped collections of audio files or Text-to-Speech (TTS) callouts mapped to specific trigger values (time in seconds, remaining laps, or fuel percentage).
- **Images:** Car graphics, driver avatars, custom flags, sponsor logos, and background images.
- **Image Sets:** Collections of related images (such as fuel gauges or countdown sequences).
- **Custom Rotations:** User-defined heat rotation assets for complex or custom rotation schemes.

## Uploading Assets

To upload new assets to your library:

1. Open the **Asset Manager** from the main menu or configuration toolbar.
2. Drag and drop single or multiple files into the **Upload Assets** section, or click to browse your local computer.
3. Supported formats include `.wav`, `.mp3`, `.ogg` for audio, and `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp` for images.

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

## Managing & Organizing Assets

- **Category Filtering:** Filter your asset list by type (Images, Sounds, Image Sets, Rotations).
- **Preview & Playback:** Click on any audio file to preview playback or any image to view its resolution and preview.
- **Renaming & Tagging:** Give your assets clear, recognizable names for easy selection in the UI Editor and Theme Manager.
- **Deleting Assets:** Remove unused assets to clean up your database storage.

## Using Assets in Themes & UI Layouts

Once uploaded, your assets become immediately available across the application:

- Select custom sound effects in the **Theme Manager** for lap callouts, leader changes, and start/finish tones.
- Assign custom images to driver profiles, car models, and track layouts.
- Link custom rotation files within the **Race Editor** for advanced rotation formats.
