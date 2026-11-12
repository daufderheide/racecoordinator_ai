# Custom Rotation Sets

## Overview {: #overview }

The **Custom Rotation Set Editor** allows you to design, edit, and organize bespoke heat rotation schemes for your track. While Race Coordinator AI provides standard algorithmic rotations—such as **Round Robin**, **European Round Robin**, **Single Heat**, and **Step Up** races—custom rotation sets give race directors complete, lane-by-lane manual control over driver scheduling, heat order, and lane assignments.

A **Custom Rotation Set Asset** represents a collection of individual rotation configurations specifically tailored to a track's physical lane count (such as 2, 4, 6, or 8 lanes). Within a single custom rotation set asset, you can define multiple rotation patterns optimized for different numbers of participants.

Custom rotation sets are ideal for:

- **Irregular Track Configurations:** Tracks with specific lane characteristics, handicap setups, or pit lane requirements.
- **Club Formats & House Rules:** Traditional club rotation schedules where specific driver pairings or lane sequences must be strictly maintained.
- **Fixed Staging & Stint Sequences:** Special exhibition races, derbies, or team formats where algorithmic round-robin sequences do not match the event's rules.

---

## How Custom Rotation Sets Work {: #how-custom-rotations-work }

### Maximum Driver Capacity per Rotation {: #maximum-driver-capacity }

A custom rotation set asset does not just define a single static schedule; it contains a **set of rotations**, where **each rotation specifies a rotation for a maximum number of drivers** (`numDrivers`).

Within each rotation:

- **Virtual Driver Seeds:** Drivers are identified by seed numbers: `Driver 1`, `Driver 2`, ... up to `Driver N` (where `N` is the rotation's maximum driver capacity).
- **Lane Assignments:** For each heat, each physical lane is assigned a specific virtual driver seed (e.g. Lane 1: Driver 1, Lane 2: Driver 2), or left empty/unassigned.
- **Participant Seeding:** When a race begins, registered drivers are assigned to seeds 1 through $M$ according to their race seeding order (or randomized qualifying order).

For example, a single "4-Lane Club Sprint" custom rotation set asset might contain:

- A **4-Driver Rotation:** A 4-heat schedule where 4 drivers each race once on each of the 4 lanes.
- A **5-Driver Rotation:** A 5-heat schedule where 5 drivers rotate through the 4 lanes, with one driver sitting out each heat.
- A **6-Driver Rotation:** A 6-heat schedule where 6 drivers rotate, ensuring balanced track time.
- An **8-Driver Rotation:** An 8-heat schedule accommodating larger turnouts.

---

### Rotation Selection Algorithm {: #rotation-selection-algorithm }

When a race configured with a custom rotation format begins (or when the race editor generates the live heat preview), Race Coordinator AI automatically determines which rotation from the custom rotation set to use.

The system counts the number of active, participating drivers (`driverCount`) and selects the optimal rotation using a strict **three-tier prioritization strategy**:

#### 1. Tier 1: Exact Match {: #selection-tier-1 }
The system first searches for a rotation whose configured maximum driver count (`numDrivers`) **exactly equals** the active driver count (`numDrivers == driverCount`).

- **Result:** The exact-match rotation is selected.
- **Lane Mapping:** Every participating driver maps 1:1 to their corresponding virtual seed (Driver 1 races as Seed 1, Driver 2 as Seed 2, etc.). There are no empty lanes unless the rotation itself was explicitly designed with unoccupied lanes.

#### 2. Tier 2: Closest Above (Smallest Rotation Greater Than Driver Count) {: #selection-tier-2 }
If no rotation matches the exact driver count, the system searches for all rotations in the set whose maximum driver capacity is **greater than** the active driver count (`numDrivers > driverCount`). Among these, it selects the rotation with the **smallest difference**:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Result:** The closest larger rotation is selected to ensure all participating drivers get to race.
- **Empty Lane Handling:** Because fewer drivers are present than the rotation was designed for, any lane slot assigned to a virtual driver seed that exceeds the active driver count (i.e. `Seed > driverCount`) is automatically filled with an **empty driver slot** (`Driver.EMPTY_DRIVER`). That lane will run unoccupied for that heat, while all participating drivers race in their scheduled positions.

#### 3. Tier 3: Closest Below (Largest Rotation Less Than Driver Count) {: #selection-tier-3 }
If the active driver count exceeds the maximum capacity of **every** rotation defined in the custom rotation set (for example, 9 drivers enter, but the largest rotation in the set only supports 8 drivers), the system falls back to the rotation with the **largest capacity less than the active driver count**:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Result:** The closest smaller rotation is selected.
- **Capacity Limitation:** Only drivers whose seed falls within the selected rotation's capacity (Drivers 1 through `numDrivers`) will be scheduled to race in those heats. Any drivers with seed indices beyond `numDrivers` will not receive heat assignments.

!!! tip "Design Tip: Cover Your Field Sizes"
    To guarantee that all drivers race without unscheduled participants or unexpected empty lanes, create a rotation for each expected field size (e.g. 4, 5, 6, 7, and 8 drivers) within the same custom rotation set asset.

---

### Selection Examples in Practice {: #selection-examples }

Assume you have a custom rotation set asset with three rotations defined: **4 Drivers**, **6 Drivers**, and **8 Drivers**. The table below illustrates which rotation Race Coordinator AI selects based on participant count:

| Registered Drivers | Available in Set | Selected Rotation | Selection Rule | Empty Lane & Field Behavior |
| :---: | :---: | :---: | :---: | :--- |
| **4 Drivers** | 4, 6, 8 | **4-Driver Rotation** | **Tier 1 (Exact Match)** | Perfect fit. All lanes filled; all 4 drivers race. |
| **5 Drivers** | 4, 6, 8 | **6-Driver Rotation** | **Tier 2 (Closest Above)** | Seed 6 slots run as empty lanes. Drivers 1–5 race. |
| **6 Drivers** | 4, 6, 8 | **6-Driver Rotation** | **Tier 1 (Exact Match)** | Perfect fit. All lanes filled; all 6 drivers race. |
| **7 Drivers** | 4, 6, 8 | **8-Driver Rotation** | **Tier 2 (Closest Above)** | Seed 8 slots run as empty lanes. Drivers 1–7 race. |
| **8 Drivers** | 4, 6, 8 | **8-Driver Rotation** | **Tier 1 (Exact Match)** | Perfect fit. All lanes filled; all 8 drivers race. |
| **9 Drivers** | 4, 6, 8 | **8-Driver Rotation** | **Tier 3 (Closest Below)** | Drivers 1–8 race. Driver 9 is unscheduled. |

---

## Creating a Custom Rotation Set {: #creating-custom-rotations }

To create a new custom rotation set asset:

1. Open the **Asset Manager** from the main menu or setup screen.
2. In the left panel, click the **New Custom Rotation Set** button (or filter by **Custom Rotation Sets** and click an existing card to edit).
3. The **Rotation Editor** opens:
   - When creating a new rotation asset, the editor initially displays an empty state banner with guidance and a **Learn more about custom rotation sets** link to this documentation.
   - Enter a unique **Asset Name** in the configuration panel.
   - Select your target **Track**. The track selection automatically configures the number of lanes for all rotations in the set.

---

## Designing Heats & Lanes {: #designing-heats }

### Adding Rotations to the Set {: #adding-rotations }

1. Click the **Add Rotation** button (`+`) in the top toolbar to create your first rotation card.
2. Set the **Number of Drivers** field in the rotation card's header. This defines the maximum driver capacity for that specific rotation.
3. Optionally enter a **Description** (label) in the header to identify the rotation (e.g. `EURO D18 G3-666 X>1`, `Sprint Format`, or `Exhibition`). When creating a new rotation, this field starts blank; when importing a rotation file, it automatically defaults to the import file's name.
4. The rotation card automatically populates with an initial heat containing lane slots for your track.

### Adding and Reordering Heats {: #adding-heats }

- **Add Heat:** Click the `+` icon on the rotation header to append additional heats to the rotation.
- **Reorder Heats:** Drag and drop heat cards within the grid to change the sequence of heats.
- **Delete Heat:** Click the trashcan icon on an individual heat card to remove it.

### Assigning Drivers to Lanes {: #assigning-drivers }

- **Virtual Drivers Pool:** The left panel provides a pool of virtual drivers (`Driver 1`, `Driver 2`, etc.). You can adjust the **Number of Drivers** in the pool to generate as many virtual seeds as needed.
- **Drag and Drop:** Drag driver chips from the pool directly into lane slots on any heat card.
- **Lane Swapping:** Drag a driver chip from one lane and drop it onto another lane to swap their assignments.
- **Clear Lane:** Click or drag a driver out of a lane to leave it unoccupied (empty).

### Group Assignments {: #group-assignments }

Each heat card includes a **Group** number input:

- Assign heats to different group numbers (e.g. Group 1, Group 2) when staging multi-group races.
- Drivers in different groups race independently, and standings can be separated by group in the race configuration.

### Lane Equality Validation {: #lane-equality-validation }

Fairness is vital in slot car racing. Race Coordinator AI continuously validates lane distribution for every rotation:

- **Checkmark Badge (Green):** Indicates that every driver runs an equal number of times on each lane across the rotation.
- **Warning Badge (Orange):** Indicates that lane assignments are unbalanced (for example, Driver 1 runs on Lane 1 twice, but never on Lane 4).
- **Equality Report:** Click the equality badge to open the detailed **Lane Equality Report**. The report displays an appearance matrix showing exactly how many times each driver races in each physical lane.

### Sorting Rotations {: #sorting-rotations }

Click the **Sort Rotations** button (`swap_vert`) in the title toolbar to automatically organize all rotation cards in ascending order by their maximum driver count (e.g. 4 drivers, then 5, then 6).

---

## Importing & Exporting Rotations {: #importing-exporting }

You can share rotations between systems or archive rotation sets:

- **Export Full Asset:** Click the **Export** button in the top toolbar to download the entire custom rotation set asset (including all rotations and heats) as a `.json` file.
- **Export Single Rotation:** Click the export icon (`upload`) on an individual rotation expander card to export only that specific driver count configuration.
- **Import Rotations:** Click the **Import** button in the top toolbar to load `.json` rotation files or legacy Race Coordinator (`.txt` RC1 format) rotation files into your asset. The rotation's description automatically defaults to the imported file name.

---

## Using Custom Rotation Sets in Races {: #using-in-races }

Once your custom rotation set asset is saved:

1. Open the [Race Editor](race-editor.md).
2. Under the **Race Setup** section on the left panel, set **Heat Rotation Format** to **Custom Rotation Set**.
3. Select your custom rotation set asset from the **Custom Rotation Set** dropdown.
4. Adjust race settings as desired:
   - **Heat Times Through:** Repeats the entire custom rotation sequence $N$ times.
   - **Reverse Heats:** Inverts the heat order so drivers race the schedule in reverse sequence.
5. Use the **Driver Count Preview** slider and inspect the **Live Heat Preview** on the right panel to verify how the rotation selection algorithm schedules heats for varying field sizes before race day.
