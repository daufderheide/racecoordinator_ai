# Season Editor

The **Season Editor** allows you to create, manage, and review championship racing seasons. A season tracks standings across multiple completed races and events over time, accumulating championship points for drivers, applying dropped race rules, and calculating real-time rankings.

## Overview

The Season Editor provides a comprehensive interface for season management:

- **Season Selector**: Located in the top header next to the page title, this dropdown lists all saved championship seasons and allows you to switch between them, browse with previous/next controls, and view the total season count.
- **Read-Only Mode**: By default, opening the editor displays season settings, standings, and completed race cards in read-only mode to prevent accidental changes.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the form inputs, allows adding finished races to the season, and enables removing races.
- **Continuous Auto-Save**: Changes to the season name, dropped race counts, and race additions or removals are saved automatically in the background.
- **Exiting Edit Mode**: Clicking the **Done Editing** (checkmark) icon validates the season, ensures all changes are saved, and returns the editor to Read-Only Mode.

---

## Toolbar Actions

The top toolbar provides essential editing and management actions:

- **Back**: Returns to the previous screen or Race Day Setup.
- **Add Season (+)**: Creates a new season template with default settings and enters Edit Mode.
- **Duplicate Season**: Clones the current season under a new unique name so you can branch seasons or create alternate scoring scenarios.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode (keyboard shortcut: `Cmd/Ctrl+E`).
- **Delete Season**: Permanently deletes the selected championship season after confirmation.
- **Undo / Redo**: Reverts or reapplies recent changes made during the editing session.
- **Help (?)**: Launches the guided tour highlighting each section of the editor.

---

## Season Configuration {: #season-configuration }

The left-hand panel configures general championship rules and scoring parameters:

- **Season Name**: A unique championship name displayed on leaderboards, reports, and Race Day Setup.
- **Dropped Races (Drops)**: The number of lowest-scoring races discarded from each driver's championship point total. Dropped races allow competitors to miss a round or discard their worst race results without falling out of championship contention.

---

## Season Information & Race Management {: #season-info-bar }

The header bar above the right panel provides live season status metrics and race entry controls:

- **Races Run**: Displays the total count of completed races and events included in the championship season.
- **Demo Races Badge**: Indicates if any practice or demonstration races have been recorded in the season's event history.
- **Add Race**: In Edit Mode, click the **+ Add Race** button to open the race selection dialog. This modal lists all finished races from your race history, allowing you to select and append completed races to the season.

---

## Season Standings {: #season-standings }

The standings section computes and displays real-time championship rankings:

- **Rank & Podium**: Drivers are sorted by total points, with gold, silver, and bronze medals highlighting the top three competitors.
- **Driver Name**: Full display name of each participating competitor.
- **Net Points**: The authoritative championship total used for rankings, calculated as gross points minus dropped race deductions.
- **Dropped Points**: The sum of points discarded according to the season's dropped races setting.
- **Gross Points**: The total raw points earned across all races entered.
- **Races Run**: The number of individual races each driver participated in.

---

## Race Breakdowns {: #race-breakdowns }

The race breakdown section provides detailed performance cards for each race included in the season:

- **Expandable Race Cards**: Click any race card to expand or collapse its per-driver results table, showing finishing positions, individual points earned, and any bonus points awarded.
- **Removing Races**: In Edit Mode, click the trashcan icon (<span class="material-icons">delete</span>) in the title bar of a race card to remove that completed race from the championship season.

