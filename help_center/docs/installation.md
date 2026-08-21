# Installation Guide

This guide walks you through downloading, installing, and configuring Race Coordinator AI on your computer.

---

## Supported Operating Systems

Race Coordinator AI is fully cross-platform and runs on modern and legacy operating systems:

| Platform | Supported Versions | Recommended Installer |
| :--- | :--- | :--- |
| **🪟 Windows (Modern)** | Windows 10, Windows 11 (64-bit & 32-bit) | **Online Setup** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Legacy)** | Windows 8, Windows 7, Windows XP | **Offline Full Setup** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Required for initial install on Win 8 and older)* |
| **🍏 macOS** | macOS 10.15 (Catalina) through macOS 15+ (Intel & Apple Silicon) | **Disk Image** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64-bit), Arduino Linux OS, Debian, Ubuntu | **ARM64 / Linux Package** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Choosing Your Release Channel

Race Coordinator AI is distributed across three channels:

* **🟢 Official Stable Releases** *(Recommended)*: Fully tested, production-ready builds recommended for regular racing, home tracks, and club events.
* **🟡 Beta Previews**: Prerelease builds that include upcoming features, new hardware drivers, and experimental enhancements for community testing and feedback.
* **🔵 Alpha / Nightly Builds**: Automated snapshot builds from active development.

👉 Visit the **[Downloads & Releases Portal](downloads.md)** to download any version or view the complete release archive.

---

## 🪟 Windows Installation

### 1. Download the Installer
* For **Windows 10 / 11**: Download `RaceCoordinatorAI_Online_Setup_*.exe`.
* For **Windows 8 and older** (or PCs without an active internet connection): Download `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Run the Installer
1. Double-click the downloaded `.exe` file.
2. If Windows SmartScreen displays a *"Windows protected your PC"* prompt, click **More info** and then click **Run anyway**.
3. Follow the Inno Setup wizard prompts to choose your installation directory (default: `C:\Program Files\RaceCoordinator AI`).
4. Choose whether to create a desktop shortcut.
5. Click **Install** to complete the setup.

### 3. Launching
Double-click the **Race Coordinator AI** shortcut on your Desktop or open it from your Windows Start Menu.

!!! note "Legacy Windows (XP / 7 / 8) Prerequisites"
    If running on Windows 7, 8, or XP, ensure you have the [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784) installed.

---

## 🍏 macOS Installation

### 1. Download the Disk Image
Download `RaceCoordinator_Mac_*.dmg` from the release page.

### 2. Install to Applications
1. Double-click the downloaded `RaceCoordinator_Mac_*.dmg` file to open the disk image.
2. Drag the **Race Coordinator AI** icon into your **Applications** folder.
3. Eject the disk image.

### 3. First Launch & macOS Security
1. Open your **Applications** folder and double-click **Race Coordinator AI**.
2. If macOS displays a message saying *"Race Coordinator AI cannot be opened because it is from an unidentified developer"*:
   - Open **System Settings** (or System Preferences) → **Privacy & Security**.
   - Scroll down to the **Security** section and click **Open Anyway** next to Race Coordinator AI.
   - Alternatively, hold `Control` while clicking the app icon in Applications and choose **Open**.

---

## 🐧 Linux, Raspberry Pi & Arduino Uno Q Installation

### 1. Download the Linux Package
Download `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` from the release page.

### 2. Extract and Run
1. Open a terminal and extract the archive to your desired folder:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Ensure the launcher has execute permissions:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Run the application:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## First Launch & Getting Started

When you first launch Race Coordinator AI:

1. **Default Database**: The application automatically initializes an embedded SQLite database (`racecoordinator.db`) pre-populated with sample drivers, teams, a default 4-lane track, and standard race formats (Round Robin, Practice).
2. **Keyboard Demonstration Mode**: You can explore and test race modes immediately using keyboard timing without connecting physical track hardware.
3. **Configure Track Sensors**: Navigate to **Track Manager** → **Edit Track** to set up your interface hardware (Arduino Uno / Uno Q, Phidget, Trak-Mate, or Webcam lap counting).

---

## Upgrading Existing Installations

Upgrading to a newer version of Race Coordinator AI is seamless:

* **Your Data is Preserved**: Your database (`racecoordinator.db`), race statistics, custom driver profiles, track configurations, and custom themes are stored in your user application data folder and are **not** overwritten when updating the app.
* **To Upgrade**: Simply download and run the installer for the new version over your existing installation.

---

## Reporting Issues & Feedback

If you encounter an issue during installation or have a feature request:

1. Visit our **[GitHub Issues Portal](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Search existing issues to see if a solution or workaround is already posted.
3. Click **New Issue** and provide:
   * Your Operating System and version.
   * Race Coordinator AI version (e.g., `v1.0.0` or `v1.0.0-beta.1`).
   * Steps to reproduce the problem and screenshots/logs where applicable.
   * Please submit separate issues for each distinct bug or feature request so they can be tracked independently.
