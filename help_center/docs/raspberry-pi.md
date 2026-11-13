# Raspberry Pi Setup (Experimental)

This guide explains how to set up **Race Coordinator AI (RC AI)** on a **Raspberry Pi** single-board computer using a two-board architecture.

---

> [!NOTE] Experimental Hardware Configuration
> While the core Race Coordinator AI Linux ARM64 application runs natively and smoothly on 64-bit Raspberry Pi OS, running on a Raspberry Pi is classified as **experimental**. Unlike the unified, dual-core architecture of the Arduino Uno Q (which contains both an application MPU and a dedicated real-time STM32 microcontroller on a single circuit board), a Raspberry Pi setup requires an **external USB microcontroller** (such as an Arduino Uno, Nano, Mega, or RP2040) to handle track sensors and power control.

---

## Architecture: Why a Two-Board Setup?

To understand why Race Coordinator AI uses two boards on a Raspberry Pi, it helps to understand the difference between general-purpose computing and real-time hardware timing:

```
┌────────────────────────────────────────────────────────┐
│           Raspberry Pi 4 / 5 (Host Computer)           │
│                                                        │
│  - 64-bit Raspberry Pi OS (Debian Linux)               │
│  - Java 21 Server Runtime & SQLite Database            │
│  - Web Application Server (Port 7070)                  │
│  - Fullscreen Chromium Kiosk Display (HDMI to TV)      │
└───────────────────────────┬────────────────────────────┘
                            │ USB Serial Connection
                            │ (/dev/ttyACM0 or /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      External Microcontroller (Arduino Uno / Nano)     │
│                                                        │
│  - Real-Time Firmware (racecoordinatorai_sketch.ino)   │
│  - Microsecond-Accurate Interrupt Handling             │
│  - 5V Tolerant Sensor Inputs (Phototransistors / IR)   │
│  - Track Power Relay Controls & Call Buttons           │
└────────────────────────────────────────────────────────┘
```

### Why Not Use the Raspberry Pi's GPIO Header Directly?

1. **Linux Kernel Scheduling Jitter**:
   Raspberry Pi OS is a preemptive, multi-tasking general-purpose operating system. The Linux kernel constantly switches CPU time between system tasks, network I/O, background services, and graphical rendering. This introduces non-deterministic scheduling latency ("jitter") typically ranging from **5 to 30 milliseconds**. In slot car racing, a lightweight car crossing an optical sensor or dead strip at high speed triggers an electrical pulse lasting only **1 to 5 milliseconds**. Relying on direct Linux GPIO polling or user-space interrupts leads to missed laps and inconsistent hundredth-of-a-second lap times.
2. **Electrical Voltage & Transient Protection**:
   The Raspberry Pi's 40-pin GPIO header operates strictly at **3.3V logic** with no internal over-voltage clamping or buffering. Exposing Raspberry Pi GPIO pins to track-side wiring creates severe risk of board destruction from 5V optical sensors, inductive spikes from relay coils, or 12V–18V track motor back-EMF.
3. **The Two-Board Solution**:
   By pairing the Raspberry Pi with an inexpensive USB microcontroller (such as an Arduino Uno R3/R4, Arduino Nano, Arduino Mega 2560, or Raspberry Pi Pico running Arduino firmware), you achieve the best of both worlds:
   - The **microcontroller** runs bare-metal real-time firmware with sub-millisecond hardware interrupt timing and robust 5V electrical isolation.
   - The **Raspberry Pi** acts as a powerful host computer running the Java 21 server, embedded SQLite database, network communications, speech synthesis, and local HDMI display.

---

## Hardware Requirements & Memory Variants

### 1. Raspberry Pi Single-Board Computer

* **Supported Models**: **Raspberry Pi 4 Model B** or **Raspberry Pi 5** (64-bit ARM Cortex-A72 or Cortex-A76).
* **Operating System**: **Raspberry Pi OS (64-bit)** is required. The 32-bit OS is not supported.
* **Storage**: 16 GB or larger high-speed microSD card (Application Class A1 or A2 recommended) or a USB 3.0 SSD.
* **Power Supply**: Official Raspberry Pi USB-C power supply (15W for Pi 4, 27W for Pi 5) to prevent undervoltage throttling.

### 2GB vs. 4GB / 8GB RAM

| Model | Recommended Operating Mode | Description |
| :--- | :--- | :--- |
| **Raspberry Pi (2GB RAM)** | **Headless Appliance Mode** | Ideal for running purely as a trackside server without a monitor connected. Drivers and race directors view the race UI on tablets, iPads, smartphones, or laptops over Wi-Fi/LAN (`http://<pi-ip>:7070`). Disabling the local Chromium kiosk browser ensures plenty of free RAM for the Java server and database. |
| **Raspberry Pi (4GB or 8GB RAM)** | **Kiosk Display Mode** *(Recommended)* | Recommended when connecting an HDMI monitor or TV directly to the Pi. Runs the full graphical desktop, local fullscreen Chromium kiosk browser, Java runtime, and database concurrently with excellent responsiveness. |

### 2. External Timing Microcontroller

An external board running the Race Coordinator AI sketch:

* **Recommended Boards**:
  * **Arduino Uno R3 or R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideal for 4-lane or 6-lane tracks requiring many sensor pins)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** running Arduino firmware
* **USB Cable**: Standard USB cable connecting the microcontroller to any USB port on the Raspberry Pi.
* **Track Sensors & Relays**: Wired to the microcontroller as detailed in the **[Track Configuration Guide](track-editor.md)**.

---

## Step-by-Step Installation

### Step 1: Install Raspberry Pi OS (64-bit)

1. Download and open the **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** on your PC or Mac.
2. Select your Raspberry Pi device model (Pi 4 or Pi 5).
3. Under **Operating System**, choose **Raspberry Pi OS (64-bit)** (Debian Bookworm or Bullseye).
4. Click **Edit Settings** (or the gear icon) to preconfigure:
   * **Hostname**: Set a recognizable name (e.g. `racecoordinator` or `slotcar-pi`).
   * **Username and Password**: Set a user account (e.g. username `pi`).
   * **Wireless LAN**: Enter your Wi-Fi SSID and password.
   * **Services**: Check **Enable SSH** (using password authentication or your public key).
5. Choose your target microSD card or SSD and click **Write**.

### Step 2: Flash the Microcontroller Firmware

Before connecting your Arduino to the Raspberry Pi:

1. Download the latest Race Coordinator AI release package on your computer or locate `racecoordinatorai_sketch.ino` in the release archive under the `firmware/` directory.
2. Open the sketch in the **Arduino IDE** on your computer.
3. Select your microcontroller board type (e.g. *Arduino Uno* or *Arduino Nano*) and port.
4. Click **Upload** to compile and flash the firmware to the board.
5. Unplug the microcontroller from your computer and plug it into any USB port on your Raspberry Pi. It will automatically register as a serial device (typically `/dev/ttyACM0` or `/dev/ttyUSB0`).

### Step 3: Install Host Prerequisites on the Raspberry Pi

Power on the Raspberry Pi and connect via SSH from your computer terminal:

```bash
ssh pi@<hostname>.local
# Or connect using the Pi's IP address:
# ssh pi@192.168.1.xxx
```

Update package lists and install the Java runtime, audio utilities, browser, and window manager helper:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Note: On newer Debian/Raspberry Pi OS Bookworm releases, the browser package is named `chromium` rather than `chromium-browser`. If `chromium-browser` reports not found, install `chromium`).*

### Step 4: Download and Run the Automated Installer

1. Transfer the Linux ARM64 release archive to your Raspberry Pi:
   ```bash
   # From your PC / Mac terminal:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(Alternatively, download the `.tar.gz` directly on the Pi using `curl` or `wget` from the [Releases page](downloads.md)).*

2. Extract the archive and enter the installer directory:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Run the installer with `sudo`:
   ```bash
   sudo ./install.sh
   ```

#### Automatic Hardware Detection & Pre-Flight Banner

The installer automatically inspects `/proc/device-tree/model` and detects that it is running on a Raspberry Pi:

- **Platform Resolution**: Sets `Hardware Platform: pi`.
- **Service Account**: Resolves the service user to your invoking account (e.g. `pi`), configuring appropriate systemd services and serial group permissions (`dialout`).
- **Firmware Upload**: Automatically **skips** compiling or uploading the onboard Arduino Uno Q Zephyr MCU firmware, since an external USB Arduino is used instead.

Before any files are copied or services configured, the installer displays the **Pre-Flight Configuration Resolution Summary**:

```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: pi
   Resolution:      Auto-detected (/proc/device-tree/model: Raspberry Pi 4 Model B Rev 1.5)
 Service Account:   pi
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/pi
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      SKIP (External USB microcontroller used on Raspberry Pi)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

#### Installer Command-Line Options

You can customize the installation using command-line arguments:

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Force target hardware board type. | Auto-detected from `/proc/device-tree/model` (`pi`) |
| `--user=<username>` | Linux user account to own `/opt/racecoordinatorai` and run services. | Auto-detected from `$SUDO_USER` (defaults to `pi` on Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Explicitly skip MCU sketch compilation/upload. | Automatically skipped on `pi` |
| `-v`, `--verbose` | Enable verbose command logging. | Standard output (`false`) |
| `-h`, `--help` | Show usage help and exit. | - |

---

## Operating Modes: Kiosk vs. Headless

### 1. Kiosk Display Mode (4GB / 8GB Pi)

By default, the installer enables two systemd background services:

1. `racecoordinatorai.service`: The backend Java server and embedded SQLite database.
2. `racecoordinatorai-kiosk.service`: A fullscreen Chromium browser session launching on the primary HDMI display at `http://localhost:7070`.

If you have a TV or monitor plugged into the Pi's HDMI port, Race Coordinator AI will launch automatically on boot in full-screen kiosk mode.

### 2. Headless Appliance Mode (2GB Pi or Dedicated Server)

If you are running on a **2GB Raspberry Pi**, or if your Pi is mounted under the track without a monitor attached, you should disable the Kiosk service:

```bash
# Stop and disable the graphical kiosk browser:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

With the kiosk service disabled:

- The backend server consumes minimal memory (~250–350 MB RAM).
- Connect any device on the same local Wi-Fi or wired network by opening a web browser to:
  ```text
  http://<raspberry-pi-ip>:7070
  # For example: http://192.168.1.150:7070 or http://racecoordinator.local:7070
  ```

---

## Configuring the Track Interface in Race Coordinator AI

Once the server is running, configure the serial connection to your external microcontroller:

1. Open the Race Coordinator AI web interface in your browser (`http://localhost:7070` or `http://<pi-ip>:7070`).
2. Navigate to **Track Manager** → **Edit Track**.
3. Under the **Hardware Interfaces** tab:
   * **Interface Type**: Select **Arduino**.
   * **Port**: Select `/dev/ttyACM0` or `/dev/ttyUSB0` (the USB port connected to your Arduino).
   * **Baud Rate**: `115200`.
4. Click **Connect / Test Interface** to verify two-way communication.
5. Map your lane sensors, call buttons, and power relays to the corresponding Arduino pins as wired.
6. Click **Save Track**.

---

## Managing Systemd Services

Control the background services using standard `systemctl` commands:

```bash
# Check server status and view live logs:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Restart the application:
sudo systemctl restart racecoordinatorai.service

# Check kiosk browser status (if enabled):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Updating an Existing Installation

Upgrading Race Coordinator AI on a Raspberry Pi is completely non-destructive:

* **Data Preservation**: Your database (`racecoordinator.db`), race history, driver profiles, and custom themes are preserved in `/home/<user>/.racecoordinatorai/` and will not be overwritten.
* **In-App Auto-Updater**: When a new release is available, click **Install Now** in the in-app update notification banner. The updater runs `/opt/racecoordinatorai/scripts/update_app.sh`, which automatically detects the Raspberry Pi and skips sketch uploading.
* **Manual Upgrade**: Download the new `.tar.gz` and run:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
