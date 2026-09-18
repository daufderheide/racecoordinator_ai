# Track Editor

The **Track Editor** is the central configuration interface for modeling your physical slot car track, customizing lane dimensions and colors, and establishing communication with your timing hardware, relays, sensors, and visual lighting systems.

Race Coordinator AI features an advanced multi-interface architecture that allows multiple timing and control controllers (such as an Arduino, Trackmate, Phidget, or BART) to run concurrently on a single track.

---

## Overview & Auto-Saving

The Track Editor provides a unified interface for selecting, viewing, configuring, and testing your slot car tracks:

- **Track Selector**: Located in the top header next to the page title, this dropdown lists all configured tracks and allows you to quickly switch between tracks.
- **Read-Only Mode**: By default, opening the editor displays track properties, lane layouts, and hardware interfaces in read-only mode. Form inputs, lane management, and interface editing controls are locked to prevent accidental modifications.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks all configuration controls, lane reordering, and hardware interface editing. While in Edit Mode, the track selector dropdown is locked to prevent accidental navigation away from unsaved edits.
- **Continuous Auto-Save**: As you make changes (renaming, adjusting lane dimensions, reordering lanes, modifying pin assignments), your edits are automatically saved to the server in the background without dropping out of Edit Mode.
- **Exiting Edit Mode**: Clicking the **Done Editing** (checkmark) icon validates your changes, ensures all edits are persisted, and returns the editor to Read-Only Mode.
- **Discarding Changes**: If you attempt to leave the editor with unsaved or invalid changes, the unsaved changes dialog prompts you to confirm. Discarding changes reverts all edits back to the last-saved version and restores Read-Only Mode.

The editor workspace is split into two synchronized working panels:

- **Left Panel (General Track & Lane Properties)**: Configure track identification, segment counts, physical scale, and individual lane attributes (dimensions, ordering, and colors). Add new hardware interfaces from the bottom of this panel.
- **Right Panel (Hardware Interfaces & Interactive Testing)**: Configure attached hardware controllers, map physical pins and channels to track behaviors, configure addressable RGB LED lighting strips, and test sensors and relays in real time.

All modifications made in the Track Editor are **automatically validated and saved in real time**. If an invalid configuration is detected (such as a blank track name, duplicate name, or an unassigned required pin), saving is temporarily halted and visual warning indicators highlight the fields requiring correction.

---

## General Track Configuration

The header section of the Track Editor defines the foundational properties of your layout:

### Track Name
The unique identifier for your track across the Race Coordinator AI database. Each track must have a distinct name.

### Number of Track Sections
Defines the number of discrete segments into which your track is divided. This setting serves two distinct purposes:

1. **Partial Lap Scoring at Heat End**:
   - Setting this value to **100** (the factory default) represents a percentage-based breakdown, allowing race directors to award partial laps with two decimal places of precision (e.g., $14.65$ laps) based on where a car stops at the end of a timed heat.
   - If you place physical marker posts or tape lines along your track, set this number to match your physical marker count (e.g., 20 markers around a 60-foot circuit). When a heat ends, race marshals record the nearest marker number passed by each car to assign precise partial lap scores.
2. **Split / Sector Timing**:
   - When track interfaces are configured with sector/split timing sensors, this setting determines the expected sector division around the layout.

### Track Scale
Select the physical scale of your track from the dropdown menu:

- **1:1 (Full Scale)**
- **1:24 Scale** (Large commercial / hard-body slot cars)
- **1:32 Scale** (Standard club / ready-to-run slot cars, Carrera, Scalextric, Policar)
- **1:43 Scale** (Compact analog and digital layouts)
- **1:64 Scale (HO)** (HO scale slot cars, AFX, Auto World, Tyco)

!!! info "Scale Speed Telemetry"
    Race Coordinator AI uses the **Track Scale** in combination with each individual **Lane Length** to calculate authentic scale speeds (in Miles Per Hour or Kilometers Per Hour) displayed on telemetry leaderboards, driver station screens, and XLS race exports.

---

## Lane Configuration

The **Lane Editor** section allows you to customize the geometry, starting grid order, and visual styling of every lane on your track.

```
+---------------+-------------------+--------------------+-------------------+
|  Reorder / X  |  Lane # & Length  |  Background Color  |  Foreground Color |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Red ]       |     [ White ]     |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ White ]      |     [ Black ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |      [ Blue ]      |     [ White ]     |
|  [::]   [X]   |  #4  [ 53.75 ] ft |     [ Yellow ]     |     [ Black ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Adding and Deleting Lanes
- **Add Lane (`+`)**: Click the **`+`** button in the Lane Editor header to append a new lane. Race Coordinator AI dynamically provisions default background and foreground contrast colors for each added lane.
- **Delete Lane (`X`)**: Click the red **`X`** button beside any lane to remove it. When a lane is deleted, all hardware interfaces automatically re-index and prune obsolete channel bindings.

### Drag-and-Drop Lane Reordering
Grab the drag handle icon (**`::`**) on the left of any lane item to drag it up or down in the grid order. Reordering lanes immediately updates heat rotation grids, driver station lane indices, and scoreboard positions without losing length or color settings.

### Lane Length (Feet / Meters)
Enter the physical centerline length of each lane in **feet**. 

On road courses or tracks without equalized crossover bridges, inside lanes are physically shorter than outside lanes. Entering precise physical lengths for each individual lane ensures that:
- Scale speed calculations (MPH / KPH) are accurate for every lane.
- Lap distance and fuel burn metrics reflect true physical distance traveled.

!!! tip "Metric Conversion Reference"
    If your track was measured in meters, convert to feet using:
    
    $$\text{Length (feet)} = \text{Length (meters)} \times 3.28084$$
    
    $$(1\text{ foot} = 0.3048\text{ meters})$$

### Lane Colors (Background & Foreground)
Each lane features two dedicated color pickers:

- **Background Color**: The primary color identifier representing the lane (e.g., Red, White, Blue, Yellow, Orange, Green, Purple, Black). Used across all raceday UI displays, driver station tiles, and leaderboard headers.
- **Foreground Color**: The text and icon contrast color rendered on top of the background color (e.g., White text on Red background, Black text on Yellow background).

!!! note "Hardware Color Synchronization"
    Changing a lane's background color automatically synchronizes with all configured Arduino FastLED RGB strips, updating lane status lights and pit stop refueling indicators to match your physical track lanes.

---

## Hardware Interface Architecture

Race Coordinator AI supports connecting multiple hardware timing and control systems simultaneously.

### Multi-Interface Support
You can combine different hardware controllers on the same track. For example:
- Use a **Trackmate** board for ultra-precise optical lap timing and master track relay switching.
- Simultaneously attach an **Arduino** running the Race Coordinator AI sketch to drive addressable FastLED RGB start light gantries, pit lane refueling bar graphs, and yellow caution flag flashers.
- Connect a **Phidget** digital interface to handle driver call buttons, pit stop sensors, or sector split timing.

### Interface Tabs & Quick Navigation
The right panel displays tab buttons for every configured interface along the top bar. Clicking any interface tab smoothly scrolls the preview panel directly to that controller's configuration section.

### Live Connection Status Indicators
Each interface card features a prominent real-time status badge:

| Status Badge | Meaning | Action Required |
| :--- | :--- | :--- |
| **Connected** (Solid Green) | Active communication established; data flowing bi-directionally. | Ready for racing and interactive testing. |
| **No Data** (Amber) | Device detected on port, but no telemetry or heartbeat received. | Check baud rate, USB connection, or sketch version. |
| **Disconnected** (Grey / Red) | Hardware not found, port closed, or power disconnected. | Verify COM port selection, USB cable, and board power. |

---

## Supported Hardware Interfaces

### 1. Arduino Interface

The **Arduino** interface is the most versatile and extensible timing solution supported by Race Coordinator AI. Using an official Arduino Uno, Mega, or compatible clone, you can manage lap timing, track power relays, call buttons, segment split timing, analog throttle telemetry, and multi-string addressable FastLED RGB lighting.

#### Board Types
- **Arduino Uno**: Ideal for 2-lane to 4-lane tracks. Features 14 digital I/O pins (pins 2–13) and 6 analog inputs (A0–A5).
- **Arduino Mega 2560**: Recommended for 6-lane to 8-lane tracks, tracks with multiple sector split sensors, or setups with extensive addressable RGB lighting. Features 54 digital pins (pins 2–53) and 16 analog inputs (A0–A15).

#### Connection & Firmware Compatibility
- **Serial COM Port**: Select the USB COM port assigned to the Arduino by your operating system.
- **Baud Rate**: High-speed serial communication (default `115200` baud).
- **Sketch Compatibility**:
    - **Race Coordinator AI Sketch (`v2.1.0.x`)**: Fully supports all modern capabilities, including multi-string addressable FastLED RGB lighting, voltage dividers, and dynamic status telemetry.
    - **Legacy Race Coordinator 1.0 Sketch (`v1.0.0.x`)**: Fully backward-compatible for lap counting, track power relays, and call buttons. When connected to a legacy sketch, addressable RGB LED configuration options are disabled with an informational tooltip.

#### Debounce Filter ($\mu\text{s}$)
Configures input pin debounce timing in **microseconds** ($1\text{ ms} = 1000\,\mu\text{s}$). If an electrical contact or optical signal toggles state within this window, rapid fluctuations are ignored as noise. 

- For optical infrared or photo-transistor sensors: Set between **100 to 500 $\mu\text{s}$**.
- For mechanical micro-switches or dead strips: Set between **1000 to 5000 $\mu\text{s}$**.

#### Invert Logic Options (Normally Closed)
- **Normally Closed Lane Sensors**: When enabled, the software expects sensors to read a high logic level when idle and drop low when broken by a car. Optical photo-detectors and infrared sensors are typically Normally Closed. Dead strips and mechanical reed switches typically require this setting to be disabled.
- **Normally Closed Relays**: When enabled, the relay energizes to cut track power and de-energizes to provide track power. This fail-safe ensures track power remains active even if the race management computer is powered down.

#### Lap Pin Pit Behavior
Enables lap timing sensors to perform dual duty during fuel simulation races without requiring physical pit lane wiring:
- **None**: Lap sensors record laps only.
- **Pit In**: Triggering the lap sensor initiates pit refueling.
- **Pit Out**: Triggering the lap sensor ends pit refueling.
- **Pit In/Out**: Crossing the sensor initiates refueling; after completing a pit stop and leaving, the next trigger counts a lap.

#### Digital & Analog Pin Assignments
Each physical pin on the Arduino can be assigned to a specific track behavior:

| Behavior Group | Pin Roles | Description |
| :--- | :--- | :--- |
| **Lap Counting** | `Lap Sensor (Lane 1..N)` | Detects cars crossing the start/finish line. |
| **Power Control** | `Master Relay` | Controls global track power across all lanes. |
| | `Lane Relay (Lane 1..N)` | Controls individual lane power for false starts or out-of-fuel penalties. |
| **Race Control** | `Track Call Button` | Triggers a track-wide caution flag and cuts track power. |
| | `Lane Call Button (1..N)` | Triggers caution flag attributed to a specific driver station. |
| **Timing & Pits** | `Sector / Split (1..N)` | Intermediate timing sensors around the track layout. |
| | `Pit In / Pit Out (1..N)` | Dedicated optical sensors positioned at pit lane entry and exit. |
| **RGB Lighting** | `RGB LED String` | Designates a digital pin as a data line driving an addressable LED strip. |
| **System** | `Unused` / `Reserved` | Unconnected pins or pins handled by custom user sketch extensions. |

!!! tip "Interactive Hardware Testing"
    Beside every assigned pin selector is a **Live Status Badge**. When the Arduino is connected:
    - **Input Pins (Sensors/Buttons)**: Triggering a physical optical sensor or pressing a call button flashes the badge from grey to bright green for 500ms.
    - **Output Pins (Relays)**: Clicking the status badge directly toggles the physical relay on and off to verify track power wiring.

#### Voltage Dividers & Throttle Telemetry
Analog pins can be wired to resistor voltage dividers across track rails or controller wiper lines to monitor real-time throttle voltage ($0\text{--}5\text{V}$):

- **Live Indicator**: Displays the real-time analog reading ($0\text{--}1023$) coming from the controller.
- **Max Voltage**: Calibrate the value representing 100% full throttle.
- **"Set Max to Indicator"**: Sets the maximum threshold directly to the highest voltage level observed while squeezing the throttle fully.
- **"Reset Max Seen"**: Clears accumulated peak readings to perform fresh calibration.
- **Link Lanes**: Toggles linked calibration so adjustments apply across all lanes simultaneously.

#### FastLED Addressable RGB Lighting
The Race Coordinator AI sketch features integrated FastLED support for digital RGB LED strips (such as WS2812B, NeoPixels, WS2811, or SK6812).

1. **LED String Setup**: Assign a digital pin to `RGB LED String`, then configure:
   - **Number of LEDs**: The total number of physical LEDs chained along the data line.
   - **Brightness**: Global brightness scale from **0** (off) to **255** (maximum intensity).
   - **Flash Rate**: Flashing frequency in flashes per second during yellow flags and countdowns.
   - **Chipset & Color Order**: Select chipset (`WS2812B`, `WS2811`, `SK6812`) and color data order (`GRB`, `RGB`, `BGR`) to ensure color accuracy.
2. **Per-LED Behavior Assignment**:
   - **Start Lights**: Multi-stage starting gantry sequence (Red 1, Red 2, Red 3, Red 4, Green GO, and Red False Start warning).
   - **Flag Status**: Displays green flag (race active), flashing yellow flag (track call/caution), or red/checkered flag (heat finish).
   - **Lane Status / Power**: Illuminates in the physical lane's color when power is active, turning red or off when power is killed.
   - **Refueling Level Gauges**: Dynamically fills an LED segment as a car refuels during pit stops, turning green when the tank reaches 100%.
   - **Heat Leader Indicator**: Glows or pulses in the color of the driver currently leading the heat.
   - **Lap Flasher**: Pulses in lane color each time a car completes a lap.

---

### 2. Trackmate Interface

The **Trackmate** interface provides native integration for commercial Trackmate timing boards connected via USB or RS-232 serial COM ports.

- **Serial COM Port**: Select the COM port assigned to the Trackmate controller.
- **Debounce Filter (Levels 1–4)**: Hardware-enforced debounce filtering to prevent double lap triggers on high-speed cars. Level 2 or 3 is standard for 1:32 and 1:24 slot cars.
- **Normally Closed Logic**: Invert sensor and relay signal polarities to match optical infrared gantries or dead strips.
- **Per-Lane Relays Toggle**: Enable if your Trackmate hardware is equipped with an external 4-channel or 8-channel relay board for individual lane power cutoffs, rather than a single master relay.
- **8 Sensor Channels**: Map the 8 Trackmate hardware sensor channels to specific lanes or pit stop sensors.
- **Relay Control & Test**: Interactive buttons in the Trackmate editor allow you to manually toggle the master relay and individual lane relays to verify wiring.
- **Call Button Input**: Dedicated input channel for track call buttons with live green activity badge.

---

### 3. Phidget Interface

The **Phidget** interface integrates industrial Phidgets USB and VINT I/O modules, including the PhidgetInterfaceKit 0/16/16 (16 digital inputs, 16 digital outputs), 8/8/8 (8 digital inputs, 8 digital outputs, 8 analog inputs), and 1014 Relay modules.

- **Automatic Device Discovery**: Phidget boards are automatically discovered and listed by **Device Serial Number** and **VINT Hub Port**.
- **Digital Inputs**: High-speed, optically isolated digital input channels mapped to lane lap counting, track call buttons, segment split timing, or pit stop sensors. Each input features a real-time activity status indicator.
- **Digital Outputs / Relays**: Output channels mapped to master track power relays, individual lane power switches, or external physical warning sirens.
- **Analog Inputs**: Connect analog voltage sensors or current sensors for throttle position monitoring and fuel depletion simulation.
- **Normally Closed Inversions**: Independently invert sensor and relay logic polarities.

!!! warning "Phidget22 Drivers Required"
    Phidget hardware requires the native **Phidget22** libraries to be installed on your host computer (Windows, macOS, or Linux). If the drivers are missing, Race Coordinator AI presents an informational dialogue with download instructions.

---

### 4. BART (Policar Bluetooth Automated Race Timer)

The **BART** interface connects wirelessly to Policar BART Bluetooth Low Energy (BLE) timing sensors and transponder gantries.

- **Wireless BLE Device Discovery**: Race Coordinator AI continuously scans for nearby Bluetooth Low Energy devices. Select your BART timer from the discovered devices dropdown without needing COM ports or USB cables.
- **Hardware Channels (Up to 32)**: Automatically detects the available hardware channels provided by the BART transponder gantry and maps them to lane lap counting and pit timing.
- **Minimum Lap Time Filter (ms)**: Enforces a minimum lap threshold directly at the hardware layer to filter out false or trailing sensor pulses.
- **Lap Pin Pit Behavior**: Allows BART lap sensors to trigger pit stops during fuel races.
- **Live Channel Activity**: Flashes bright green whenever a car crosses a BART optical gate.

---

### 5. Demo / Simulation Interface

When testing race formats, custom themes, rotation schedules, or Text-to-Speech audio callouts without physical track hardware attached, you can run races in **Demo Mode**.

- **Realistic Simulated Racing**: The server generates realistic lap times, lap variances, sector split times, and simulated pit stops based on your track's configured lanes and scale.
- **Zero Configuration Required**: Demo mode works immediately on any track layout without assigning hardware pins or serial ports.

---

## Editor Operations & Toolbar

The top toolbar of the Track Editor provides essential management tools:

- **Back**: Returns to the previous view or Race Day Setup.
- **Add Track (+)**: Creates a new track template and enters Edit Mode.
- **Duplicate Track**: Creates an exact copy of the currently selected track under a new unique name. Ideal for creating alternate configurations (e.g., standard racing vs. digital fuel layout) without rebuilding lane dimensions and pin assignments from scratch.
- **Edit / Done Editing**: Toggles between Read-Only Mode and Edit Mode. When exiting Edit Mode, changes are validated and persisted.
- **Delete Track**: Deletes the selected track after confirmation.
- **Undo (`Ctrl+Z`) / Redo (`Ctrl+Y`)**: Seamlessly revert or restore changes across lane dimensions, color adjustments, pin reassignments, and interface additions.
- **Help (`?`)**: Opens the interactive guided tour highlighting every control, field, and button directly on the screen.

---

## Common Hardware Issues & Troubleshooting

### Inverted Track Power (Relay Backwards)
- **Symptom**: Track has power during a yellow caution flag or when the race is paused, but power cuts off when the green flag waves.
- **Solution**: Toggle the **Normally Closed Relays** checkbox in your interface configuration (Arduino, Trackmate, or Phidget).

### Continuous Refueling in Fuel Races
- **Symptom**: Cars enter the pit lane or cross the lap line and remain in a continuous refueling state without releasing.
- **Solution**: Toggle the **Normally Closed Lane Sensors** checkbox. When set incorrectly, the software interprets an unbroken optical beam as an active car parked over the pit sensor.

### False Double Laps or Missed Triggers
- **Symptom**: Cars trigger two laps on a single pass, or fast cars fail to register.
- **Solution**:
    - For double triggers: Increase the **Debounce** time (e.g. increase from $200\,\mu\text{s}$ to $500\,\mu\text{s}$ on Arduino, or increase debounce level from 2 to 3 on Trackmate).
    - For missed laps: Decrease the debounce time, verify optical gantry alignment, and ensure phototransistor infrared emitters have adequate power.

### FastLED RGB LEDs Not Illuminating
- **Symptom**: LED strips remain dark or display incorrect colors during start sequences.
- **Solution**:
    1. Ensure the Arduino is running the official **Race Coordinator AI sketch (`v2.1.0.x`)**; legacy `v1.0.0.x` sketches do not support FastLED control.
    2. Check that the **LED Type** (e.g., `WS2812B`) and **Color Order** (e.g., `GRB`) match your physical strip specifications.
    3. Verify that the 5V power supply ground is bonded to the Arduino ground (common ground). Powering long LED strips directly from the Arduino's 5V pin will cause voltage drops and brownouts.
