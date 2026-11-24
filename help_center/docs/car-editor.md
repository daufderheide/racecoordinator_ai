# Slotcar Editor

The **Slotcar Editor** keeps a list of your slotcars: what they are, the class they race in, their scale, and their setup. Open it from Race Day Setup with **Manage → Slotcars**.

!!! note
    Pick a car for each racer in Race Day Setup, and swap cars between heats. Each heat saves the car as it was on the track, so results keep the right car even after you edit it.

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

## Slotcars in a Race {: #car-in-race }

- **Race Day Setup**: in the Racing list, click the car icon on a row to pick a slotcar. A team picks **One car for the team** or **A car per driver**. One car races for one racer: a car another racer already has is greyed out, and a row shows a warning when a remembered pick clashes. RC AI remembers your picks for the next race.
- **Swap between heats**: on race day, open **Race Director → Slotcars…**. It lists the coming heat lane by lane; pick another car and it changes straight away. While a heat is running, the lists are locked.
- **Modify Heats**: the car icon on a racer changes their car for every heat that hasn't run yet.
- **Results**: each heat keeps a copy of the car as it raced, so editing or deleting a car later doesn't change past results.

The car icon and the Slotcars… item only appear once there are slotcars in the database.
