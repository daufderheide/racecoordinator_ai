# Gepetto Slot Car Lap Counter & Race Coordinator Integration Guide

Date: 08/04/2026

This guide explains how to start, configure, and verify the network-based WebSocket integration between the **Gepetto Lap Counter** camera tracking application and the **Race Coordinator AI** slot racing management system.

---

## 1. Start the Race Coordinator Server

Start the Race Coordinator application on your host machine:
* Go to the directory where race coordinator is installed.
* **Linux/macOS**: `./run_server.sh`
* **Windows (from PowerShell)**: `.\run_server.ps1`

Once started, ensure the application is running and accessible (typically via a browser window at http://localhost:4200).

### Configuring Track Interfaces
Once the server is running, you do not need to perform any manual configuration to enable WebSockets. The server runs the WebSocket data listener automatically under the hood.

If you need to configure or edit your track layout:
1. Open the web interface at [http://localhost:4200](http://localhost:4200).
2. Go to **Manage** > **Tracks**.
3. Select your track or add a new track configuration.

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
