# Arduino UNO Q Setup Guide

This guide explains how to set up **Race Coordinator AI (RC AI)** on the **Arduino UNO Q** hybrid development board as a standalone hardware appliance.

---

## Hardware Overview & Memory Variants

The **Arduino UNO Q** combines a 64-bit Linux Single Board Computer (SBC) with a real-time microcontroller on a single board:

- **Linux MPU (Qualcomm Cortex-A53 @ 2.0 GHz)**: Runs the Race Coordinator AI server, SQLite database, web client server, and auto-updater.
- **Real-Time MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Handles lap sensor pin interrupts, sector timing, call buttons, and track power relays with sub-millisecond timing accuracy (note: FastLED addressable RGB LEDs are not supported on this architecture).
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
   * **Connect from your PC**:
     * **macOS**: Open the built-in **Terminal** app or **iTerm2** ([iterm2.com](https://iterm2.com/)) and connect via the command line:
       ```bash
       ssh arduino@<hostname>
       # Or connect directly via IP:
       ssh arduino@<IP_ADDRESS>
       ```
     * **Windows**: You can use the built-in PowerShell or Command Prompt (running `ssh arduino@<hostname>` or `ssh arduino@<IP_ADDRESS>`) or a graphical SSH client such as **PuTTY** (download from [putty.org](https://www.putty.org/)). If using PuTTY:
       1. Enter the board's hostname or IP address in the **Host Name (or IP address)** field.
       2. Ensure Port is set to `22` and Connection Type is **SSH**.
       3. Click **Open**, accept the host key warning on first connection, and log in as `arduino` with your password.

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
   sudo usermod -a -G dialout,audio arduino
   ```

3. **Install and register systemd services**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Step 4: Flash Microcontroller Firmware
Compile and upload the hardware sketch to the onboard MCU:
```bash
# Check detected board and port
arduino-cli board list

# Install Zephyr board core in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Install required Arduino libraries (Uno Q router bridge)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

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

## Updating an Existing Installation { #updating-an-existing-installation }

Once Race Coordinator AI is up and running on your Arduino Uno Q, keeping it updated with new features, bug fixes, and firmware enhancements is straightforward. Depending on whether your board is connected to the network or running completely offline at the track, choose the update approach that matches your environment:

- **[Updating with an Active Network Connection (Recommended)](#updating-with-a-network-connection)**: Hands-free automatic updates configured directly from within the web interface.
- **[Updating without a Network Connection (Offline via USB)](#updating-without-a-network-connection)**: Copying a release archive onto the board via a USB flash drive and updating in-place.

---

### Updating with a Network Connection { #updating-with-a-network-connection }

If your Arduino Uno Q is connected to your local network with internet access (via Wi-Fi or Ethernet), you can take advantage of automatic background updates directly from the Race Coordinator AI web interface:

1. **Enable Automatic Updates in the Web UI**:
   - In Race Coordinator AI, navigate to **Options → Automatic Updates** from Raceday Setup or the Raceday Top Menu Bar.
   - Choose your preferred update release channel:
     - **🟢 Official / Production Releases**: Fully validated, stable releases recommended for standard race operations and club events where maximum operational stability is paramount.
     - **🟡 Beta Releases**: Feature-complete preview releases published during active development cycles for community testing and real-world race verification. Recommended to test new capabilities and provide feedback before official release.
     - **🔵 Daily Alpha Builds**: Automated daily builds from the active development branch with the latest cutting-edge features.
   - For an in-depth explanation of how release channels work and how versions are promoted, see the [Release Channels & Auto-Updates](downloads.md#release-channels) section in the Help Center.

2. **How Automatic Updates Work on the Arduino Uno Q**:
   When an update is detected for your configured channel:
   - **Background Download**: The board downloads the new Linux ARM64 package (`RaceCoordinatorAI-Linux-ARM64*.tar.gz`) in the background without interrupting active race sessions.
   - **Service Restart**: The updater seamlessly extracts the new binaries over `/opt/racecoordinatorai` and restarts `racecoordinatorai.service` (and the kiosk display) via `systemctl`.
   - **MCU Sketch Synchronization**: If the new release includes updates to the real-time microcontroller firmware (`racecoordinatorai_sketch.ino`), the updater automatically recompiles the sketch and re-flashes the onboard STM32 microcontroller over the internal network bridge using `arduino-cli`.
   - All race history, track configurations, custom themes, driver rosters, and your SQLite database are fully preserved.

3. **Manual Check for Updates**:
   Even if automatic background updates are disabled or set to manual, you can trigger an immediate update check at any time by selecting **Check for Updates** from the web UI menu.

---

### Updating without a Network Connection { #updating-without-a-network-connection }

If your Arduino Uno Q is operated completely offline at the track without an internet connection, you can easily update the installation manually using a standard USB flash drive (thumb stick).

#### Step 1: Transfer the Update Package onto the Board via USB

1. **Download the Release Package on a Connected PC**:
   From a computer with internet access (Mac, Windows, or Linux), open the [Downloads & Releases](downloads.md) portal or the [GitHub Releases](https://github.com/daufderheide/racecoordinator_ai/releases) page and download the Linux ARM64 package:
   - File format: `RaceCoordinatorAI-Linux-ARM64.tar.gz` (or versioned as `RaceCoordinatorAI-Linux-ARM64_v*.tar.gz`).
2. **Copy to a USB Flash Drive**:
   Copy the downloaded `.tar.gz` file onto a standard FAT32 or exFAT-formatted USB flash drive.
3. **Plug the USB Drive into the Uno Q**:
   Insert the USB flash drive into one of the available USB host ports on the Arduino Uno Q.
4. **Copy the File to the Board**:
   - **Using the Desktop GUI**: Open the Linux file manager on the Uno Q desktop, click on the mounted USB drive in the sidebar, and copy the `.tar.gz` file to your `~/Downloads/` folder (or home directory `~/`).
   - **Using the Terminal / SSH**: The system automatically mounts USB storage under `/media/arduino/<DRIVE_NAME>` (or you can mount it manually with `sudo mount /dev/sda1 /mnt`). Copy the archive to your local directory:
     ```bash
     cp /media/arduino/*/RaceCoordinatorAI-Linux-ARM64*.tar.gz ~/Downloads/
     ```
     *(Alternatively, if your laptop is connected directly to the board via Ethernet cable or a local Wi-Fi router without internet, you can transfer the file via `scp`: `scp RaceCoordinatorAI-Linux-ARM64*.tar.gz arduino@<hostname>:~/Downloads/`).*

#### Step 2: Apply the Update

Once the `.tar.gz` archive is copied to the board (e.g. in `~/Downloads/`), select one of the following three methods to apply the update:

##### Option 1: Built-In Update Helper Script (Fastest & Recommended)
Race Coordinator AI includes a dedicated, turnkey in-place update script located at `/opt/racecoordinatorai/scripts/update_app.sh`. It automatically stops running services, unpacks the release over `/opt/racecoordinatorai`, recompiles and uploads the microcontroller firmware if updated, sets file permissions, and restarts all services:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```
*(All database records, race data, custom UI layouts, and user preferences are automatically preserved).*

##### Option 2: Extract & Run `install.sh` from the Update Package
You can unpack the downloaded package into a temporary folder and run its included `install.sh`. The installer detects the existing `/opt/racecoordinatorai` installation, updates the application files, recompiles and flashes the microcontroller firmware, and restarts systemd services:
```bash
# Extract the downloaded archive
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Run the installer over the existing directory (preserves database & settings)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Option 3: Manual Step-by-Step Linux Commands (No Scripts)
If you prefer to perform the update entirely by hand without relying on any provided helper scripts, run the following sequence of commands in the terminal:

1. **Stop active services**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Extract updated files over `/opt/racecoordinatorai`**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
   *(Note: This updates application binaries, web client files, and scripts in place while leaving your SQLite database and custom assets untouched).*
3. **Verify correct file ownership and permissions**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Re-compile and re-flash the onboard microcontroller firmware (if sketch was updated)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Restart the backend and kiosk services**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
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

## FastLED & RGB LED Support (Unsupported on Uno Q)

> [!WARNING] FastLED Addressable RGB LEDs Not Supported on Uno Q MCU
> Addressable RGB LED light strips (WS2812B, NeoPixel, SK6812, APA102, etc.) driven by **FastLED are not supported on the Arduino Uno Q's onboard microcontroller**. The Uno Q's real-time MCU uses an STM32U585 architecture running Zephyr OS (CMSIS 6), which lacks low-level register and bit-banging timing support in the upstream FastLED library. Consequently, the Race Coordinator AI sketch (`racecoordinatorai_sketch.ino`) explicitly disables FastLED (`WITH_FAST_LED`) when compiled for the Uno Q MCU.

### Available Lighting Alternatives

If you want visual lighting indicators on an Arduino Uno Q setup, you have two options:

1. **Standard Digital Output LEDs**: Single-color LEDs (e.g., standard red, yellow, or green LEDs driven via digital output pins through current-limiting resistors, transistors, or relays) can still be configured on the Uno Q MCU in Race Coordinator AI as standard track call or status indicators.
2. **Dedicated Secondary Arduino for FastLED RGB LEDs (Recommended for RGB Strips)**: If you really want addressable RGB LED light strips for multi-stage countdown start lights, pit lane refueling bar graphs, and checkered flag victory animations, you can connect a **second Arduino** dedicated to driving the RGB LEDs.

> [!TIP] Using a Second Arduino for FastLED RGB LEDs
> Race Coordinator AI's **multi-interface architecture** fully supports connecting and running multiple hardware controllers simultaneously on the same track:
> 
> - **Primary Interface (Uno Q Onboard MCU)**: Handles the time-critical racing signals—optical lap timing sensors, sector split timing, driver call buttons, and master track power relays—with sub-millisecond precision.
> - **Secondary Interface (Second Arduino via USB)**: Plug an inexpensive standard Arduino board (such as an **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040**, or **ESP32**) into one of the Uno Q's USB host ports. Flash the standard `racecoordinatorai_sketch.ino` (where FastLED is enabled) to this second board.
> - **Track Editor Configuration**: In the Race Coordinator AI web UI, navigate to the **Track Editor** $\rightarrow$ **Hardware Interfaces** and click **Add Interface** to add the secondary Arduino's serial port (e.g., `/dev/ttyUSB0` or `/dev/ttyACM0`). Configure your FastLED light strings on the second interface. Race Coordinator AI automatically orchestrates both boards simultaneously during races.

---

## Text-to-Speech (TTS) & Audio Troubleshooting

Race Coordinator AI utilizes the browser's Web Speech API (`window.speechSynthesis`) to announce lap times, race events, and driver commentary. Unlike Windows or macOS, Linux (Debian 12 on the Uno Q) does not have a built-in voice synthesizer, so Chromium relies on **Speech Dispatcher** and **eSpeak NG**.

### Required Packages
The automated installer (`install.sh`) installs these packages automatically. If you performed a manual setup or TTS produces no sound, ensure the required speech and audio packages are installed:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Kiosk Browser Flags & Multi-Tab Navigation
In Kiosk Display Mode, Chromium launches via `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Race Coordinator AI uses `--start-maximized` (rather than locked-down `--kiosk`) to ensure secondary tabs—such as Heat Results, Race Results, Theme views, and the offline Help Center—remain visible and switchable via the tab bar at the top of the TV screen. Chromium also requires explicit flags to enable Speech Dispatcher and unprompted audio autoplay. Ensure your `start_kiosk.sh` includes:
```bash
  --start-maximized \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(If you modify `start_kiosk.sh` manually, restart the kiosk display service: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Troubleshooting Steps
1. **Verify Operating Mode & Audio Output**:
   - **Kiosk Display Mode**: Audio plays directly from the Uno Q via the USB-C DisplayPort/HDMI connection to your TV/monitor or connected USB speakers.
   - **Remote Network Client**: If viewing Race Coordinator AI from a laptop, tablet, or phone over the local network (`http://<hostname>:7070`), audio and TTS play through **that device's browser and speakers**, not the Uno Q board.
2. **Verify Hardware Audio Output**:
   Run a sound test in the Uno Q terminal to confirm sound output is unmuted and functional:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   If silent, launch `alsamixer` in the terminal to verify master/PCM/HDMI volume sliders are unmuted (press `M` to toggle unmute) and turned up.
3. **Test Speech Synthesizers from Command Line**:
   Verify eSpeak NG and Speech Dispatcher work at the OS level:
   ```bash
   # Test raw synthesis
   espeak-ng "Testing speech synthesis"

   # Test Speech Dispatcher (Chromium's backend)
   spd-say "Testing speech dispatcher"
   ```
   If `spd-say` errors or hangs, restart the daemon: `pkill -f speech-dispatcher && spd-say "Hello"`.
4. **Test in the Web UI**:
   In the Race Coordinator AI web UI, open **Customize UI** (or **Theme Editor** $\rightarrow$ **Audio Settings**). Check the **TTS Voice** dropdown—available voices should appear. Click **Test TTS Voice** to confirm playback.

