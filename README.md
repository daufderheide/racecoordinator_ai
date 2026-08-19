# 🏎️ Race Coordinator AI

> **Race Coordinator AI** is a modern, cross-platform slot car race management and timing system. It provides precise lap timing, rich audio and speech race commentary, automated heat rotations, customizable race screens, driver statistics, and hardware timing support across Windows, macOS, and Linux/Raspberry Pi.

---

## 📥 Download Race Coordinator AI

Select your operating system below to download the latest installer.

| Operating System | 🟢 Official Stable Release *(Recommended)* | 🟡 Beta Preview *(Upcoming Features)* |
| :--- | :--- | :--- |
| **🪟 Windows (10 / 11)** | [**Download Windows Installer**](https://github.com/daufderheide/racecoordinator_ai/releases/latest) | [View Beta Releases](https://github.com/daufderheide/racecoordinator_ai/releases) |
| **🪟 Windows (8, 7, XP)** | [**Download Offline Windows Installer**](https://github.com/daufderheide/racecoordinator_ai/releases/latest) | [View Beta Releases](https://github.com/daufderheide/racecoordinator_ai/releases) |
| **🍏 macOS (Intel & Apple Silicon)** | [**Download macOS DMG**](https://github.com/daufderheide/racecoordinator_ai/releases/latest) | [View Beta Releases](https://github.com/daufderheide/racecoordinator_ai/releases) |
| **🐧 Linux / Raspberry Pi (ARM64)** | [**Download Linux Package**](https://github.com/daufderheide/racecoordinator_ai/releases/latest) | [View Beta Releases](https://github.com/daufderheide/racecoordinator_ai/releases) |

---

### 💡 Which file should I download?

When opening the release page, choose the installer that matches your computer:

* **Windows 10 or 11**: Download `RaceCoordinatorAI_Online_Setup_*.exe` *(Recommended — fastest, lightweight installer that downloads components automatically during setup.  This requires an internet connection during installation)*.
* **Windows 8, 7, or XP (or offline PCs)**: Download `RaceCoordinatorAI_Offline_Setup_*.exe`. Legacy Windows versions require this full offline installer for their initial installation.  After the initial installation, you can use the Online_Setup above if you have an internet connection.
* **macOS**: Download `RaceCoordinator_Mac_*.dmg`. Open the disk image and drag **Race Coordinator AI** into your Applications folder.
* **Linux / Raspberry Pi**: Download `RaceCoordinatorAI-Linux-ARM64_*.tar.gz`, unpack the archive, and run `./RaceCoordinatorAI`.

> [!TIP]
> You do **not** need to download the "Source code" (`.zip` / `.tar.gz`) or "Coverage Reports" files to use Race Coordinator AI.

---

## 🚀 Quick Start Guide

1. **Install the Application**: Run the downloaded installer for your operating system.
2. **Launch Race Coordinator AI**:
   - **Windows**: Launch from the desktop shortcut or Start Menu.
   - **macOS**: Open **Race Coordinator AI** from your `Applications` folder.
   - **Linux / Raspberry Pi**: Launch via `./RaceCoordinatorAI` in the extracted directory.
3. **Configure Your Track**: Navigate to **Track Manager** in the navigation menu to configure your track, lanes, and sensor hardware (Arduino Uno / Uno Q, Phidget, Trak-Mate, Webcam tracking, or Keyboard demo mode).
4. **Set Up a Race**: Go to **Race Day Setup**, choose your race format and heat rotation, select drivers, and start racing!

---

## 📖 Help & Documentation

Comprehensive guides, hardware wiring diagrams, and race configuration walkthroughs are available in our Help Center:

- 🌐 **Online Help Center**: [https://daufderheide.github.io/racecoordinator_ai/](https://daufderheide.github.io/racecoordinator_ai/)
- 🔌 **Hardware Timing Setup**: Learn how to configure Arduino, Phidget, and other timing interfaces in the Help Center.

---

## 🐛 Issues & Feature Requests

Encountered a bug or have a feature idea? We welcome feedback and issue reports!

👉 **[Submit an Issue or Feature Request](https://github.com/daufderheide/racecoordinator_ai/issues)**

### Best Practices for Reporting Issues
To help us resolve issues quickly, please include:
1. **Search First**: Check [open and closed issues](https://github.com/daufderheide/racecoordinator_ai/issues) to see if someone already reported the same problem.
2. **Operating System**: Specify your exact OS (e.g. Windows 11 64-bit, macOS 14 Sonoma Apple Silicon, Raspberry Pi OS 64-bit).
3. **App Version**: State the version of Race Coordinator AI you are using (e.g. `v1.0.0` or `v1.0.0-beta.1`).
4. **Clear Steps to Reproduce**: Provide step-by-step instructions detailing what you did before the issue occurred.
5. **Expected vs. Actual Result**: Describe what you expected to happen versus what actually happened.
6. **Screenshots & Logs**: Attach screenshots or relevant error messages whenever possible.

---

## 💻 Developers & Contributors

Looking to build from source, run tests, or contribute to Race Coordinator AI?

See our dedicated **[Developer Guide](DEVELOPMENT.md)** for local environment setup, testing scripts, and architecture details.
