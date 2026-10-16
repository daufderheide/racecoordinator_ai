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

### USB Interface Sleep & Disconnections Between Heats (Selective Suspend & Power Saving) {: #usb-sleep-prevention }
- **Symptom**: During pauses between heats, during lane rotation changes, or after the track has been idle for several minutes, the interface (Phidget, Arduino, Trackmate, or USB-to-serial bridge) drops its connection. When the next heat starts or cars trigger sensors, the interface reconnects and a notification banner appears: *"Interface Connected: Connection to the interface has been restored."*
- **Cause**: Modern operating systems (Windows, macOS, and Linux) use aggressive hardware power-saving policies for USB controllers and Human Interface Devices (HID). Even though Race Coordinator AI prevents system-level sleep, the operating system can independently cut power to idle USB ports, USB Root Hubs, and HID controllers (USB Selective Suspend) when no sensor events or data packets are transmitted for a short period.
- **Why This Cannot Be Fully Disabled Automatically by Software**: Device-level power management is enforced directly by the operating system kernel and hardware drivers. On Windows, modifying hardware device power properties requires elevated Administrator privileges (UAC) and altering protected system registry entries (`HKLM`), which standard applications cannot and should not do automatically without risking system stability or unexpected side effects on non-racing peripherals (such as wireless mice, keyboards, or Bluetooth adapters).
- **Resolution by Operating System**:

#### Windows 10 & Windows 11 (Recommended Permanent Fix)

##### 1. Disable Power Saving on USB & Human Interface Devices in Device Manager
This is the most critical and effective fix, especially for Phidgets and USB interfaces:
1. Right-click the **Start** button (or press `Win + X`) and choose **Device Manager**.
2. Expand **Human Interface Devices**:
    - Look for **USB Input Device** entries associated with your interface.
    - Right-click each one, select **Properties**, and click the **Power Management** tab.
    - **Uncheck** *"Allow the computer to turn off this device to save power"*, then click **OK**.
3. Expand **Universal Serial Bus controllers**:
    - Right-click each **USB Root Hub** and **Generic USB Hub**, select **Properties**, and click the **Power Management** tab.
    - **Uncheck** *"Allow the computer to turn off this device to save power"*, then click **OK**.
4. (For Arduino / USB Serial): Expand **Ports (COM & LPT)**:
    - Right-click your USB Serial port (e.g. *Arduino Uno*, *USB Serial Port (COMx)*), select **Properties**, and if a **Power Management** tab is present, **uncheck** *"Allow the computer to turn off this device to save power"*.

##### 2. Disable USB Selective Suspend in Windows Power Options
1. Open the Windows **Control Panel** and navigate to **Power Options** (or press `Win + R`, type `powercfg.cpl`, and press Enter).
2. Click **Change plan settings** next to your active power plan.
3. Click **Change advanced power settings**.
4. Expand **USB settings** -> **USB selective suspend setting**.
5. Set both **On battery** and **Plugged in** to **Disabled**.
6. Click **Apply** and then **OK**.

---

#### Linux & Raspberry Pi OS

##### 1. Disable Kernel USB Autosuspend
By default, the Linux kernel autosuspends idle USB devices after 2 seconds to save power:
- **On Ubuntu, Debian, or Linux Mint (GRUB)**:
    1. Edit your GRUB configuration: `sudo nano /etc/default/grub`.
    2. Add `usbcore.autosuspend=-1` to `GRUB_CMDLINE_LINUX_DEFAULT` (e.g., `GRUB_CMDLINE_LINUX_DEFAULT="quiet splash usbcore.autosuspend=-1"`).
    3. Update GRUB and reboot: `sudo update-grub && sudo reboot`.
- **On Raspberry Pi OS**:
    1. Open the boot command line file: `sudo nano /boot/firmware/cmdline.txt` (or `/boot/cmdline.txt` on older Raspberry Pi OS versions).
    2. Add `usbcore.autosuspend=-1` to the end of the line (all arguments must remain on a single line).
    3. Save and reboot: `sudo reboot`.

##### 2. Disable Autosuspend via Udev Rule (Alternative)
You can also prevent autosuspend for all USB devices by creating a udev rule:
1. Create a new rules file: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Add the following rule:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Reload udev rules: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Energy Saver Settings**: Open **System Settings** -> **Displays** -> **Advanced...** (or **Energy Saver** on desktop Macs) and enable **"Prevent automatic sleeping when the display is off"**.
- **Use Powered USB Hubs**: macOS can limit current or place unpowered USB bus ports into low-power states when peripheral draw fluctuates. Always connect timing hardware through a powered USB hub (with its own dedicated AC wall adapter) rather than passive multi-adapters.


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

