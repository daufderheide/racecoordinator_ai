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
- **Export**: Saves your slotcars to a ZIP file. See [Export Slotcars](#car-export).
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

## Cars Stay in Their Lanes (IROC) {: #cars-in-lanes }

In an IROC race the slotcars stay in their lanes all race and the drivers rotate through the lanes, so every driver races every car.

- **Race editor**: tick **Cars stay in their lanes (IROC)** in the Heats section.
- **Race Day Setup**: a **Lane cars** box appears under the **Drivers Racing** list. Click it to pick the car for each lane. RC AI remembers the lane cars per track. The car icons on the racers are hidden, since the car goes with the lane.
- **Swap between heats**: **Race Director → Slotcars…** lists every lane with its car. A new car counts from the next heat that hasn't run.
- **Results**: each heat saves the car of each lane, so you can see which driver raced which car.

## Slotcars in the Results {: #cars-in-results }

The results show the car each driver ran, as it was in that heat. Editing a car later doesn't change past results.

- **Heat Results** and a driver's results page: each heat card shows the car next to the lane. Point at it to see the class, scale and setup.
- **Race Results**: each racer shows their car under their name. If they ran more than one car (an IROC race or a swap), it says how many; point at it to see the list.

## Car Stats {: #car-stats }

**Car Stats** shows how your slotcars did in your saved races. Open it with the chart button at the top of the Slotcar Editor; it starts with the car on screen.

- **Group by**: one row per car, class, setup field (brand, scale, motor, magnet, chassis, gears, tyres), one of your own fields, track or driver. Pick a car and group by track or driver to see where and with whom it went fastest.
- **Filters**: narrow the results to one car, class, track or driver.
- **Demo races**: tick it to see the results of demo races instead.
- The numbers use each heat's car as it ran, so editing a car later doesn't change them. Laps under the race's minimum lap time and laps left out of the records don't count.

## Export Slotcars {: #car-export }

Click **Export** in the toolbar to save all your slotcars to a ZIP file, for a backup or to share them with another club.

- **Format**: pick **CSV** or **Excel** for a spreadsheet, or **JSON** for a structured file.
- **What's in it**: one row per car with every detail: name, picture, brand, class, scale, setup, Modified (Yes/No) and notes.
- **Your fields**: each of your own fields gets a column, named after the field.
- **Pictures**: the car pictures go into an `images` folder in the ZIP, each picture only once. The Picture column names the file.
- **Ids stay out**: cars and fields are matched by name, so the file works in any database.
