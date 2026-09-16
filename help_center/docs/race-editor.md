# Race Editor

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Race Name and Type

*Content coming soon.*

## Heat Rotation Format

*Content coming soon.*

## Scoring Options

*Content coming soon.*

## Timer Settings

*Content coming soon.*

## Fuel Settings

Race Coordinator AI supports comprehensive fuel simulation for both analog and digital tracks, including customizable fuel capacity, start level, pit stop delays, refuel rates, out-of-fuel penalty actions, and fuel usage models.

### Track Compatibility and Fuel System Selection

The race editor provides two dedicated fuel configuration sections: **Analog Fuel** and **Digital Fuel**. Which system is available and active is determined automatically by the track selected for the race:

- **Analog Tracks**: Traditional slot car tracks where cars are powered directly by lane rails without digital decoders or car-to-track telemetry. When an analog track is selected, the **Analog Fuel** section is enabled and the **Digital Fuel** section is automatically disabled.
- **Digital Tracks**: Digital slot car systems (such as Carrera Digital, Scalextric Digital, Scorpius, or oXigen) where the track interface communicates digital telemetry (car ID, throttle percentage, pit lane sensors). When a digital track is selected, the **Digital Fuel** section is enabled and the **Analog Fuel** section is automatically disabled.

---

### Analog Fuel Simulation

Analog fuel simulates fuel consumption on a **per-lap basis**. Because analog tracks detect cars when they cross the start/finish timing sensors, fuel is calculated and deducted each time a lap is completed.

#### Configuration Options

- **Enable Analog Fuel**: Master toggle for analog fuel tracking. When unchecked, fuel simulation is disabled for the race and cars run without fuel restrictions.
- **Fuel Usage Type**: Determines the mathematical curve used to calculate fuel consumption based on lap pace:
    - **Linear**: Fuel consumption scales linearly with lap time. Faster laps burn more fuel, while laps twice as slow consume half the base fuel.
    - **Quadratic**: Fuel consumption scales with the inverse square of lap time, heavily penalizing very fast laps.
    - **Cubic**: Fuel consumption increases steeply for fast laps, aggressively penalizing drivers pushing for record lap times.
    - **Custom Curve**: Allows interactive, point-by-point shaping of the fuel curve directly on the SVG graph.
- **Usage Rate**: The base fuel units consumed per lap when a driver matches the **Reference Time**.
- **Reference Time (s)**: The baseline benchmark lap time for the track and car class (in seconds).
    - Faster laps (below the reference time) burn more fuel.
    - Slower laps (above the reference time) burn less fuel.
    - The active calculation range spans from $0.5 \times \text{Reference Time}$ to $1.5 \times \text{Reference Time}$.
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

#### Pit Stops and Racing Time in Analog Fuel

To prevent pit stop time from being misinterpreted as an unusually slow lap (which would incorrectly reduce fuel consumption), Race Coordinator AI tracks **accumulated refuel time**. Any time spent stationary in the pit lane is subtracted from the total lap duration before computing fuel consumption:

$$\text{Racing Time} = \text{Lap Time} - \text{Accumulated Refuel Time}$$

#### Visual Graph Previews (Analog)

- **Simultaneous Multi-Model Comparison**: All 3 preset mathematical models (**Linear**, **Quadratic**, and **Cubic**) are plotted simultaneously on both graphs. The currently selected type is highlighted in bold with a vibrant glow, while the remaining models serve as muted reference baselines (~40% opacity).
- **Fuel Usage per Lap**: Displays the exact fuel units consumed across the lap time spectrum ($0.5 \times \text{ref}$ to $1.5 \times \text{ref}$). In Custom Curve mode, draggable control nodes and preset reset buttons allow instant reshaping while the 3 baseline models remain visible for benchmarking.
- **Time to Pit**: Displays estimated total race time (or laps) before running out of fuel as a function of consistent lap times across all models.
- **Interactive Legend & Visibility Toggle**: Left-click any curve in the legend to toggle its visibility on or off. Hiding a curve dynamically rescales the graph axes, allowing closer inspection of the remaining curves.
- **Comparative Multi-Curve Hovercards**: Hovering over either graph displays comparative telemetry at the cursor's scrubbed point across all visible curves, with color-coded swatches, values, and an `(Active)` indicator for the selected model.

---

### Digital Fuel Simulation

Digital fuel simulates fuel consumption **continuously in real time** based on throttle telemetry transmitted from digital controllers and decoders.

#### Continuous Throttle-Driven Consumption

Unlike analog fuel (which deducts fuel only at the lap line), digital fuel recalculates fuel consumption on every telemetry packet received from the track interface:

$$\text{Fuel Consumed} = \text{Usage per Second} \times \Delta t$$

Drivers who drive smoothly or lift in corners consume significantly less fuel than drivers who stay full throttle down long straights.

#### Configuration Options

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

#### Visual Graph Previews (Digital)

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

## Group Options

*Content coming soon.*

## False Start Detection

*Content coming soon.*

## Warmup Settings

*Content coming soon.*

## Countdown Settings

*Content coming soon.*

## Saving Changes

*Content coming soon.*

