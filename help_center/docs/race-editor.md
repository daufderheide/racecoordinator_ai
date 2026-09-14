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

### Fuel Usage Models

Fuel consumption per lap (analog) or per second (digital) can be governed by mathematical presets or an interactive custom profile:

- **Linear**: Fuel consumption scales linearly with speed or throttle.
- **Quadratic**: Fuel consumption increases quadratically at faster lap times or higher throttle levels.
- **Cubic**: Fuel consumption increases steeply for extreme speeds and full-throttle conditions.
- **Custom Curve**: Allows fine-grained control over the fuel consumption curve by dragging interactive control points directly on the fuel usage graph.

### Interactive Custom Curve Editing

When **Custom Curve** is selected as the Fuel Usage Type, control handles appear directly on the SVG usage curve:

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

