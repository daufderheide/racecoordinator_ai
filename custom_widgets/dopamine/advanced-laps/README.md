# Advanced Laps (`advanced-laps`)

A smart lap counter widget supporting both **Heat Laps** and **Overall Race Laps** with custom pause auto-segments, racing count truncation, and allow-finish state filtering.

## 📥 Download Widget as ZIP

GitHub does not have a native button to download a single subfolder, but you can download this widget folder as a ZIP archive using either of the direct links below:

- [📥 **Download `advanced-laps.zip`** (Direct)](https://download-directory.github.io/?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets/dopamine/advanced-laps)
- [Alternative Mirror (DownGit)](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/daufderheide/racecoordinator_ai/tree/develop/custom_widgets/dopamine/advanced-laps)

## Features

- **Auto-Segments**: Automatically displays fractional segments only when the heat is NOT racing (e.g. during a pause or heat finish).
- **Racing Count Truncation**: When racing with 0 decimal places, fractional segments are truncated rather than rounded up (e.g., `10.9999999` displays as `10`, while a full `1.0` lap added displays as `11`).
- **Allow Finish Pause Segments**: Configurable option to suppress pause auto-segments for drivers who are still finishing their final lap, while displaying them for drivers who have already completed the heat.
- **Heat vs. Overall Mode**: Configurable to display either live heat laps or cumulative race laps, defaulting to the standard `LAP` column header.
- **Multi-Instance Support**: Can be placed multiple times on the same layout (e.g. to display both heat and overall race laps simultaneously).

## How to Install

1. Download `advanced-laps.zip` using the link above and extract the `advanced-laps` folder into your custom widgets folder:
   - For library grouping: `[YourCustomWidgetsFolder]/dopamine/advanced-laps/`
   - Or directly at root: `[YourCustomWidgetsFolder]/advanced-laps/`
2. In Race Coordinator AI, open **Options -> Custom UI (UI Editor)** and make sure your **Custom Widgets Folder** is selected.
3. The widget will appear in the Widget Library ready to drag, drop, and configure on your layouts.
