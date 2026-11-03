# Event Editor

The **Event Editor** allows you to design, configure, and manage multi-race events. In Race Coordinator AI, an event links multiple distinct race configurations together into a sequential progression—such as qualifying rounds leading into semi-finals and championship finals, or multi-stage tournament brackets.

## Overview

The Event Editor provides a clean, two-panel layout for structuring multi-stage competitions:

- **Event Selector**: Located at the top header next to the page title, this dropdown lists all saved events and allows you to quickly switch between them, navigate with previous/next buttons, and view your current position in the event library.
- **Read-Only Mode**: By default, opening the editor displays event configurations and race sequences in read-only mode to prevent accidental changes.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the form inputs and race sequence controls.
- **Continuous Auto-Save**: Changes to the event name, description, auto-advance timing, and race progression are saved automatically in the background.
- **Exiting Edit Mode**: Clicking the **Done Editing** (checkmark) icon validates the event, ensures all changes are saved, and returns the editor to Read-Only Mode.

---

## Toolbar Actions

The top toolbar provides essential editing and management actions:

- **Back**: Returns to the previous screen or Race Day Setup.
- **Add Event (+)**: Creates a new event template with default settings and enters Edit Mode.
- **Duplicate Event**: Clones the current event under a new unique name so you can quickly create variations of tournament formats.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode (keyboard shortcut: `Cmd/Ctrl+E`).
- **Delete Event**: Permanently deletes the selected event after confirmation.
- **Undo / Redo**: Reverts or reapplies recent changes made during the editing session.
- **Help (?)**: Launches the guided tour highlighting each section of the editor.

---

## Event Configuration {: #event-configuration }

The left-hand panel configures general metadata and automated stage transition behavior for the event:

- **Event Name**: A unique display name identifying the event throughout the application, leaderboards, and Race Day Setup.
- **Description**: An optional multi-line text area for notes, stage rules, scoring summaries, or tournament instructions.
- **Auto Advance Time**: The countdown duration (in seconds) to wait after a race concludes before automatically loading and advancing to the next race in the sequence. Setting this value to `0` disables automatic advancement, requiring the race director to manually trigger the next race.

---

## Race Sequence {: #race-sequence }

The right-hand panel manages the ordered progression of races that make up the event:

- **Add Race**: In Edit Mode, click the **+ Add Race** button to open the race selection dialog. Choose any saved race configuration from your race catalog to append it to the event sequence.
- **Stage Progression Order**: Races run sequentially from top to bottom (Stage #1, Stage #2, etc.). In Edit Mode, grab the drag handle (<span class="material-icons">drag_indicator</span>) on any race card to reorder stages.
- **Max Driver Limits**: Each race stage can restrict the number of participating drivers:
  - **Unlimited (All Drivers)**: All registered drivers from the previous stage participate in this race.
  - **Restricted Limit**: Specify an exact number of top-qualifying drivers allowed to advance to this stage (e.g., top 8 drivers advance from qualifying to semi-finals, and top 4 advance to the final race). Click **Unlimited** to toggle between a numerical cap and all drivers.
- **Remove Race**: In Edit Mode, click the trashcan icon (<span class="material-icons">delete</span>) on any race card to remove that stage from the event sequence. Each event must retain at least one race.

