# Track Manager

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Creating a Track

*Content coming soon.*

## Editing a Track

*Content coming soon.*

## Deleting a Track

*Content coming soon.*

## Track Interface Configuration

*Content coming soon.*

## Arduino Setup

Race Coordinator AI supports any standard Arduino (Uno, Nano, Mega, Leonardo, Uno Q) connected over USB/Serial:

- **Sketch Compatibility**: Race Coordinator AI works seamlessly with both the updated **Race Coordinator AI sketch (`v2.1.0.x`)** and original **Race Coordinator 1.0 sketches (`v1.0.0.x`)**. If you already have an Arduino configured with a Race Coordinator 1.0 sketch, you do not need to re-flash it.
- **Supported Features on All Sketches**: Lap counting, segment/sector timing, call buttons, track power relays, analog fuel level sensing, and hardware debouncing are fully supported across all sketch versions.
- **RGB LED Strips**: Addressable RGB LEDs (FastLED) require the updated Race Coordinator AI sketch (`v2.1.0.x`). If a legacy Race Coordinator 1.0 sketch is detected, RGB LED configuration is disabled in the editor with an informational tooltip.

