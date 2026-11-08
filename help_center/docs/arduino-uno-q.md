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
2. **Headless Appliance Mode (Not Currently Supported - Available Upon Request)**: The board runs solely the backend server and connects to track hardware, with no local monitor or browser running. Users access the web UI over the local network (`http://<hostname>:7070` or `http://<IP_ADDRESS>:7070`). As noted above, headless mode on the Uno Q is not currently supported out of the box, but can be added upon request if the Uno Q has a network connection.

---

## Step-by-Step Installation

### Step 1: Prepare the Board & Connect via Network

1. **Boot the Board** *(Flashing is usually not needed)*:
   * Your Arduino Uno Q comes with **Arduino Linux OS (Debian 12 arm64) pre-installed** on its internal 32GB eMMC flash storage. Simply connect the board to power to boot into the operating system.
   * *(Note: Flashing an OS image is only necessary if you are recovering a corrupted system or performing a complete factory reset).*

2. **Network Connection Setup**:
   > [!IMPORTANT]
   > **Internet Access Only Needed During Initial Setup**: A network connection with internet access is strictly required during this initial setup to update packages and download prerequisites. Once setup is complete, Race Coordinator AI runs 100% locally and offline without requiring an internet connection. However, keeping the board connected to your local network provides significant ongoing benefits:
   > - **Automatic Software Updates**: Easily download and install new Race Coordinator AI releases and firmware updates directly from the web UI.
   > - **Remote Client Access**: Race directors, drivers, and spectators can connect their phones, tablets, or laptops directly to the board's web interface (`http://<hostname>:7070` or `http://<IP_ADDRESS>:7070`) over your local network.

   * **Wi-Fi Setup via On-Screen Setup Wizard**: On initial boot, the on-screen setup wizard will prompt you to configure wireless networking. Select your Wi-Fi network and enter the password.
   * **Alternative: Setting up Wi-Fi via Command Line**: If you did not configure Wi-Fi during the setup wizard or need to configure it manually in the terminal:
     ```bash
     # List available wireless networks:
     nmcli dev wifi list

     # Connect to your Wi-Fi network:
     sudo nmcli dev wifi connect "Your_SSID" password "Your_Password"
     ```
   * **Alternative: Wired Ethernet**: Simply plug an Ethernet cable into the board (or a USB-C Ethernet adapter). The network adapter configures automatically via DHCP.
   * **First-Time Connection Note**: The Wi-Fi connection may occasionally not take effect immediately upon first entry, or manual `nmcli` commands may show temporary errors on initial boot. If this occurs, simply run `sudo reboot`. Upon rebooting, the wireless adapter initializes cleanly and connects automatically to your configured Wi-Fi network.
   * **Apply Board & Firmware Updates**: Upon rebooting (or when prompted by the system), you may be asked if you want to update various packages and firmware components on the board. It is strongly recommended to accept and perform all suggested updates, as factory firmware and board components may be significantly outdated. Note that this initial update may take a while (often 5 to 10+ minutes depending on network speed and package sizes), so allow it to complete uninterrupted.

3. **Enable SSH on the Board & Connect (Recommended)**:
   * Setting up the board is easiest via SSH from your computer so you can copy and paste installation commands directly.
   * **Enable SSH Service**: By default, the SSH server is not running on the board. From the local terminal (using your keyboard and display connected to the board), enable and start the SSH service:
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Find Hostname & IP Address**: Run `hostname` and `hostname -I` on the board to discover your board's assigned hostname and local IP address (the factory setup often assigns a unique name such as `allianora` rather than `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Note: `avahi-daemon` is not pre-installed on Arduino Linux OS, so `.local` mDNS domain names like `uno-q.local` do not exist by default unless you install the package via `sudo apt-get install -y avahi-daemon`).*
   * **Connect from your PC**: Open a terminal on your computer and connect using the board's hostname or IP address:
     ```bash
     ssh arduino@<hostname>
     # Or connect directly via IP:
     ssh arduino@<IP_ADDRESS>
     ```

### Step 2: Install Prerequisites
Install the Java runtime (`default-jre-headless`), audio utilities (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium`, and window manager control (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Note: On Debian, the browser package is named `chromium` rather than `chromium-browser`, and `default-jre-headless` provides the standard OpenJDK runtime. The `wmctrl` utility is used by the kiosk service to ensure Race Coordinator AI retains window focus over desktop autostart apps like Arduino App Lab).*

Verify `arduino-cli` is installed:
```bash
arduino-cli version
```
*(If `arduino-cli` is not pre-installed on your board, install it via: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Step 3: Install Application Package & Systemd Services
Transfer `RaceCoordinatorAI-Linux-ARM64.tar.gz` from your computer to the board:
```bash
# From your laptop terminal:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Choose one of the following installation methods:

#### Option A: Automated Turnkey Setup (Recommended)
The automated installer handles prerequisite checks, directory setup, serial permissions, systemd service registration, microcontroller firmware upload, and instant startup with error checking:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
# Or for detailed verbose output:
# sudo ./install.sh -v
```
*(Note: Any `tar: Ignoring unknown extended header...` warnings are harmless macOS metadata tags and can be safely ignored).*

> [!NOTE] Zephyr Board Core Download & Duration (~5 to 10+ Minutes)
> During initial setup, `arduino-cli` downloads and unpacks the **Zephyr board core (`arduino:zephyr`)** for the onboard STM32U5 Cortex-M33 MCU. This package contains the full Zephyr Real-Time Operating System, ARM cross-compiler toolchain, and hardware libraries (~500MB+ download and tens of thousands of files).
>
> - **Estimated Time**: **5 to 10+ minutes** depending on your internet connection and onboard eMMC write speed. **Time to grab some coffee!**
> - **Console Progress**: Download and extraction progress is streamed directly to the terminal. If you want extra verbose output for the compiler and unpack steps, run `sudo ./install.sh -v`.
> - **Verifying Progress via Second Console / SSH**: If you are ever concerned that the installer might be stuck, open a second SSH session (or another terminal tab on the Uno Q) and run:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   You will see `arduino-cli` actively utilizing CPU and I/O while downloading and extracting packages. You can also view the downloaded staging files expanding with:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

#### Option B: Manual Step-by-Step Setup (Fallback)
If you prefer manual control or need to customize your configuration:
1. **Extract application files to `/opt/racecoordinatorai`**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Configure permissions and serial group access**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout arduino
   ```

3. **Install and register systemd services**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

#### Upgrading an Existing Installation Manually (From Downloaded Archive)
When you download a release update (such as `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` saved to `~/Downloads/` via the browser save dialog or transferred manually), you can apply the update using any of the following methods:

##### Method 1: Built-In Update Helper Script (Fastest & Recommended)
Race Coordinator AI includes an automated in-place update script that unpacks the release over `/opt/racecoordinatorai`, recompiles and uploads the microcontroller firmware if updated, and restarts services:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```

##### Method 2: Extract & Run `install.sh` from the Downloaded Package
```bash
# Extract the downloaded archive
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Run the installer over the existing directory (preserves database & settings)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Method 3: Direct Manual File Extraction
If you prefer to perform each step by hand:
1. **Stop the active services**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Extract updated files over `/opt/racecoordinatorai`**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
3. **Ensure correct permissions**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Re-flash microcontroller firmware (if sketch was updated)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Restart services**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
   ```

### Step 4: Flash Microcontroller Firmware (With FastLED Support)
Compile and upload the hardware sketch to the onboard MCU:
```bash
# Check detected board and port
arduino-cli board list

# Install Zephyr board core in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Install required Arduino libraries (Uno Q router bridge & FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# Compile racecoordinatorai_sketch for the Uno Q MCU
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Upload to the onboard MCU over the internal network bridge
# (Provide the board password 'arduino' when prompted, or pass --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Note: As verified via `arduino-cli board list`, the Uno Q microcontroller runs Zephyr OS over the internal network bridge `172.17.0.1` with FQBN `arduino:zephyr:unoq`. The `Arduino_RouterBridge` library is required for serial communication across the SoC bridge. Note that running `arduino-cli core install arduino:zephyr` downloads ~500MB+ and takes 5 to 10+ minutes to unpack onto eMMC storage (grab a coffee while it unpacks; you can check progress with `top -p $(pgrep arduino-cli)` in a second terminal). FastLED RGB light strips are not supported on the STM32U5 / Zephyr Cortex-M33 architecture due to upstream CMSIS 6 register definitions, but all core track features—lap sensors, sector timing, call buttons, and track relays—are fully operational).*

### Step 5: Start Services & Launch Kiosk Display
Start the backend daemon and enable the fullscreen TV kiosk:
```bash
# Start the backend server
sudo systemctl start racecoordinatorai

# You already enabled the backend daemon earlier.
# Now enable the TV kiosk service for graphical boot:
sudo systemctl enable racecoordinatorai-kiosk.service

# Start the fullscreen TV kiosk display immediately
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Window Focus & Desktop Autostart Apps (e.g. Arduino App Lab)

On the Arduino Uno Q, Arduino Linux OS launches "Arduino App Lab" upon desktop login.
- **Automatic Focus Retention**: By default, `start_kiosk.sh` utilizes `wmctrl` to automatically bring Race Coordinator AI to the front and retain focus, ensuring the TV display is immediately ready for racing without requiring manual mouse or keyboard switching.
- **Optional: Disable App Lab on Boot**: For a dedicated race track kiosk where Arduino App Lab is not needed at startup, you can disable its autostart entry:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
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

> [!TIP]
> If you downloaded a `.tar.gz` release archive via the **Download Update** link in the browser, see [Upgrading an Existing Installation Manually](#upgrading-an-existing-installation-manually-from-downloaded-archive) above to install the update from your downloaded file.

