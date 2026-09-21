# Mobile Camera Setup Guide

This guide explains how to configure a smartphone or tablet (iOS or Android) as a high-speed optical lap timing camera in **Race Coordinator AI (RC AI)**.

---

## Overview

Race Coordinator AI allows you to use any modern smartphone as an optical timing bridge. By mounting the device directly above your track's finish line or pit entrance, the phone's web camera detects cars crossing each lane and streams timing trigger events to the race server in real time over WebSockets.

Because this interface runs directly inside the mobile browser without installing any native apps, browser security policies apply.

---

## Why Local Network Camera Access is Restricted

Modern web browsers enforce strict security standards around media devices (camera and microphone via `navigator.mediaDevices.getUserMedia`). 

To protect user privacy, browsers only allow camera access within a **Secure Context**:

1. **Encrypted HTTPS connections** (`https://...`).
2. **Local loopback addresses** (`http://localhost` or `http://127.0.0.1`).

When your mobile device connects to Race Coordinator AI across your local Wi-Fi network using a local IP address (e.g., `http://192.168.1.150:4200`), the browser classifies the connection as an insecure HTTP origin and blocks camera access by default.

---

## Browser Compatibility & Differences

| Operating System | Browser | Web Engine | Bypass Flag Available? | Camera over Local HTTP? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Yes** (`chrome://flags`) | **Yes** (with flag) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Yes** (`edge://flags`, etc.) | **Yes** (with flag) |
| **Android** | Firefox | Gecko | No | HTTPS Required |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **No** | HTTPS Required |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **No** | HTTPS Required |

!!! warning "Important Note on iOS Chrome"
    On Apple iOS, Apple requires all web browsers (including Google Chrome, Microsoft Edge, and Firefox) to use Apple's **WebKit** engine under the hood. 
    
    Therefore, **iOS Chrome does NOT support `chrome://flags`**. Attempting to navigate to `chrome://flags` on iOS will do nothing or trigger a web search. iOS devices require an HTTPS connection regardless of which browser app is installed.

---

## Step-by-Step Setup for Android (Google Chrome)

Android Chrome allows you to whitelist specific local IP addresses as secure origins using a built-in developer flag.

### Step 1: Obtain the Server IP & Port
1. In Race Coordinator AI on your main computer, navigate to **Track Editor** > **Camera Configuration**.
2. Expand the **Mobile Pairing** section and click **Show Pairing QR Code**.
3. Note the displayed server URL (e.g., `http://192.168.1.150:4200`).

### Step 2: Configure the Chrome Security Flag
1. Open **Google Chrome** on your Android smartphone or tablet.
2. In the Chrome address bar, type the following URL and press Enter:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Locate the highlighted flag titled **"Insecure origins treated as secure"**.
4. Tap the dropdown menu and select **Enabled**.
5. In the text input box directly below the flag, enter the exact protocol, IP address, and port of your server:
   ```text
   http://192.168.1.150:4200
   ```
   *(Replace with your actual IP address and port).*
6. Tap the blue **Relaunch** button at the bottom of the screen to restart Chrome.

### Step 3: Connect and Grant Permissions
1. Open your phone's camera app and scan the **Pairing QR Code** displayed on the Track Editor screen (or type the pairing URL into Chrome).
2. When prompted with **"racecoordinator.ai wants to use your camera"**, tap **Allow**.
3. The live video feed and interactive detection gates will appear on your device.

---

## Step-by-Step Setup for iOS (iPhone & iPad)

Because Apple WebKit enforces secure context requirements across all browsers on iOS without a bypass flag, connecting an iPhone or iPad requires serving the client over **HTTPS**.

### Method 1: Local HTTPS Reverse Proxy with mkcert (Recommended)
This approach creates a locally trusted SSL certificate on your local network.

1. **Install mkcert** on your computer:
   - macOS: `brew install mkcert`
   - Windows: `choco install mkcert` or `scoop install mkcert`
   - Linux: `sudo apt install libnss3-tools && brew install mkcert`
2. **Generate a local Certificate Authority (CA)**:
   ```bash
   mkcert -install
   ```
3. **Generate a certificate for your local IP**:
   ```bash
   mkcert 192.168.1.150 localhost 127.0.0.1
   ```
4. **Run a reverse proxy** such as Caddy or Nginx:
   Using Caddy, create a `Caddyfile`:
   ```caddy
   https://192.168.1.150:8443 {
       tls 192.168.1.150+2.pem 192.168.1.150+2-key.pem
       reverse_proxy localhost:4200
   }
   ```
   Start Caddy with `caddy run`.
5. **Install the Root CA on your iOS Device**:
   - Send the `rootCA.pem` file (located at `mkcert -CAROOT`) to your iPhone via AirDrop or email.
   - Go to **Settings** > **Profile Downloaded** > **Install**.
   - Go to **Settings** > **General** > **About** > **Certificate Trust Settings** and enable full trust for the root certificate.
6. Open Safari or Chrome on your iOS device and navigate to your secure URL (`https://192.168.1.150:8443`). Camera permissions will be prompted normally.

### Method 2: Secure HTTPS Tunnel (Fastest for Testing)
If you want to test an iPhone without installing local certificates, use a secure tunnel utility:

1. Install and launch **ngrok**:
   ```bash
   ngrok http 4200
   ```
2. Copy the generated public `https://` forwarding URL (e.g., `https://your-tunnel-id.ngrok-free.app`).
3. Open the link on your iPhone in Safari or Chrome.
4. Because the connection uses a globally trusted HTTPS certificate, iOS prompts for camera access immediately.

---

## Testing on This Computer (Desktop & Laptop Webcams)

When testing the camera interface on your primary computer without a mobile device, click **Test on this Device** in the Track Editor. This opens the camera interface locally (`http://localhost:4200/camera_interface`).

Because `localhost` is recognized as a Secure Context by all browsers, no flags or SSL certificates are needed. However, operating system and browser permissions must still be granted.

### macOS Setup & Troubleshooting

If the camera fails to start on macOS even after allowing access:

1. **Verify Browser Site Permissions**:
   - In your browser's address bar (next to `localhost:4200`), click the **Tune / Lock icon** (Site Settings).
   - Confirm that **Camera** is set to **Allow** (not "Block" or "Ask").
2. **Grant macOS System Permissions**:
   - When macOS presents the system modal (*"Google Chrome would like to access the camera"*), click **OK**.
   - If you missed the prompt or previously clicked don't allow, open **System Settings** > **Privacy & Security** > **Camera** and ensure the toggle for **Google Chrome** (or your browser) is switched **ON**.
3. **Restart the Browser (`Cmd + Q`)**:
   - **Important**: macOS security architecture (TCC) requires the browser application to be **completely quit (`Cmd + Q`) and reopened** after system camera permissions are granted before the browser process can bind to the camera hardware.
4. **Click the "Retry" Button**:
   - The initial in-page camera request often times out while the macOS system modal is waiting for your click. After granting permissions, click the **Retry** button on the screen to start the video feed.
5. **Check for Camera Hardware Lock (Exclusive Access)**:
   - Built-in Mac FaceTime HD cameras do not support simultaneous multi-app access. If another app is running (e.g., **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth**, or **OBS**), close that app and click **Retry**.

### Windows Setup & Troubleshooting

1. Open **Settings** > **Privacy & security** > **Camera**.
2. Verify that **Camera access** is turned **On**.
3. Ensure **Let apps access your camera** and **Let desktop apps access your camera** are both enabled.
4. In Chrome or Edge, allow camera permissions for `localhost:4200` when prompted.

---

## Physical Mounting & Alignment Tips

To ensure accurate lap detection:

1. **Overhead Position**: Mount the smartphone securely 12 to 24 inches (30 to 60 cm) directly above the track pointing straight down at the finish line.
2. **Avoid Vibration**: Use a rigid phone clamp, gooseneck arm, or 3D-printed gantry. Track vibrations from fast cars can cause false triggers.
3. **Lighting**: Ensure uniform illumination across all lanes. Avoid strobing fluorescent fixtures, direct sunlight glares, or cast shadows from spectators.
4. **Target Frame Rate**: In **Track Editor** > **Camera Configuration**, select **60 FPS** for slot car racing to detect high-speed passes reliably.

---

## Configuring Detection Gates

1. Open the camera interface on the mobile device.
2. Align the track finish line horizontally across the camera's field of view.
3. **Auto-Snap Calibration**:
   - Tap **Auto Snap** in the top HUD bar.
   - Follow the on-screen prompt to roll a car slowly across Lane 1, Lane 2, etc. The software will automatically calibrate detection box positions.
4. **Manual Gate Adjustment**:
   - Tap any lane gate box on the screen to select it.
   - Drag the box over the center of the lane slot.
   - Use the bottom-right circular handle to resize the gate box so it covers the lane width.
5. **Sensitivity Tuning**:
   - Open **Settings** (gear icon) on the camera interface.
   - Adjust the **Sensitivity** slider (default 50%). Lower sensitivity reduces false triggers from ambient light; higher sensitivity detects smaller or faster cars.
