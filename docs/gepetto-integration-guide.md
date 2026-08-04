# Gepetto Slot Car Lap Counter & Race Coordinator Integration Guide

Date: 08/04/2026

This guide explains how to start, configure, and verify the network-based WebSocket integration between the **Gepetto Lap Counter** camera tracking application and the **Race Coordinator AI** slot racing management system.

---

## 1. Bringing Up the Race Coordinator Server

The Race Coordinator AI repository contains convenience scripts to start both the Java backend (port `7070`) and the Angular web frontend (port `4200`) concurrently.

### On macOS / Linux
1. Ensure Maven is installed:
   ```bash
   brew install mvn
   ```
2. Navigate to the repository root and make the scripts executable:
   ```bash
   cd racecoordinator_ai
   chmod +x run_server.sh run_client.sh
   ```
3. Run the application:
   ```bash
   ./run_server.sh
   ```
   *(Note: On the first launch, dependencies will be downloaded, which may take a few moments. Once started, a browser window will automatically open to http://localhost:4200.)*
4. Or, start in headless mode (starts ONLY the backend server without launching the frontend or browser):
   ```bash
   ./run_server.sh --headless
   ```

### On Windows
1. Open PowerShell as Administrator.
2. Allow script execution if necessary:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```
3. Navigate to the repository root:
   ```powershell
   cd racecoordinator_ai
   ```
4. Run the application:
   ```powershell
   .\run_server.ps1
   ```
5. Or, start in headless mode:
   ```powershell
   .\run_server.ps1 -Headless
   ```

### Configuring WebSocket Track Interfaces
Once the server is running, configure your virtual track interfaces in the Race Coordinator web interface:
1. Open the web interface at [http://localhost:4200](http://localhost:4200) (if not already opened).
2. Go to **Settings** > **Track Configuration**.
3. Select your track or add a new track configuration.
4. Add a **WebSocket** interface, specifying the assigned lanes and interface indexing (virtual ports). Save the settings.

---

## 2. Bringing Up the Gepetto Lap Counter Client

The Gepetto Lap Counter is available as a prebuilt application on multiple platforms.

### Installation
* **Android / Android TV / Fire TV**: Download and install the **Gepetto Slot Car Lap Counter** app from the Google Play Store (or Amazon Appstore).
* **Desktop (macOS / Windows)**: Download the ready-to-install desktop application from:
  [https://gepetto.club/lapcounter/gepettolapcounterdesktop.html](https://gepetto.club/lapcounter/gepettolapcounterdesktop.html)

### Connecting to Race Coordinator
1. Inside the Gepetto application, navigate to the **Settings** screen.
2. Enable the **Connect to Race Coordinator** option.
3. (Optional) Provide the **Race Coordinator Password** if access control tokens are configured on your server. *(Note: If both Gepetto and the Race Coordinator server are running on the same physical machine, no password is required, as the connection will be automatically elevated to a Director role.)*
4. Save the settings.
5. The application will leverage JmDNS / Network Service Discovery (NSD) to locate the running `RaceCoordinatorServer` on the local network (`_racecoordinator._tcp.local.`) on port `7070` and automatically establish a WebSocket session.

---

## 3. Testing & Verifying the Integration

To verify the bi-directional communication between Gepetto (client) and Race Coordinator (server):

1. **Verify Network Discovery**:
   On macOS/Linux, verify that the server is successfully advertising itself on the local network by running:
   ```bash
   dns-sd -B _racecoordinator._tcp.local.
   ```
   You should see the active instance of `RaceCoordinatorServer` on port `7070`.
2. **Start a Race Session**:
   In the Race Coordinator web interface (http://localhost:4200), start a new race/heat session.
3. **Simulate a Crossing Trigger**:
   - Ensure the Gepetto client is running with the lap counter/camera view open.
   - Trigger a simulated lap crossing (e.g. wave your hand or pass a slot car in front of the camera).
4. **Inspect the Leaderboard**:
   - Check the active leaderboard/timing table in the Race Coordinator web frontend.
   - The lap count and lap times for the respective lane must update instantly on the screen.
5. **Inspect Server Logs**:
   To diagnose issues, check the server output or logs. You should see incoming WebSocket payloads parsed as `InterfaceEvent` and dispatched successfully to the active race state controller.
