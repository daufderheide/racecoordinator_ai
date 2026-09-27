# Arduino UNO Q Einrichtungsanleitung

Diese Anleitung erklärt, wie Sie **Race Coordinator AI (RC AI)** auf dem **Arduino UNO Q** Hybrid-Entwicklungsboard als eigenständige Hardware-Appliance einrichten.

---

## Hardware-Übersicht & Speichervarianten

Der **Arduino UNO Q** kombiniert einen 64-Bit-Linux-Einplatinencomputer (SBC) mit einem Echtzeit-Mikrocontroller auf einer einzigen Platine:

- **Linux-MPU (Qualcomm Cortex-A53 @ 2,0 GHz)**: Führt den Race Coordinator AI-Server, die SQLite-Datenbank, den Webclient-Server und den automatischen Updater aus.
- **Echtzeit-MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Verwaltet Runden-Sensor-Pin-Interrupts, Leistungsrelais und FastLED-RGB-Lichtbrücken mit Sub-Millisekunden-Genauigkeit.
- **Display-Ausgang**: Der USB-C DisplayPort-Ausgang wird direkt an einen Monitor, Fernseher oder Touchscreen angeschlossen.

### 4GB- vs. 2GB-Modelle

* **Arduino UNO Q 4GB (Empfohlen & unterstützt)**: Ausgestattet mit 4 GB RAM und 32 GB eMMC-Speicher. Dieses Modell ist für den **Kiosk-Display-Modus** (direkte Ansteuerung eines HDMI/DisplayPort-Fernsehers oder -Monitors) erforderlich, da die gleichzeitige Ausführung des Linux-Desktops, des Chromium-Browsers, der Java-Laufzeitumgebung und der SQLite-Datenbank mehr als 2 GB Speicher erfordert.
* **Arduino UNO Q 2GB (Überlegungen zum Headless-Modus)**:
  * Während das 2GB-Modell nicht über genügend Speicher verfügt, um den lokalen Desktop und das Chromium-Kiosk-Display reibungslos auszuführen, verfügt es über ausreichend Speicher, um den Backend-Server im **Headless-Appliance-Modus** auszuführen.
  * **Aktueller Support-Status**: Der Headless-Modus auf dem Uno Q wird **derzeit nicht unterstützt**, da zusätzliche Anpassungen am Uno Q-Support-Paket und an der Konfiguration erforderlich sind. Die Unterstützung für den Headless-Betrieb auf dem 2GB Q **kann jedoch auf Anfrage hinzugefügt werden**, sofern der Uno Q über eine aktive Netzwerkverbindung (WLAN oder Ethernet) verfügt, damit Rennleiter und Fahrer über andere Geräte im Netzwerk auf die Weboberfläche zugreifen können.

---

## Betriebsmodi

1. **Kiosk-Display-Modus (4GB-Modell)**: Schließen Sie einen HDMI/DisplayPort-Monitor oder Fernseher über einen Multiport-Adapter direkt an den USB-C-Anschluss des Uno Q an. Das Board startet Chromium automatisch im Vollbild-Kioskmodus (`http://localhost:7070`) und ermöglicht gleichzeitig Netzwerkverbindungen aus der Ferne.
2. **Headless-Appliance-Modus (Derzeit nicht unterstützt – auf Anfrage verfügbar)**: Das Board führt ausschließlich den Backend-Server aus und stellt eine Verbindung zur Streckenhardware her, ohne dass ein lokaler Monitor oder Browser ausgeführt wird. Benutzer greifen über das lokale Netzwerk auf die Weboberfläche zu (`http://uno-q.local:7070`). Wie oben erwähnt, wird der Headless-Modus auf dem Uno Q derzeit standardmäßig nicht unterstützt, kann jedoch auf Anfrage hinzugefügt werden, wenn der Uno Q über eine Netzwerkverbindung verfügt.

---

## Schritt-für-Schritt-Installation

### Schritt 1: Board vorbereiten & Verbindung über SSH herstellen
1. Installieren Sie **Arduino Linux OS** (Debian 12 arm64) auf dem Uno Q.
2. Verbinden Sie das Board über WLAN oder Ethernet mit Ihrem lokalen Netzwerk.
3. Öffnen Sie eine SSH-Sitzung:
   ```bash
   ssh arduino@uno-q.local
   ```

### Schritt 2: Voraussetzungen installieren
Installieren Sie OpenJDK 11, `arduino-cli`, Anzeige-Dienstprogramme und Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Schritt 3: Mikrocontroller-Firmware flashen (mit FastLED-Unterstützung)
Kompilieren und laden Sie den Hardware-Sketch auf die integrierte STM32-MCU hoch:
```bash
# STM32-Board-Core in arduino-cli installieren
arduino-cli core update-index
arduino-cli core install arduino:stm32

# racecoordinatorai_sketch kompilieren und hochladen
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Schritt 4: Anwendungspaket & Systemd-Dienste installieren
1. Laden Sie `RaceCoordinatorAI-Linux-ARM64.tar.gz` herunter und entpacken Sie es nach `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Führen Sie das Installationsskript aus:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Starten Sie die Dienste:
   ```bash
   # Backend-Server starten
   sudo systemctl start racecoordinatorai

   # (Optional) Lokalen Bildschirm-Kiosk über USB-C DisplayPort aktivieren
   sudo systemctl enable --now racecoordinatorai-kiosk
   ```

---

## FastLED RGB-Lichtbrücken-Setup

FastLED wird auf dem Uno Q vollständig unterstützt. Adressierbare RGB-LED-Streifen (WS2812B, NeoPixel, SK6812, APA102) werden direkt an die GPIO-Header-Pins der STM32-MCU angeschlossen.

- **Startampeln**: 5-stufige Countdown-Animation (Rot $\rightarrow$ Gelb $\rightarrow$ Grün).
- **Boxengasse / Auftanken**: Echtzeit-Kraftstoffstandanzeige in Prozent pro Spur.
- **Führender & Sieg**: Dynamischer Puls für den Führenden und Zielflaggen-Animation.

---

## Automatische Software-Updates

Wenn eine Verbindung zu WLAN besteht, prüft Race Coordinator AI GitHub Releases automatisch:
1. **App-Update**: Lädt das neue Linux-ARM64-Paket im Hintergrund herunter.
2. **Neustart des Dienstes**: Startet `racecoordinatorai.service` über systemd nahtlos neu.
3. **MCU-Sketch-Synchronisierung**: Flasht die Firmware des STM32-Mikrocontrollers automatisch neu mit `arduino-cli`, wenn `racecoordinatorai_sketch.ino` aktualisiert wurde.
