# Network Setup Guide for Race Coordinator

This guide is designed to help any user—regardless of technical experience—configure their network so that other devices can connect to the Race Coordinator server. 

Whether you want to connect from another PC on the same Wi-Fi, use a mobile phone as a client, or even allow access from outside your home network, this guide covers it all!

---

## 1. Finding Your Server's IP Address

Before any other device can connect to your server, you need to know the server's local IP address. 

**The Easy Way (Via the App):**
1. Start your server.
2. Open the client on the same computer where the server is running (typically by navigating to `http://localhost:4200` or opening the app).
3. Go to the **Race Day Setup** component.
4. Check the **Splash Screen** or the **About Page**. 
5. You should see an IP address listed (for example: `192.168.1.50`). This is the IP address that other devices will use to connect!

**Alternative Method (Command Line):**
*   **Windows PCs:** 
    1. Click Start, type `cmd`, and open the Command Prompt.
    2. Type `ipconfig` and press Enter. 
    3. Look for the "IPv4 Address" under your active Wi-Fi or Ethernet adapter (e.g., `192.168.x.x`).
*   **Macs:**
    1. Open the Terminal application (Cmd + Space, type Terminal, press Enter).
    2. Type `ifconfig | grep "inet " | grep -v 127.0.0.1` and press Enter. 
    3. Look for an address that typically starts with `192.168.` or `10.0.`.

---

## 2. Connecting from the Local Area Network (LAN)

This section applies if the device you want to connect is on the **same Wi-Fi or wired network** as the server computer.

### Devices Supported:
*   Windows PCs & Laptops
*   Macs & MacBooks
*   Mobile Phones (iPhones, Androids)
*   Tablets (iPads, Android Tablets)

### Steps to Connect:
1. Ensure the connecting device is connected to the same Wi-Fi or local network as your server.
2. Open a web browser (Chrome, Safari, Edge, etc.) on the connecting device.
3. In the address bar, type the URL using the Server IP Address you found in Step 1, followed by the client port (usually `:4200` for the web interface). 
   *   **Example URL:** `http://192.168.1.50:4200`
4. Press Enter. The client interface should load, allowing the device to interact with the server.

### Troubleshooting: Device Cannot Connect (Firewalls)

If you type the URL correctly on your phone, tablet, or another PC but the page never loads, the **Firewall** on your server computer is likely blocking the connection. By default, computer firewalls block incoming connections from other devices for security.

> [!WARNING]
> **Is it safe to allow this?**
> * **The Danger:** Opening a hole in your firewall can allow unwanted programs to connect to your computer. If your server computer is connected to a public Wi-Fi network (like a coffee shop or airport), strangers could potentially connect to your application or probe for vulnerabilities.
> * **Why this is safe for home use:** You are only allowing traffic for this specific application (the Race Coordinator server). As long as you are connected to your secure, private home Wi-Fi (where you trust the other devices on your network), allowing this connection is perfectly safe and necessary for the app to function across multiple devices.

Here is exactly how to allow the connection depending on your operating system:

#### 1. Windows Firewall
On Windows, you need to allow the web server program (usually Node.js or Java) to pass through the firewall.

1. Click the Start button and search for **Windows Security**.
2. Go to **Firewall & network protection**.
3. Click on **Allow an app through firewall** (located near the bottom of the window).
4. Click the **Change settings** button at the top right (this requires administrator privileges).
5. Scroll down the list and find the program running your server (look for **Node.js**, **Java(TM) Platform SE binary**, or the specific name of the Race Coordinator application).
6. Check the box to the left of the application name, and ensure the box under **Private** is checked.
7. Click **OK**.

![Windows Firewall Settings](/Users/dave/.gemini/antigravity-ide/brain/e7a276ec-03f5-450f-b931-951c7bb1a214/windows_firewall_1780152605690.png)

#### 2. Mac Firewall
On a Mac, you need to allow incoming connections in your System Settings.

1. Click the Apple menu () in the top left and select **System Settings**.
2. Click on **Network** in the left sidebar, then click **Firewall** on the right.
3. Click the **Options...** button.
4. Click the **+** (plus) button to add an application.
5. Select the application running the server (e.g., Terminal, Node, Java, or Race Coordinator).
6. Ensure the setting next to the app says **Allow incoming connections**.
7. Click **OK**.

![Mac Firewall Settings](/Users/dave/.gemini/antigravity-ide/brain/e7a276ec-03f5-450f-b931-951c7bb1a214/mac_firewall_1780152620552.png)

---

## 3. Configuring for Remote Access (Outside the LAN)

If you want devices outside of your home network (like someone at a different house, or a phone using cellular data) to connect, you will need to set up **Port Forwarding**. This is a slightly more advanced step that is done on your internet router.

### Step-by-Step Remote Setup:
1. **Find your Public IP Address:** On your server computer, open a web browser and search Google for "What is my IP". Google will display your public-facing IP address (e.g., `72.14.200.1`).
2. **Log into your Router:** Open a web browser and type in your router's IP address (commonly `192.168.1.1`, `192.168.0.1`, or `10.0.0.1`). Log in with your administrator credentials (often found on a sticker on the back of the router).
3. **Set up Port Forwarding:** 
   *   Find the "Port Forwarding", "NAT", or "Virtual Servers" section in your router settings.
   *   Create a new rule to forward the application port (e.g., port `4200`) to your Server's Local IP address (the one you found in Step 1, e.g., `192.168.1.50`).
4. **Connecting Remotely:**
   *   The remote user will open their web browser (on a PC, Mac, phone, or tablet).
   *   They will enter your **Public IP Address** followed by the port.
   *   **Example URL:** `http://72.14.200.1:4200`

> **Security Warning:** Opening ports to the internet exposes your server to anyone who knows your IP address. Ensure your application has appropriate security/passwords in place before configuring remote access.

---

## Quick Reference: Which URL to Use?

| Connection Type | Device Type | URL Format to Use | Example URL |
| :--- | :--- | :--- | :--- |
| **Local Host** | The Server PC itself | `http://localhost:4200` | `http://localhost:4200` |
| **Local Network (LAN)** | PC, Mac, Phone, Tablet on same Wi-Fi | `http://<Local_Server_IP>:4200` | `http://192.168.1.50:4200` |
| **Remote Access (WAN)** | Any device outside your home network | `http://<Public_IP>:4200` | `http://72.14.200.1:4200` |

*(Note: Replace `4200` with the actual port your client application runs on if it differs.)*
