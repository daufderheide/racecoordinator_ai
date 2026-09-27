# Team Editor

The **Team Editor** allows you to create, view, and customize team profiles, assign drivers, upload team logos, and manage team rosters.

## Overview

The Team Editor integrates team selection and editing into a unified interface:

- **Team Selector**: Located at the top header next to the page title, this dropdown lists all existing teams and allows you to quickly switch between teams.
- **Read-Only Mode**: By default, opening the editor displays team details and assigned driver rosters in read-only mode. Form fields, logo selection, and driver assignment actions are locked to prevent accidental modifications.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the form inputs and driver assignment controls for editing. While in Edit Mode, the team selector dropdown is locked to prevent accidental navigation away from unsaved edits.
- **Continuous Auto-Save**: As you make changes (editing the team name, selecting a logo, or reordering/assigning drivers), your edits are automatically saved to the server in the background without dropping out of Edit Mode.
- **Exiting Edit Mode**: Clicking the **Done Editing** (visibility / checkmark) icon validates your changes, ensures all edits are persisted, and returns the editor to Read-Only Mode.
- **Discarding Changes**: If you attempt to leave the editor with unsaved or invalid changes, the unsaved changes dialog prompts you to confirm. Discarding changes reverts all edits back to the last-saved version and restores Read-Only Mode.

## Toolbar Actions

The top toolbar provides the following actions:

- **Back**: Returns to the previous view or Race Day Setup.
- **Add Team (+)**: Creates a new team template and enters Edit Mode.
- **Duplicate Team**: Duplicates the currently selected team into a new team with a unique name.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode. When exiting Edit Mode, changes are validated and persisted.
- **Delete Team**: Deletes the selected team after confirmation.
- **Undo / Redo**: Reverts or reapplies recent edits made during your editing session.
- **Help (?)**: Opens the interactive guided tour highlighting each section of the editor.

## Team Configuration

- **Team Name**: The unique name of the team displayed on standings and race displays.
- **Team Image / Avatar**: Choose a preset icon or custom logo to represent the team.

## Team Members & Lineup

- **Assigned Drivers**: Drivers currently assigned to this team. In Edit Mode, drag and drop drivers to reorder the lineup or click the remove button (X) to unassign a driver.
- **Available Drivers**: Drivers that are not currently assigned to this team. In Edit Mode, click on a driver to add them to the team lineup.
