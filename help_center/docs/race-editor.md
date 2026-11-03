# Race Editor

The **Race Editor** allows you to create, customize, and manage race configurations. Here you can set up scoring rules, heat rotations, fuel simulations, and race options.

---

## Overview & Auto-Saving

The Race Editor provides a unified interface for selecting, viewing, configuring, and testing your slot car race formats:

- **Race Selector**: Located in the top header next to the page title, this dropdown lists all configured races and allows you to quickly switch between races.
- **Read-Only Mode**: By default, opening the editor displays race properties, scoring rules, rotation settings, and fuel configuration in read-only mode. Form inputs, options, and settings are locked to prevent accidental modifications, while accordion sections and heat previews remain fully expandable and interactive.
- **Edit Mode**: Clicking the **Edit** (pencil) icon on the toolbar unlocks all configuration controls, scoring methods, and fuel settings. While in Edit Mode, the race selector dropdown is locked to prevent accidental navigation away from unsaved edits.
- **Continuous Auto-Save**: As you make changes (renaming, adjusting heat durations, changing scoring methods, modifying fuel curves), your edits are automatically saved to the server in the background without dropping out of Edit Mode.
- **Exiting Edit Mode**: Clicking the **Done Editing** (checkmark) icon validates your changes, ensures all edits are persisted, and returns the editor to Read-Only Mode.
- **Discarding Changes**: If you attempt to leave the editor or click Discard, the unsaved changes dialog prompts you to confirm. Discarding changes reverts all edits back to the last-saved version and restores Read-Only Mode.

The editor workspace is split into two synchronized working panels:

- **Left Panel (Race Configuration)**: Configure general race properties, race format, scoring methods, rotation type, team settings, group options, and analog/digital fuel simulations.
- **Right Panel (Live Heat Preview)**: Dynamically generates and displays the complete list of heats based on the active rotation type, driver count, and lane assignments, updating in real time as you adjust settings.

---

## Race Setup {: #race-setup }

The left panel configures the core format and track association for your race:

- **Race Name**: Unique name identifying the race format across race day and statistics.
- **Track**: The physical track associated with this race. The selected track determines whether Analog Fuel or Digital Fuel simulation is available.
- **Theme**: Visual UI theme applied to the race display during raceday.
- **Heat Rotation Format**: Choose between standard rotations (**Round Robin**, **Ladder**, **Tournament**) or custom defined sequences.
- **Heat Times Through**: Specifies how many times each driver cycles through the complete heat rotation.
- **Reverse Heats**: Inverts the rotation order so drivers run heats in reverse sequence.
- **Driver Count Preview**: Dynamically previews the generated heat list based on the configured driver count.

The right panel displays the **Live Heat Preview**, dynamically generating the complete list of heats, driver rotations, and lane assignments in real time as you adjust settings.

---

## Navigation Tabs {: #navigation-tabs }

The tab bar at the top of the race editor provides one-click navigation shortcuts to jump directly to any configuration section:

- **General**: Themes, audio callouts, lap filters, and UI preferences.
- **Heats**: Auto start and advance timing, heat repetitions, and reverse heat order.
- **Scoring**: Heat and overall ranking methods, finish conditions, tiebreakers, and dropped heats.
- **Groups**: Driver group separation, independent rotation schedules, and leaderboard advancement.
- **Start Method**: Start and restart timing, track starting positions, hot starts, and false start penalties.
- **Team Options**: Endurance racing, driver swaps, and stint limits.
- **Analog Fuel**: Per-lap fuel consumption, tank capacity, and refuel rates.
- **Digital Fuel**: Continuous throttle-driven fuel consumption and custom curves.
- **Season Points**: Championship points schedule, heat points, and bonus points.

Clicking any tab immediately scrolls to and expands that accordion section.

---

## General Settings {: #general-settings }

The General Settings expander controls presentation, timing filters, and race management behavior:

- **Theme Selection**: Assign custom color schemes and scoreboard layouts for raceday displays.
- **Audio Callouts**: Enable automated voice announcements for lead changes, fast laps, pit stops, and race finishes.
- **Minimum Lap Time (s)**: Minimum allowable lap time to filter out electrical glitches or false sensor triggers.
- **Drift Time (s)**: Sensor trigger window to handle car drift or sliding over the finish line.
- **Yellow Flag Rules**: Automatic or manual yellow flag pauses and track power cutoff.
- **Custom UI Options**: Select specialized leaderboards and custom telemetry widgets.

---

## Heat Options {: #heat-options }

The Heat Options expander configures automated pacing, heat cycle counts, and rotation sequencing:

- **Auto Advance Time (s)**: Seconds to wait after a heat concludes before automatically moving to the next heat in the schedule.
- **Auto Advance Warmup / Cooldown Time (s)**: Warmup lead-in interval before auto advance takes effect.
- **Auto Start Time (s)**: Automated countdown delay before initiating the next heat once drivers are staged.
- **Auto Start Warmup Time (s)**: Staging warmup duration before the auto start countdown begins.
- **Heat Times Through**: Specifies how many times each driver cycles through the entire heat rotation schedule.
- **Reverse Heats**: Inverts the scheduled heat sequence so drivers run heats in reverse order.
---

## Scoring Rules {: #scoring-rules }

The Scoring Rules expander defines how drivers are ranked in heats and across the entire race:

- **Heat Ranking Method**: Rank drivers in each heat by **Most Laps**, **Fastest Lap**, or **Fastest Total Time**, with configurable tiebreakers.
- **Finish Method**: Set how the end of a heat is determined (by target **Lap Count** or elapsed **Time** in seconds).
- **Allow Finish**: Choose how cars complete their laps when the leader finishes or time expires (e.g., immediate end, allow all to finish, single lap finish, or automatic segment credit).
- **Overall Ranking Method**: Rank overall race standings across all completed heats with customizable tiebreakers and dropped heats.

### Lap and Time Adjustments (Impact on Rankings and Metrics)

Race Coordinator AI allows race directors to manually adjust a driver's lap count and total heat time during or after a heat (via cell click on lap/time columns, keyboard shortcuts, or the Race Director Menu). Because the server acts as the authoritative source of truth for all calculations, manual adjustments flow deterministically into heat standings, overall rankings, and telemetry statistics:

- **Adjusted Laps (`userLaps`)**:
  - **Formula**: $\text{Adjusted Lap Count} = \text{Physical Laps} + \text{Penalty Laps} + \text{User Laps} + \text{Auto Segments}$.
  - **Rankings**: When the ranking method is **Most Laps**, adjusted laps directly determine heat and overall standings.
  - **Metrics**: Physical lap count remains untouched (reflects actual sensor crossings). Average lap time ($\text{Total Time} / \text{Physical Laps}$), best lap time, and median lap time are unaffected. Lap gaps update immediately.
- **Adjusted Time (`userTime`)**:
  - **Formula**: $\text{Adjusted Total Time} = \sum (\text{Physical Lap Times}) + \text{User Time}$.
  - **Rankings**: When the ranking method is **Fastest Total Time**, adjusted time directly determines the standings (lower time ranks higher). When ranking by **Most Laps**, adjusted time serves as the primary tiebreaker for drivers tied on laps. Overall standings sum the adjusted total times across all scored heats.
  - **Metrics**: Average lap time ($\text{Adjusted Total Time} / \text{Physical Laps}$) is directly impacted—adding penalty time increases average lap time (slower pace). Gap metrics (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`) recalculate to reflect the time adjustment.
  - **Protected Metrics**: **Best lap time** and **median lap time** are **NOT impacted** by time adjustments. Best lap time strictly represents the fastest single physical lap recorded, and median lap time represents the middle physical lap time.

| Metric / Standings Feature | Adjusted Laps (`userLaps`) | Adjusted Time (`userTime`) |
| :--- | :--- | :--- |
| **Adjusted Lap Count** | **Directly changes** ($\pm\text{sections}/\text{laps}$) | Unaffected |
| **Physical Lap Count** | Unaffected (actual sensor laps only) | Unaffected (actual sensor laps only) |
| **Heat Total Time** | Unaffected | **Directly changes** ($+ \text{userTime}$) |
| **Overall Total Time** | Unaffected | **Directly changes** (sums heat total times) |
| **Standings (Most Laps)** | **Primary ranking factor** | **Tiebreaker factor** (lower time wins) |
| **Standings (Fastest Total Time)** | Tiebreaker factor | **Primary ranking factor** (lower time wins) |
| **Average Lap Time** | Unaffected ($\text{Time} / \text{Physical Laps}$) | **Directly changes** ($\text{Adjusted Time} / \text{Physical Laps}$) |
| **Best Lap Time** | **No impact** (fastest physical lap) | **No impact** (fastest physical lap) |
| **Median Lap Time** | **No impact** (median physical lap) | **No impact** (median physical lap) |
| **Gaps (`gapLeader`, `gapPosition`)** | Updates lap differential | Updates time and pace differential |

---

## Groups & Stages {: #groups-and-stages }

The Groups & Stages expander separates drivers into distinct groups that do not compete directly on the track against each other:

- **Group Separation**: Drivers are organized into isolated groups, running their own heats according to the rotation setup independently.
- **Max Groups**: Set the maximum number of distinct groups permitted for the race.
- **Balance Groups**: Automatically balances driver counts evenly across all groups.
- **Allow Empty Lanes**: Permits heats to run with unoccupied lanes when groups do not divide evenly across track lanes.
- **Force Multiple of Max**: Ensures total heats run in multiples of the maximum group capacity.
- **Rotate Group Heats**: Alternates heats across different groups rather than completing one group's heats entirely before starting the next.
- **Minimum Advancing**: Automatically advances top finishers from each group to the top of the overall standings leaderboard.
- **Group Names**: Assign custom names to each group (e.g., Pro, Semi-Pro, Amateur, or Group A/B/C).
---

## Start Methods {: #start-methods }

The Start Methods expander configures how heats begin, car positioning on the track, and start penalties:

- **Start / Restart Time (s)**: Countdown duration before a heat begins or restarts after a track call.
- **Randomizer Delays (s)**: Random delay added to the countdown to prevent drivers from timing the start lights.
- **Start Behind Sensor**: Requires cars to be positioned behind the start/finish timing sensors on lap zero.
- **Start at Current Position**: Allows cars to restart from their current physical location on the track after a pause rather than returning to the start line.
- **Hot Starts**: Enables power to remain on at the start of a heat so cars can accelerate immediately when the countdown finishes.
- **Restart on False Start**: Automatically halts and restarts the heat countdown if a false start is detected.
- **False Start Penalties**: Configures lap count deductions or time penalties assessed against drivers who jump the start.
---

## Team Racing Options {: #team-racing }

The Team Racing Options expander enables endurance racing formats with multi-driver teams:

- **Team Racing Mode**: Toggle team-based scoring where teams of drivers share heat assignments.
- **Driver Rotation Strategy**: Automatically cycle team drivers round-robin through successive heats.
- **Mid-Heat Driver Swaps**: Allow team drivers to swap places during pit stops or at designated lap milestones.
- **Stint Limits**: Set minimum and maximum driving stints per driver to guarantee balanced participation.
- **Mandatory Driver Swaps**: Enforce minimum pit stops and driver changes per heat or race.

---

## Analog Fuel Simulation {: #analog-fuel-simulation }

Analog fuel simulates fuel consumption on a **per-lap basis**. Because analog tracks detect cars when they cross the start/finish timing sensors, fuel is calculated and deducted each time a lap is completed.

### Configuration Options

- **Enable Analog Fuel**: Master toggle for analog fuel tracking. When unchecked, fuel simulation is disabled for the race and cars run without fuel restrictions.
- **Fuel Usage Type**: Determines the mathematical curve used to calculate fuel consumption based on lap pace:
    - **Linear**: Fuel consumption scales linearly with lap time. Faster laps burn more fuel, while laps twice as slow consume half the base fuel.
    - **Quadratic**: Fuel consumption scales with the inverse square of lap time, heavily penalizing very fast laps.
    - **Cubic**: Fuel consumption increases steeply for fast laps, aggressively penalizing drivers pushing for record lap times.
    - **Custom Curve**: Allows interactive, point-by-point shaping of the fuel curve directly on the SVG graph.
- **Fastest Time (s)**: The fastest expected lap time for the track and car class (in seconds).
- **Slowest Time (s)**: The slowest lap time (in seconds) for minimum fuel consumption.
- **Max Fuel Usage per Fastest Lap**: The fuel units consumed per lap when driving at or faster than the **Fastest Time**.
- **Min Fuel Usage per Slowest Lap**: The fuel units consumed per lap when driving at or slower than the **Slowest Time**.
    - For lap times between the Fastest Time and Slowest Time, fuel consumption transitions smoothly according to the selected **Fuel Usage Type** (Linear, Quadratic, Cubic, or Custom Curve).
- **Capacity**: The total volume of the fuel tank in arbitrary fuel units (e.g., 100).
- **Start Level (%)**: The percentage of maximum fuel capacity in the tank when a heat starts (e.g., 100% for a full tank, or less for sprint/handicap heats).
- **Refuel Rate (%/s)**: The speed at which fuel is added during a pit stop, measured as a percentage of total tank capacity replenished per second.
- **Pit Stop Delay (s)**: The mandatory stationary wait time in seconds before refueling begins once a car enters the pit lane.
- **Reset Fuel at Heat Start**:
    - **Checked**: Each driver's fuel level is reset to the configured **Start Level** at the beginning of every heat.
    - **Unchecked**: Fuel levels carry over from one heat to the next across rotations, requiring strategic fuel management throughout the entire race.
- **Out of Fuel Action**: The penalty applied to a driver who runs out of fuel (fuel reaches 0):
    - **Do Not Count Laps**: The car continues running under power, but any laps completed while empty are not credited to the driver's total until they enter the pits and refuel.
    - **End Heat**: The car's heat is immediately terminated, power to the lane is cut, and the driver is marked finished.
    - **Power Stutter**: Simulates an engine sputtering out of fuel by rapidly pulsing power to the lane on and off.
        - *Requires Track Relays*: This option is only selectable if the track interface includes individual per-lane power control relays.
        - **Power On Time (s)**: The duration lane power remains on during each stutter pulse.
        - **Power Off Time (s)**: The duration lane power is turned off during each stutter pulse.

### Pit Stops and Racing Time in Analog Fuel

To prevent pit stop time from being misinterpreted as an unusually slow lap (which would incorrectly reduce fuel consumption), Race Coordinator AI tracks **accumulated refuel time**. Any time spent stationary in the pit lane is subtracted from the total lap duration before computing fuel consumption:

$$\text{Racing Time} = \text{Lap Time} - \text{Accumulated Refuel Time}$$

### Visual Graph Previews (Analog)

- **Simultaneous Multi-Model Comparison**: All 3 preset mathematical models (**Linear**, **Quadratic**, and **Cubic**) are plotted simultaneously on both graphs. The currently selected type is highlighted in bold with a vibrant glow, while the remaining models serve as muted reference baselines (~40% opacity).
- **Fuel Usage per Lap**: Displays the exact fuel units consumed across the lap time spectrum (from Fastest Time to Slowest Time). In Custom Curve mode, draggable control nodes and preset reset buttons allow instant reshaping while the 3 baseline models remain visible for benchmarking.
- **Time to Pit**: Displays estimated total race time (or laps) before running out of fuel as a function of consistent lap times across all models.
- **Interactive Legend & Visibility Toggle**: Left-click any curve in the legend to toggle its visibility on or off. Hiding a curve dynamically rescales the graph axes, allowing closer inspection of the remaining curves.
- **Comparative Multi-Curve Hovercards**: Hovering over either graph displays comparative telemetry at the cursor's scrubbed point across all visible curves, with color-coded swatches, values, and an `(Active)` indicator for the selected model.

---

## Digital Fuel Simulation {: #digital-fuel-simulation }

Digital fuel simulates fuel consumption **continuously in real time** based on throttle telemetry transmitted from digital controllers and decoders.

### Continuous Throttle-Driven Consumption

Unlike analog fuel (which deducts fuel only at the lap line), digital fuel recalculates fuel consumption on every telemetry packet received from the track interface:

$$\text{Fuel Consumed} = \text{Usage per Second} \times \Delta t$$

Drivers who drive smoothly or lift in corners consume significantly less fuel than drivers who stay full throttle down long straights.

### Configuration Options

- **Enable Digital Fuel**: Master toggle for digital fuel tracking.
- **Fuel Usage Type**: Mathematical model applied to throttle input ($0\%$ to $100\%$):
    - **Linear**: Consumption scales directly in proportion to throttle position.
    - **Quadratic**: Consumption rises moderately at mid-throttle and accelerates towards full throttle.
    - **Cubic**: High throttle inputs consume exponentially more fuel than partial throttle cruising.
    - **Custom Curve**: Allows drivers to customize throttle-to-fuel response across the 0% to 100% throttle range.
- **Usage Rate**: Maximum fuel units consumed per second at **100% full throttle**.
- **Capacity**: Total volume of the fuel tank in fuel units.
- **Start Level (%)**: Starting percentage of fuel capacity for each heat.
- **Refuel Rate (%/s)**: Percentage of tank capacity refilled per second during pit stops.
- **Pit Stop Delay (s)**: Stationary pause in the pit bay before fuel flow begins.
- **Reset Fuel at Heat Start**: Toggle between resetting fuel to Start Level for every heat or carrying over fuel across heats.
- **Out of Fuel Action**:
    - **Do Not Count Laps**: Car remains operational, but laps completed while empty are not recorded.
    - **End Heat**: Driver is retired from the heat upon fuel depletion.

### Visual Graph Previews (Digital)

- **Simultaneous Multi-Model Comparison**: Plots Linear, Quadratic, and Cubic response curves simultaneously with the selected model highlighted and non-selected models visible as background baselines.
- **Digital Fuel Usage**: Plots throttle percentage ($0\%$ to $100\%$) against fuel consumed per second across all models.
- **Time to Empty**: Plots throttle percentage against total continuous driving seconds until the fuel tank runs completely dry.
- **Interactive Legend & Dynamic Scaling**: Toggle individual curves on/off by clicking their legend entries, automatically rescaling graph axes.
- **Comparative Multi-Curve Hovercards**: Scrubbing across the graph displays real-time values for each visible curve at that throttle percentage.

---

### Interactive Custom Curve Editing

When **Custom Curve** is selected as the Fuel Usage Type (in either Analog or Digital Fuel), interactive control handles appear directly on the SVG usage curve:

- **Initial Curve Generation**: When first switching to Custom Curve, the initial 5 points are sampled directly from the active preset (Linear, Quadratic, or Cubic) with zero visual jump.
- **Interactive Drag and Drop**: Click and drag any point up, down, left, or right to reshape the curve.
- **Enforced Monotonicity**:
    - *Analog Fuel*: Faster lap times must always use greater than or equal fuel compared to slower lap times (monotonically non-increasing curve). Dragging is constrained so points cannot invert or consume less fuel than slower laps.
    - *Digital Fuel*: Higher throttle levels must always use greater than or equal fuel compared to lower throttle levels (monotonically non-decreasing curve).
- **Adding Points**: Click anywhere along the curve line to insert a new control point at the exact interpolated position.
- **Deleting Points**: Right-click on any intermediate control point to remove it (minimum 2 endpoints are preserved).
- **Preset Reset Buttons**: Quickly reset the custom curve to Linear, Quadratic, or Cubic baseline templates via the toolbar buttons above the graph.
- **Background Persistence**: If you switch from Custom Curve to a preset and later switch back, your custom curve points are preserved in the background.
- **Authoritative Server Calculations**: The server evaluates fuel consumption using the exact same piecewise linear interpolation algorithm during live heats, ensuring the UI graph preview is identical to race execution.

---

## Season Scoring {: #season-scoring }

The Season Scoring expander defines championship points distributions for series and season-long competitions:

- **Position Points Table**: Assign championship points for each finishing position (e.g., 25 for 1st, 18 for 2nd, 15 for 3rd, down through 10th or 20th place).
- **Heat Points**: Optionally award points for individual heat results in addition to overall finishing order.
- **Bonus Points**:
    - *Fastest Lap*: Extra points awarded to the driver recording the fastest single lap of the race.
    - *Pole Position*: Bonus points awarded for the top qualifying position.
    - *Most Laps Led*: Bonus points for leading the highest number of laps.
- **Championship Aggregation**: Season standings automatically aggregate scored points across races with support for dropped rounds.
