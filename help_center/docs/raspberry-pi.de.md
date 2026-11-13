# Raspberry Pi-Einrichtung (Experimentell)

Diese Anleitung erklärt, wie Sie **Race Coordinator AI (RC AI)** auf einem **Raspberry Pi**-Einplatinencomputer unter Verwendung einer Zwei-Platinen-Architektur einrichten.

---

> [!NOTE] Experimentelle Hardware-Konfiguration
> Während die Linux ARM64-Hauptanwendung von Race Coordinator AI nativ und reibungslos auf 64-Bit-Raspberry Pi OS läuft, ist der Betrieb auf einem Raspberry Pi als **experimentell** eingestuft. Im Gegensatz zur integrierten Dual-Core-Architektur des Arduino Uno Q (der sowohl eine Anwendungs-MPU als auch einen dedizierten Echtzeit-STM32-Mikrocontroller auf einer einzigen Platine vereint), erfordert ein Raspberry Pi-Setup einen **externen USB-Mikrocontroller** (wie einen Arduino Uno, Nano, Mega oder RP2040), um Bahn-Sensoren und Stromrelais zu steuern.

---

## Architektur: Warum ein Zwei-Platinen-Setup?

Um zu verstehen, warum Race Coordinator AI auf einem Raspberry Pi zwei Platinen verwendet, hilft der Vergleich zwischen Allzweck-Betriebssystemen und deterministischem Echtzeit-Timing:

```
┌────────────────────────────────────────────────────────┐
│           Raspberry Pi 4 / 5 (Host-Computer)           │
│                                                        │
│  - 64-Bit Raspberry Pi OS (Debian Linux)               │
│  - Java 21-Server-Laufzeit & SQLite-Datenbank          │
│  - Webanwendungs-Server (Port 7070)                    │
│  - Vollbild-Chromium-Kioskanzeige (HDMI zum Fernseher) │
└───────────────────────────┬────────────────────────────┘
                            │ Serielle USB-Verbindung
                            │ (/dev/ttyACM0 oder /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Externer Mikrocontroller (Arduino Uno / Nano)     │
│                                                        │
│  - Echtzeit-Firmware (racecoordinatorai_sketch.ino)    │
│  - Mikrosekundengenaue Interrupt-Verarbeitung          │
│  - 5V-tolerante Sensoreingänge (Fototransistoren / IR) │
│  - Bahnstrom-Relaissteuerung & Chaostasten             │
└────────────────────────────────────────────────────────┘
```

### Warum nicht direkt die GPIO-Pins des Raspberry Pi nutzen?

1. **Jitter durch Linux-Kernel-Scheduling**:
   Raspberry Pi OS ist ein präemptives Mehrbenutzer-Betriebssystem für allgemeine Zwecke. Der Linux-Kernel teilt Prozessorzeit ständig zwischen Hintergrunddiensten, Netzwerk-E/A, grafischer Oberfläche und Systemaufgaben auf. Dies führt zu nicht-deterministischen Verzögerungen („Jitter“) von typischerweise **5 bis 30 Millisekunden**. Im Slot-Car-Rennsport erzeugt ein Fahrzeug, das einen optischen Sensor oder Dead-Strip mit hoher Geschwindigkeit überquert, einen elektrischen Impuls von nur **1 bis 5 Millisekunden**. Das Abfragen über Linux-GPIOs oder User-Space-Interrupts führt unweigerlich zu verpassten Runden und ungenauen Rundenzeiten im Hundertstelsekundenbereich.
2. **Spannungspegel & Überspannungsschutz**:
   Die 40-Pin-GPIO-Leiste des Raspberry Pi arbeitet ausschließlich mit **3,3V-Logik** und besitzt keinen integrierten Überspannungsschutz. Der direkte Anschluss an Bahnverkabelungen birgt ein hohes Risiko der Zerstörung des Einplatinencomputers durch 5V-Lichtschranken, induktive Spannungsspitzen von Relaisspulen oder 12V–18V Motor-Gegeninduktionen.
3. **Die Zwei-Platinen-Lösung**:
   Durch die Kombination des Raspberry Pi mit einem kostengünstigen USB-Mikrocontroller (wie Arduino Uno R3/R4, Nano, Mega 2560 oder Raspberry Pi Pico) erhalten Sie die optimale Lösung:
   - Der **Mikrocontroller** führt eine Bare-Metal-Echtzeit-Firmware mit Hardware-Interrupts im Sub-Millisekundenbereich und robuster 5V-Spannungsfestigkeit aus.
   - Der **Raspberry Pi** dient als leistungsfähiger Host-Computer für den Java 21-Server, die SQLite-Datenbank, Netzwerkdienste, Sprachausgabe und die HDMI-Displayanzeige.

---

## Hardware-Anforderungen & Speichervarianten

### 1. Raspberry Pi-Einplatinencomputer

* **Unterstützte Modelle**: **Raspberry Pi 4 Model B** oder **Raspberry Pi 5** (64-Bit ARM Cortex-A72 oder Cortex-A76).
* **Betriebssystem**: **Raspberry Pi OS (64-Bit)** ist erforderlich. Die 32-Bit-Version wird nicht unterstützt.
* **Speichermedium**: 16 GB oder größere High-Speed microSD-Karte (Klasse A1 oder A2 empfohlen) oder eine USB 3.0-SSD.
* **Netzteil**: Offizielles Raspberry Pi USB-C-Netzteil (15W für Pi 4, 27W für Pi 5) zur Vermeidung von Unterspannungsdrosselung.

### 2 GB vs. 4 GB / 8 GB RAM

| Modell | Empfohlener Betriebsmodus | Beschreibung |
| :--- | :--- | :--- |
| **Raspberry Pi (2 GB RAM)** | **Headless-Appliance-Modus** | Ideal für den Betrieb als reiner Bahnserver ohne angeschlossenen Monitor. Fahrer und Rennleiter öffnen die Benutzeroberfläche über WLAN/LAN auf Tablets, Smartphones oder Laptops (`http://<pi-ip>:7070`). Die Deaktivierung des lokalen Chromium-Kiosk-Browsers spart wertvollen Arbeitsspeicher für Server und Datenbank. |
| **Raspberry Pi (4 GB oder 8 GB RAM)** | **Kiosk-Anzeigemodus** *(Empfohlen)* | Empfohlen beim direkten Anschluss eines HDMI-Monitors oder Fernsehers. Führt den vollständigen Desktop, den Chromium-Kioskbrowser, die Java-Laufzeitumgebung und die Datenbank gleichzeitig mit hoher Reaktionsfähigkeit aus. |

### 2. Externer Timing-Mikrocontroller

Ein externes Board mit der Race Coordinator AI-Firmware:

* **Empfohlene Boards**:
  * **Arduino Uno R3 oder R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideal für 4- oder 6-spurige Bahnen mit vielen Sensor-Pins)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** mit Arduino-Firmware
* **USB-Kabel**: Standard-USB-Kabel zur Verbindung des Mikrocontrollers mit einem USB-Anschluss des Raspberry Pi.
* **Bahnsensoren & Relais**: Angeschlossen an den Mikrocontroller gemäß dem **[Bahnkonfigurations-Leitfaden](track-editor.de.md)**.

---

## Schritt-für-Schritt-Installation

### Schritt 1: Raspberry Pi OS (64-Bit) installieren

1. Laden Sie den **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** auf Ihren PC oder Mac herunter und öffnen Sie ihn.
2. Wählen Sie Ihr Raspberry Pi-Modell aus (Pi 4 oder Pi 5).
3. Wählen Sie unter **Betriebssystem** die Option **Raspberry Pi OS (64-bit)** (Debian Bookworm oder Bullseye).
4. Klicken Sie auf **Einstellungen bearbeiten** (Zahnradsymbol), um vorab zu konfigurieren:
   * **Hostname**: Einen erkennbaren Namen festlegen (z. B. `racecoordinator` oder `slotcar-pi`).
   * **Benutzername und Passwort**: Benutzerkonto anlegen (z. B. Benutzername `pi`).
   * **WLAN**: SSID und Passwort Ihres WLANs eingeben.
   * **Dienste**: **SSH aktivieren** (mit Passwort-Authentifizierung oder Public-Key).
5. Wählen Sie Ihre microSD-Karte oder SSD aus und klicken Sie auf **Schreiben**.

### Schritt 2: Mikrocontroller-Firmware flashen

Bevor Sie Ihren Arduino an den Raspberry Pi anschließen:

1. Laden Sie das neueste Race Coordinator AI-Release-Paket auf Ihren Computer herunter oder entpacken Sie `racecoordinatorai_sketch.ino` aus dem Release-Archiv im Ordner `firmware/`.
2. Öffnen Sie den Sketch in der **Arduino IDE** auf Ihrem PC.
3. Wählen Sie Ihren Boardtyp (z. B. *Arduino Uno* oder *Arduino Nano*) und den seriellen Port aus.
4. Klicken Sie auf **Hochladen**, um die Firmware zu kompilieren und auf das Board zu übertragen.
5. Trennen Sie den Mikrocontroller vom PC und schließen Sie ihn an einen USB-Port Ihres Raspberry Pi an. Er wird automatisch als serielles Gerät erkannt (üblicherweise `/dev/ttyACM0` oder `/dev/ttyUSB0`).

### Schritt 3: Voraussetzungen auf dem Raspberry Pi installieren

Starten Sie den Raspberry Pi und stellen Sie über das Terminal Ihres PCs eine SSH-Verbindung her:

```bash
ssh pi@<hostname>.local
# Oder über die IP-Adresse des Pi verbinden:
# ssh pi@192.168.1.xxx
```

Paketlisten aktualisieren und Java-Laufzeitumgebung, Sprachausgabe-Tools, Browser sowie Hilfsprogramme installieren:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Hinweis: Bei neueren Debian/Raspberry Pi OS Bookworm-Versionen heißt das Browser-Paket `chromium` anstelle von `chromium-browser`. Falls `chromium-browser` nicht gefunden wird, installieren Sie `chromium`).*

### Schritt 4: Automatisiertes Installationsprogramm herunterladen und ausführen

1. Übertragen Sie das Linux ARM64-Release-Archiv auf Ihren Raspberry Pi:
   ```bash
   # Vom Terminal Ihres PCs / Macs:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(Alternativ können Sie die `.tar.gz`-Datei direkt auf dem Pi über die [Download-Seite](downloads.de.md) mit `curl` oder `wget` laden).*

2. Archiv entpacken und in das Installationsverzeichnis wechseln:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Installationsprogramm mit `sudo` starten:
   ```bash
   sudo ./install.sh
   ```

#### Automatische Hardware-Erkennung & Pre-Flight-Banner

Das Installationsprogramm liest `/proc/device-tree/model` aus und erkennt automatisch die Ausführung auf einem Raspberry Pi:

- **Plattform-Auflösung**: Erkennt `Hardware Platform: pi`.
- **Dienstkonto**: Weist die Ausführung dem aufrufenden Benutzer zu (z. B. `pi`), richtet systemd-Dienste ein und vergibt serielle Gruppenberechtigungen (`dialout`).
- **Firmware-Upload**: Überspringt automatisch die Kompilierung und das Hochladen der Zephyr-Firmware für den Arduino Uno Q, da auf dem Raspberry Pi ein externer USB-Arduino verwendet wird.

Bevor Dateien kopiert oder Dienste konfiguriert werden, zeigt das Installationsprogramm die Konfigurationsübersicht an:

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

#### Befehlszeilenoptionen des Installers

Sie können die Installation über optionale Befehlszeilenargumente anpassen:

| Argument | Beschreibung | Standard |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Ziel-Hardwareplattform explizit vorgeben. | Automatisch über `/proc/device-tree/model` erkannt (`pi`) |
| `--user=<benutzername>` | Linux-Benutzerkonto für `/opt/racecoordinatorai` und Dienste. | Automatisch über `$SUDO_USER` ermittelt (Standard: `pi` auf Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Kompilierung/Upload des Mikrocontroller-Sketches explizit überspringen. | Bei `pi` automatisch übersprungen |
| `-v`, `--verbose` | Ausführliche Protokollausgabe aktivieren. | Standardausgabe (`false`) |
| `-h`, `--help` | Hilfe und Optionen anzeigen. | - |

---

## Betriebsmodi: Kiosk vs. Headless

### 1. Kiosk-Anzeigemodus (4 GB / 8 GB Pi)

Standardmäßig aktiviert das Installationsprogramm zwei systemd-Hintergrunddienste:

1. `racecoordinatorai.service`: Der Backend-Java-Server und die integrierte SQLite-Datenbank.
2. `racecoordinatorai-kiosk.service`: Eine Vollbild-Chromium-Sitzung, die auf dem primären HDMI-Display unter `http://localhost:7070` gestartet wird.

Wenn ein Fernseher oder Monitor an den HDMI-Port des Pi angeschlossen ist, startet Race Coordinator AI beim Booten automatisch im Vollbild-Kioskmodus.

### 2. Headless-Appliance-Modus (2 GB Pi oder dedizierter Server)

Wenn Sie einen **2 GB Raspberry Pi** verwenden oder der Pi ohne Bildschirm unter der Rennbahn montiert ist, deaktivieren Sie den Kiosk-Dienst:

```bash
# Grafischen Kiosk-Browser stoppen und dauerhaft deaktivieren:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Mit deaktiviertem Kiosk-Dienst:

- Benötigt der Backend-Server nur minimalen Arbeitsspeicher (~250–350 MB RAM).
- Sie können von jedem Gerät im selben WLAN oder LAN über den Browser zugreifen:
  ```text
  http://<raspberry-pi-ip>:7070
  # Beispiel: http://192.168.1.150:7070 oder http://racecoordinator.local:7070
  ```

---

## Bahnschnittstelle in Race Coordinator AI konfigurieren

Nachdem der Server läuft, richten Sie die serielle Schnittstelle zum externen Mikrocontroller ein:

1. Öffnen Sie die Benutzeroberfläche im Browser (`http://localhost:7070` oder `http://<pi-ip>:7070`).
2. Navigieren Sie zu **Bahn-Verwaltung** → **Bahn bearbeiten**.
3. Wählen Sie die Registerkarte **Hardware-Schnittstellen**:
   * **Schnittstellentyp**: **Arduino** auswählen.
   * **Port**: `/dev/ttyACM0` oder `/dev/ttyUSB0` (der Anschluss Ihres Arduinos).
   * **Baudrate**: `115200`.
4. Klicken Sie auf **Verbinden / Schnittstelle testen**, um die bidirektionale Kommunikation zu prüfen.
5. Weisen Sie Ihre Spursensoren, Chaostasten und Bahnstromrelais den konfigurierten Arduino-Pins zu.
6. Klicken Sie auf **Bahn speichern**.

---

## Verwaltung der Systemd-Dienste

Steuern Sie die Hintergrunddienste mit standardmäßigen `systemctl`-Befehlen:

```bash
# Serverstatus prüfen und Live-Logs anzeigen:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Anwendung neu starten:
sudo systemctl restart racecoordinatorai.service

# Status des Kiosk-Browsers prüfen (falls aktiviert):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Aktualisierung einer bestehenden Installation

Die Aktualisierung von Race Coordinator AI auf einem Raspberry Pi erhält alle vorhandenen Daten:

* **Datenerhalt**: Ihre Datenbank (`racecoordinator.db`), Rennergebnisse, Fahrerprofile und benutzerdefinierten Designs bleiben in `/home/<benutzer>/.racecoordinatorai/` erhalten und werden nicht überschrieben.
* **In-App-Aktualisierung**: Wenn eine neue Version verfügbar ist, klicken Sie im Benachrichtigungsbanner auf **Jetzt installieren**. Das Updateskript `/opt/racecoordinatorai/scripts/update_app.sh` erkennt den Raspberry Pi automatisch und überspringt das Flashen des Sketches.
* **Manuelle Aktualisierung**: Laden Sie das neue `.tar.gz`-Paket herunter und führen Sie folgenden Befehl aus:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
