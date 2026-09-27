# Arduino UNO Q Setup Guide

This guide explains how to set up **Race Coordinator AI (RC AI)** on the **Arduino UNO Q** hybrid development board as a standalone hardware appliance.

---

## Hardware Overview & Memory Variants

The **Arduino UNO Q** combines a 64-bit Linux Single Board Computer (SBC) with a real-time microcontroller on a single board:

- **Linux MPU (Qualcomm Cortex-A53 @ 2.0 GHz)**: Runs the Race Coordinator AI server, SQLite database, web client server, and auto-updater.
- **Real-Time MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Handles lap sensor pin interrupts, power relays, and FastLED RGB light bridges with sub-millisecond timing accuracy.
- **Display Output**: USB-C DisplayPort output connects directly to a monitor, TV, or touchscreen.

### 4GB vs. 2GB Models

* **Arduino UNO Q 4GB (Recommended & Supported)**: Equipped with 4GB RAM and 32GB eMMC storage. This model is required for **Kiosk Display Mode** (driving an HDMI/DisplayPort TV or monitor directly) because running the Linux desktop, Chromium browser, Java runtime, and SQLite database simultaneously requires more than 2GB of memory.
* **Arduino UNO Q 2GB (Headless Mode Consideration)**:
  * While the 2GB model lacks the memory required to run the local desktop and Chromium kiosk display, it has sufficient memory to run the backend server in **Headless Appliance Mode**.
  * **Current Support Status**: Headless mode on the Uno Q is **not currently supported** because additional changes to the Uno Q support package and configuration are still needed. However, headless support on the 2GB Q **could be added upon request**, provided the Uno Q has an active network connection (Wi-Fi or Ethernet) to allow race directors and drivers to access the web UI from other devices on the network.

---

## Operating Modes

1. **Kiosk Display Mode (4GB Model)**: Plug an HDMI/DisplayPort monitor or TV directly into the Uno Q's USB-C port via a multiport adapter. The board automatically launches Chromium in fullscreen Kiosk mode (`http://localhost:7070`) while simultaneously allowing remote network connections.
2. **Headless Appliance Mode (Not Currently Supported - Available Upon Request)**: The board runs solely the backend server and connects to track hardware, with no local monitor or browser running. Users access the web UI over the local network (`http://uno-q.local:7070`). As noted above, headless mode on the Uno Q is not currently supported out of the box, but can be added upon request if the Uno Q has a network connection.

---

## Step-by-Step Installation

### Step 1: Prepare the Board & Connect via SSH
1. Flash **Arduino Linux OS** (Debian 12 arm64) onto the Uno Q.
2. Connect the board to your local network via Wi-Fi or Ethernet.
3. Open an SSH session:
   ```bash
   ssh arduino@uno-q.local
   ```

### Step 2: Install Prerequisites
Install OpenJDK 11, `arduino-cli`, display utilities, and Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Step 3: Flash Microcontroller Firmware (With FastLED Support)
Compile and upload the hardware sketch to the onboard STM32 MCU:
```bash
# Install STM32 board core in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# Compile and upload racecoordinatorai_sketch
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Step 4: Install Application Package & Systemd Services
1. Download `RaceCoordinatorAI-Linux-ARM64.tar.gz` and unpack to `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Run the installer script:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Start the services:
   ```bash
   # Start the backend server
   sudo systemctl start racecoordinatorai

   # (Optional) Enable local screen kiosk on USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
   ```

---

## FastLED RGB Light Bridge Setup

FastLED is fully supported on the Uno Q. Addressable RGB LED strips (WS2812B, NeoPixel, SK6812, APA102) connect directly to the GPIO header pins on the STM32 MCU.

- **Start Lights**: 5-stage countdown animation (red $\rightarrow$ yellow $\rightarrow$ green).
- **Pit Lane / Refueling**: Real-time fuel level percentage gauge per lane.
- **Leader & Victory**: Dynamic pulse for heat leader and checkered flag animation.

---

## Automatic Software Updates

When connected to Wi-Fi, Race Coordinator AI checks GitHub Releases automatically:
1. **App Update**: Downloads the new Linux ARM64 package in the background.
2. **Service Restart**: Restarts `racecoordinatorai.service` via systemd seamlessly.
3. **MCU Sketch Sync**: Automatically re-flashes the STM32 microcontroller firmware using `arduino-cli` if `racecoordinatorai_sketch.ino` was updated.
