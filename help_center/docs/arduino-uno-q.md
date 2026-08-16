# Arduino UNO Q (4GB) Setup Guide

This guide explains how to set up **Race Coordinator AI (RC AI)** on the **Arduino UNO Q 4GB** hybrid development board as a single, standalone hardware appliance.

---

## Hardware Overview

The **Arduino UNO Q 4GB** combines a 64-bit Linux Single Board Computer (SBC) with a real-time microcontroller on a single board:

- **Linux MPU (Qualcomm Cortex-A53 @ 2.0 GHz, 4GB RAM)**: Runs the Race Coordinator AI server, SQLite database, web client server, and auto-updater.
- **Real-Time MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Handles lap sensor pin interrupts, power relays, and FastLED RGB light bridges with sub-millisecond timing accuracy.
- **Display Output**: USB-C DisplayPort output connects directly to a monitor or touchscreen.

---

## Operating Modes

1. **Headless Appliance Mode**: The board runs the backend server and connects to track hardware. Race directors and drivers access the web UI from smartphones, tablets, or laptops on the local Wi-Fi network (`http://uno-q.local:7070`).
2. **Kiosk Display Mode**: Plug an HDMI/DisplayPort monitor or touchscreen directly into the Uno Q's USB-C port. The board automatically launches Chromium in fullscreen Kiosk mode (`http://localhost:7070`) while simultaneously allowing remote network connections.

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
