# Troubleshooting

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Connection Issues

### Arduino Connection & Firmware Compatibility
- **Status Badge Grey (Disconnected)**: Ensure the Arduino is plugged in via USB, the proper COM / serial port is selected in Track Editor, and an approved sketch is loaded.
- **Supported Sketch Versions**: Race Coordinator AI works with both the **Race Coordinator AI sketch (`v2.1.0.x`)** and original **Race Coordinator 1.0 sketches (`v1.0.0.x`)**. If you already have an Arduino configured for Race Coordinator 1.0, you do not need to re-flash your board to use it with Race Coordinator AI.
- **RGB LEDs Disabled**: If you are using a Race Coordinator 1.0 sketch, all timing, relay, and sensor functions will work, but RGB LED strip options will be disabled. To enable addressable FastLED RGB lighting, upload the updated `racecoordinatorai_sketch.ino` (`v2.1.0.x`) to your Arduino.

## Sensor Problems

*Content coming soon.*

## Display Issues

### Browser Compatibility & Blank Screen on Older Devices (Android < 9, Legacy Tablets)
- **Symptom**: When opening Race Coordinator AI on an older tablet (such as Android 4.4 KitKat through Android 8 Oreo) or outdated browser, the screen remains completely blank, or displays the "Browser Not Supported" warning banner.
- **Cause**: Race Coordinator AI is built with modern Angular and ECMAScript (ES2022+), utilizing CSS Grid, CSS Custom Properties, ES modules, and modern JavaScript APIs. Google permanently discontinued Google Chrome and System WebView updates for Android 8 and older. Android 4.4 KitKat (released in 2013) is frozen at Chromium 30–33 (or Chrome 66 maximum), which cannot parse modern web applications.
- **Resolution**:
  - **Use a Supported Modern Browser**: Connect using Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari on a supported operating system (Android 9.0+, iOS 14+, Windows 10+, macOS, or Linux).
  - **Inexpensive Modern Tablets**: Budget modern tablets (e.g. Amazon Fire HD 8/10 or Walmart Onn 7"/8" tablets running Android 11–14) support modern Chrome and provide full performance.
  - **Remote Display / Screen Mirroring**: For older tablets, you can display the host machine's browser screen using a lightweight VNC or remote desktop viewer (such as bVNC or AnyDesk).

## Database Issues

*Content coming soon.*

## Getting Support

*Content coming soon.*

