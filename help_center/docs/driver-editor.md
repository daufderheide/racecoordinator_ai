# Driver Editor

The **Driver Editor** allows you to create, view, and customize driver profiles, nicknames, avatars, and personalized audio callouts.

## Overview

The Driver Editor integrates driver selection and editing into a unified interface:

- **Driver Selector**: Located at the top header next to the page title, this dropdown lists all existing drivers and allows you to quickly switch between drivers.
- **Read-Only Mode**: By default, opening the editor displays driver details in read-only mode. Form fields are locked to prevent accidental modifications while allowing you to audition audio clips.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks the form inputs for editing. While in Edit Mode, the driver selector dropdown is locked to prevent accidental navigation away from unsaved edits.
- **Saving Changes**: Clicking the **Done Editing** (visibility / checkmark) icon validates your changes, saves them to the server, and returns the editor to Read-Only Mode.
- **Discarding Changes**: If you attempt to leave the editor with unsaved changes, the unsaved changes dialog prompts you to confirm. Discarding changes reverts all edits back to the last-saved version and restores Read-Only Mode.

## Toolbar Actions

The top toolbar provides the following actions:

- **Back**: Returns to the previous view or Race Day Setup.
- **Add Driver (+)**: Creates a new driver template and enters Edit Mode.
- **Copy Driver**: Duplicates the currently selected driver profile into a new driver template.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode. When exiting Edit Mode, changes are validated and persisted.
- **Delete Driver**: Deletes the selected driver profile after confirmation.
- **Help (?)**: Opens the interactive guided tour highlighting each section of the editor.

## Driver Details

- **Name**: The full name of the driver displayed on leaderboards and race reports.
- **Nickname**: A shortened or spoken callout name used for Text-to-Speech (TTS) announcements.
- **Link Name & Nickname**: When enabled, editing the Name field automatically mirrors the text into the Nickname field.
- **Avatar**: Choose a custom image or preset icon to represent the driver on race displays.

## Audio Callouts & SFX

Configure custom sound effects or Text-to-Speech (TTS) callouts for this driver:

- **Lap Audio**: Played upon completing a standard lap.
- **Personal Best Lap**: Played when the driver sets their best lap time of the session.
- **Milestone & Record Audio**: Custom sounds or announcements for track records, heat records, and race leads.
- **Auditioning Sounds**: The audio play button remains active in both Read-Only and Edit modes, allowing you to sample sounds at any time.
