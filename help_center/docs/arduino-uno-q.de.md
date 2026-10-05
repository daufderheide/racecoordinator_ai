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
2. **Headless-Appliance-Modus (Derzeit nicht unterstützt – auf Anfrage verfügbar)**: Das Board führt ausschließlich den Backend-Server aus und stellt eine Verbindung zur Streckenhardware her, ohne dass ein lokaler Monitor oder Browser ausgeführt wird. Benutzer greifen über das lokale Netzwerk auf die Weboberfläche zu (`http://<hostname>:7070` oder `http://<IP_ADRESSE>:7070`). Wie oben erwähnt, wird der Headless-Modus auf dem Uno Q derzeit standardmäßig nicht unterstützt, kann jedoch auf Anfrage hinzugefügt werden, wenn der Uno Q über eine Netzwerkverbindung verfügt.

---

## Schritt-für-Schritt-Installation

### Schritt 1: Board vorbereiten & Verbindung über SSH herstellen
1. Installieren Sie **Arduino Linux OS** (Debian 12 arm64) auf dem Uno Q.
2. Verbinden Sie das Board über WLAN oder Ethernet mit Ihrem lokalen Netzwerk:
   * **WLAN-Einrichtung beim ersten Start**: Beim ersten Booten fordert der Einrichtungsassistent zur Konfiguration des drahtlosen Netzwerks auf.
   * **Hinweis zur Ersteinrichtung**: Die WLAN-Verbindung wird möglicherweise nicht sofort aktiv, und manuelle Terminalbefehle wie `sudo nmcli dev wifi connect "Ihre_SSID" password "Ihr_Passwort"` können beim ersten Start ebenfalls fehlschlagen. Führen Sie in diesem Fall einfach `sudo reboot` aus. Nach dem Neustart initialisiert sich der WLAN-Adapter sauber und verbindet sich automatisch mit Ihrem konfigurierten WLAN-Netzwerk.
   * **Board- und Firmware-Updates durchführen**: Nach dem Neustart (oder wenn Sie vom System dazu aufgefordert werden) werden Sie möglicherweise gefragt, ob Sie verschiedene Pakete und Firmware-Komponenten auf dem Board aktualisieren möchten. Es wird dringend empfohlen, alle vorgeschlagenen Aktualisierungen zu akzeptieren und auszuführen, da die ab Werk installierte Firmware oft veraltet ist. Beachten Sie, dass diese anfängliche Aktualisierung einige Zeit in Anspruch nehmen kann (oft 5 bis 10+ Minuten, abhängig von der Netzwerkgeschwindigkeit); lassen Sie den Vorgang ungestört abschließen.
3. SSH auf dem Board aktivieren & verbinden:
   * **SSH-Dienst aktivieren**: Standardmäßig wird der SSH-Server auf dem Board nicht ausgeführt. Aktivieren und starten Sie den SSH-Dienst über das lokale Terminal (mit an das Board angeschlossener Tastatur und Bildschirm):
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Hostname & IP-Adresse ermitteln**: Führen Sie auf dem Board `hostname` und `hostname -I` aus, um den zugewiesenen Hostnamen und die lokale IP-Adresse des Boards zu ermitteln (das Werkssystem vergibt oft einen individuellen Namen wie z. B. `allianora` anstelle von `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Hinweis: `avahi-daemon` ist unter Arduino Linux OS nicht vorinstalliert, sodass `.local`-mDNS-Domänennamen wie `uno-q.local` standardmäßig nicht aufgelöst werden, es sei denn, Sie installieren das Paket mit `sudo apt-get install -y avahi-daemon`).*
   * **Verbindung vom PC herstellen**: Öffnen Sie ein Terminal auf Ihrem Computer und stellen Sie eine Verbindung über den Hostnamen oder die IP-Adresse des Boards her:
     ```bash
     ssh arduino@<hostname>
     # Oder direkt über die IP-Adresse:
     ssh arduino@<IP_ADRESSE>
     ```

### Schritt 2: Voraussetzungen installieren
Installieren Sie die Java-Laufzeitumgebung (`default-jre-headless`), Audio-Dienstprogramme (`espeak-ng`, `alsa-utils`), `chromium` und die Fensterverwaltung (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Hinweis: Unter Debian heißt das Browserpaket `chromium` anstelle von `chromium-browser`, und `default-jre-headless` stellt die standardmäßige OpenJDK-Laufzeitumgebung bereit. Das Dienstprogramm `wmctrl` wird vom Kiosk-Dienst verwendet, um sicherzustellen, dass Race Coordinator AI den Fensterfokus gegenüber Desktop-Autostart-Apps wie Arduino App Lab behält).*

Überprüfen Sie, ob `arduino-cli` installiert ist:
```bash
arduino-cli version
```
*(Falls `arduino-cli` nicht vorinstalliert ist, installieren Sie es über: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Schritt 3: Anwendungspaket & Systemd-Dienste installieren
Übertragen Sie `RaceCoordinatorAI-Linux-ARM64.tar.gz` von Ihrem Computer auf das Board:
```bash
# Vom Terminal Ihres Laptops:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Wählen Sie eine der folgenden Installationsmethoden:

#### Option A: Automatische schlüsselfertige Installation (Empfohlen)
Das automatische Installationsskript übernimmt die Überprüfung der Voraussetzungen, die Verzeichniseinrichtung, serielle Berechtigungen, die Systemd-Registrierung, das Flashen der Mikrocontroller-Firmware und den sofortigen Start mit Fehlerbehandlung:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```
*(Hinweis: Warnungen wie `tar: Ignoring unknown extended header...` sind harmlose macOS-Metadaten und können ignoriert werden).*

#### Option B: Manuelle Schritt-für-Schritt-Installation (Fallback)
Wenn Sie eine manuelle Steuerung bevorzugen oder Anpassungen vornehmen möchten:
1. **Anwendungsdateien nach `/opt/racecoordinatorai` entpacken**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Berechtigungen und Zugriff auf serielle Schnittstelle konfigurieren**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout arduino
   ```

3. **Systemd-Dienste installieren und registrieren**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

#### Bestehende Installation manuell aktualisieren (Aus heruntergeladenem Archiv)
Wenn Sie ein Release-Update heruntergeladen haben (z. B. `RaceCoordinatorAI-Linux-ARM64_*.tar.gz`, das über den Browser-Speichern-Dialog in `~/Downloads/` gespeichert oder manuell übertragen wurde), können Sie das Update mit einer der folgenden Methoden installieren:

##### Methode 1: Integriertes Update-Hilfsskript (Am schnellsten & Empfohlen)
Race Coordinator AI enthält ein automatisiertes Vor-Ort-Aktualisierungsskript, das das Release über `/opt/racecoordinatorai` entpackt, bei Bedarf die Mikrocontroller-Firmware neu kompiliert und hochlädt sowie die Dienste neu startet:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```

##### Methode 2: `install.sh` aus dem heruntergeladenen Paket entpacken und ausführen
```bash
# Heruntergeladenes Archiv entpacken
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Installer über bestehende Installation ausführen (Datenbank & Einstellungen bleiben erhalten)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Methode 3: Direkte manuelle Datei-Extraktion
Wenn Sie die Schritte lieber manuell durchführen möchten:
1. **Laufende Dienste stoppen**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Aktualisierte Dateien über `/opt/racecoordinatorai` entpacken**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
3. **Korrekte Dateiberechtigungen sicherstellen**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Mikrocontroller-Firmware neu flashen (falls der Sketch aktualisiert wurde)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Dienste neu starten**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
   ```

### Schritt 4: Mikrocontroller-Firmware flashen (mit FastLED-Unterstützung)
Kompilieren und laden Sie den Hardware-Sketch auf die integrierte MCU hoch:
```bash
# Erkannte Boards und Ports prüfen
arduino-cli board list

# Zephyr-Board-Core in arduino-cli installieren
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Erforderliche Arduino-Bibliotheken installieren (Uno Q Router-Bridge & FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# racecoordinatorai_sketch für die Uno Q MCU kompilieren
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Über die interne Netzwerkbrücke auf die integrierte MCU hochladen
# (Board-Passwort 'arduino' eingeben oder --upload-field password=arduino übergeben)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Hinweis: Wie über `arduino-cli board list` verifiziert, läuft auf dem Uno Q Mikrocontroller Zephyr OS über die interne Netzwerkbrücke `172.17.0.1` mit der FQBN `arduino:zephyr:unoq`. Die Bibliothek `Arduino_RouterBridge` wird für die serielle Kommunikation über die SoC-Brücke benötigt. FastLED-RGB-Lichtstreifen werden auf der STM32U5 / Zephyr Cortex-M33 Architektur aufgrund von Upstream-CMSIS-6-Registerdefinitionen derzeit nicht unterstützt, alle Kernfunktionen für die Rennstrecke—Rundensensoren, Sektorzeiten, Ruftasten und Bahnrelais—funktionieren jedoch einwandfrei).*

### Schritt 5: Dienste starten & Kiosk-Display starten
Starten Sie den Backend-Daemon und aktivieren Sie den Vollbild-TV-Kiosk:
```bash
# Backend-Server starten
sudo systemctl start racecoordinatorai

# Sie haben den Backend-Daemon bereits zuvor aktiviert.
# Aktivieren Sie nun den TV-Kiosk-Dienst für den grafischen Systemstart:
sudo systemctl enable racecoordinatorai-kiosk.service

# Vollbild-TV-Kiosk sofort starten
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Fensterfokus & Desktop-Autostart-Apps (z. B. Arduino App Lab)

Auf dem Arduino Uno Q startet Arduino Linux OS beim Desktop-Login standardmäßig „Arduino App Lab“.
- **Automatische Fokus-Beibehaltung**: Standardmäßig verwendet `start_kiosk.sh` das Dienstprogramm `wmctrl`, um Race Coordinator AI automatisch in den Vordergrund zu holen und den Fokus zu behalten, sodass die TV-Anzeige sofort rennbereit ist, ohne mit Maus oder Tastatur umschalten zu müssen.
- **Optional: App Lab beim Systemstart deaktivieren**: Bei einem dedizierten Rennbahn-Kiosk, bei dem Arduino App Lab beim Booten nicht benötigt wird, können Sie dessen Autostart-Eintrag deaktivieren:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
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

> [!TIP]
> Wenn Sie ein `.tar.gz`-Release-Archiv über den Link **Update herunterladen** im Browser heruntergeladen haben, finden Sie oben unter [Bestehende Installation manuell aktualisieren](#bestehende-installation-manuell-aktualisieren-aus-heruntergeladenem-archiv) Anweisungen zur Installation.

