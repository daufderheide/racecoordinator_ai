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

### Browser Compatibility & Blank Screen on Older Devices (Android < 9, Legacy Windows & Tablets) {: #browser-compatibility }
- **Symptom**: When opening Race Coordinator AI on an older tablet (such as Android 4.4 KitKat through Android 8 Oreo), legacy PC, or outdated browser, the screen remains completely blank, or displays the **Browser Not Supported** warning banner.
- **Cause**: Race Coordinator AI is built with modern Angular and ECMAScript (ES2020+), utilizing CSS Grid, CSS Custom Properties (`var(--...)`), ES modules, and modern JavaScript APIs (including `BigInt`, `globalThis`, `queueMicrotask`, optional chaining `?.`, nullish coalescing `??`, and private class fields `#x`). Browsers lacking these features cannot compile or run the web client.
- **Operating System & Browser Support**:

| Platform | Supported Versions & Minimum Browsers | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Current Google Chrome, Microsoft Edge, Mozilla Firefox | **Fully Supported** | Supported out-of-the-box with automatic browser updates. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109, or Mozilla Firefox 115 ESR | **Supported** | Must use the final supported browser releases (Chrome 109 / Firefox 115 ESR). Internet Explorer is not supported. |
| **Windows XP / Vista** | Stock official browsers (Chrome 49, Firefox 52 ESR) | **Server Only** | Stock browsers lack ES2020+ and cannot run the client UI locally. However, the Race Coordinator AI Java server (JRE 8) runs in headless mode on XP/Vista to host races for remote tablets or modern PCs. |
| **Android** | Android 9.0+ with modern Google Chrome or System WebView | **Supported** | Google permanently discontinued Chrome/WebView updates on Android 8 and older. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Supported** | Apple WebKit engine with modern ECMAScript support. |
| **macOS** | macOS 10.15 (Catalina) through macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Supported** | Fully compatible across Intel and Apple Silicon Macs. |
| **Linux** | Any modern distribution running Chrome, Chromium, or Firefox | **Supported** | Includes Raspberry Pi OS 64-bit and ARM64 single-board computers. |

- **Resolution & Recommendations**:
  - **Use a Supported Modern Browser**: Connect using Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari on a supported operating system (Android 9.0+, iOS 14+, Windows 7+, macOS, or Linux).
  - **Legacy Windows Setup (Win 7 / 8 / 8.1)**: If running on Windows 7 or 8, ensure you install **Google Chrome 109** or **Mozilla Firefox 115 ESR** rather than the retired Internet Explorer.
  - **Inexpensive Modern Tablets**: Budget modern tablets (e.g. Amazon Fire HD 8/10 or Walmart Onn 7"/8" tablets running Android 11–14) support modern Chrome and provide full performance at low cost.
  - **Remote Display / Screen Mirroring**: For older tablets or legacy terminals, you can run the Race Coordinator AI server on the host machine and mirror the screen using lightweight VNC or remote desktop tools (such as bVNC or AnyDesk).

## Database Issues

*Content coming soon.*

## Getting Support

*Content coming soon.*

