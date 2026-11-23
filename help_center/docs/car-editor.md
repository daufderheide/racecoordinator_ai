# Slotcar Editor

The **Slotcar Editor** keeps a list of your slotcars: what they are, the class they race in, their scale, and their setup. Open it from Race Day Setup with **Manage → Slotcars**.

!!! note
    This is the first step of car support. Cars are not linked to drivers or races yet, so nothing changes on race day.

    The **Preview** badge next to the title means this feature is still taking shape. It may change a lot, or even be removed, while we collect feedback. Tell us what you think on GitHub or SlotForum.

## Overview

The Slotcar Editor works like the Team Editor:

- **Car Selector**: The dropdown next to the page title lists all your cars, sorted by name.
- **Read-Only Mode**: Opening the editor shows the selected car with every field locked.
- **Edit Mode**: Click the **Edit** (pencil) icon to unlock the fields. While you edit, the car selector is locked.
- **Auto-Save**: Changes are saved in the background as you make them.
- **Discarding Changes**: If you leave with unsaved or invalid changes, you are asked to confirm. Discarding returns the car to its last saved version.

## Toolbar Actions

- **Back**: Returns to Race Day Setup.
- **Add Slotcar (+)**: Creates a new car and opens it for editing.
- **Duplicate**: Copies the selected car under a new, unique name. Handy for a second car of the same type.
- **Edit / Done Editing**: Switches between Read-Only Mode and Edit Mode.
- **Delete**: Deletes the selected car after you confirm.
- **Undo / Redo**: Steps back or forward through your recent edits.
- **Help (?)**: Starts the guided tour.

## The Car {: #car-profile }

The left-hand panel holds what the car is:

- **Picture**: Choose an image or upload a photo of the car.
- **Name**: Required, and unique among your cars (for example "Porsche 911 RSR #92").
- **Brand / maker**: For example Scalextric, Carrera, Slot.it or NSR.
- **Class**: The class the car races in, such as GT3 or Classic. While you type, the classes you already use on other cars are suggested, so the same class is always spelled the same way.
- **Scale**: 1/24, 1/32, 1/43, 1/64 (HO), Other, or Not set.

## Setup {: #car-setup }

The right-hand panel holds how the car is set up. Every field is free text, so you can describe it the way your club does:

- **Motor**: For example "Slot.it V12/4 21.5k", or pancake / inline for HO.
- **Magnet**: Type and strength, or "none" for non-magnet racing.
- **Chassis**, **Gears** (for example 9/27) and **Tyres**.
- **Modified**: Tick it when the car is changed from how it came out of the box; leave it empty for a stock car.
- **Notes**: Anything else about the car.

## Your Fields {: #car-custom-fields }

Below the setup you can add fields of your own, for whatever your club keeps track of (for example weight, pinion or guide). In Edit Mode, click **Manage fields**:

- **New field**: give it a name and pick a type: **Text**, **Number**, **Yes / no**, or **Choice from a list** (one choice per line).
- **Edit**: rename a field or change its choices. The type can't be changed once the field is added.
- **Move up / down**: changes the order in which the fields appear.
- **Delete**: removes the field, and its value from every car, after you confirm.

Every car gets the same fields and keeps its own values. A field you leave empty stays empty.
