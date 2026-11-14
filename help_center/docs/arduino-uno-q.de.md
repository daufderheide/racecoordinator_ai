# Arduino UNO Q Einrichtungsanleitung

Diese Anleitung erklärt, wie Sie **Race Coordinator AI (RC AI)** auf dem **Arduino UNO Q** Hybrid-Entwicklungsboard als eigenständige Hardware-Appliance einrichten.

---

## Hardware-Übersicht & Speichervarianten

Der **Arduino UNO Q** kombiniert einen 64-Bit-Linux-Einplatinencomputer (SBC) mit einem Echtzeit-Mikrocontroller auf einer einzigen Platine:

- **Linux-MPU (Qualcomm Cortex-A53 @ 2,0 GHz)**: Führt den Race Coordinator AI-Server, die SQLite-Datenbank, den Webclient-Server und den automatischen Updater aus.
- **Echtzeit-MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Verwaltet Runden-Sensor-Pin-Interrupts, Sektorzeiten, Ruftasten und Strecken-Leistungsrelais mit Sub-Millisekunden-Genauigkeit (Hinweis: Adressierbare FastLED-RGB-LEDs werden auf dieser Architektur nicht unterstützt).
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

### Schritt 1: Board vorbereiten & über Netzwerk verbinden

1. **Board einschalten** *(Flashen ist normalerweise nicht erforderlich)*:
   * Ihr Arduino Uno Q wird mit vorinstalliertem **Arduino Linux OS (Debian 12 arm64)** auf dem internen 32-GB-eMMC-Flash-Speicher geliefert. Schließen Sie das Board einfach an die Stromversorgung an, um das Betriebssystem zu starten.
   * *(Hinweis: Das Flashen eines Betriebssystem-Images ist nur erforderlich, wenn Sie ein beschädigtes System wiederherstellen oder einen vollständigen Werksreset durchführen möchten).*

2. **Netzwerkverbindung einrichten**:
   > [!IMPORTANT]
   > **Internetzugang nur während der Ersteinrichtung erforderlich**: Eine Netzwerkverbindung mit Internetzugang ist ausschließlich während dieser Ersteinrichtung erforderlich, um Pakete zu aktualisieren und Voraussetzungen herunterzuladen. Sobald die Einrichtung abgeschlossen ist, läuft Race Coordinator AI zu 100 % lokal und offline, ohne dass eine Internetverbindung erforderlich ist. Es bietet jedoch erhebliche dauerhafte Vorteile, das Board mit Ihrem lokalen Netzwerk verbunden zu lassen:
   > - **Automatische Software-Updates**: Laden Sie neue Race Coordinator AI-Versionen und Firmware-Updates direkt über die Weboberfläche herunter und installieren Sie diese.
   > - **Fernzugriff für Clients**: Rennleiter, Fahrer und Zuschauer können ihre Smartphones, Tablets oder Laptops über Ihr lokales Netzwerk direkt mit der Weboberfläche des Boards (`http://<hostname>:7070` oder `http://<IP_ADRESSE>:7070`) verbinden.

   * **WLAN-Einrichtung über den Einrichtungsassistenten**: Beim ersten Booten fordert der Einrichtungsassistent zur Konfiguration des drahtlosen Netzwerks auf. Wählen Sie Ihr WLAN-Netzwerk aus und geben Sie das Passwort ein.
   * **Alternative: WLAN über die Befehlszeile einrichten**: Wenn Sie das WLAN nicht über den Assistenten eingerichtet haben oder es manuell im Terminal konfigurieren möchten:
     ```bash
     # Verfügbare WLAN-Netzwerke auflisten:
     nmcli dev wifi list

     # Mit Ihrem WLAN-Netzwerk verbinden:
     sudo nmcli dev wifi connect "Ihre_SSID" password "Ihr_Passwort"
     ```
   * **Alternative: Kabelgebundenes Ethernet**: Schließen Sie einfach ein Ethernet-Kabel an das Board an (oder verwenden Sie einen USB-C-Ethernet-Adapter). Der Netzwerkadapter konfiguriert sich automatisch per DHCP.
   * **Hinweis zur Ersteinrichtung**: Die WLAN-Verbindung wird möglicherweise nicht sofort aktiv, und manuelle `nmcli`-Befehle können beim ersten Start gelegentlich temporäre Fehler anzeigen. Führen Sie in diesem Fall einfach `sudo reboot` aus. Nach dem Neustart initialisiert sich der WLAN-Adapter sauber und verbindet sich automatisch mit Ihrem konfigurierten WLAN-Netzwerk.
   * **Board- und Firmware-Updates durchführen**: Nach dem Neustart (oder wenn Sie vom System dazu aufgefordert werden) werden Sie möglicherweise gefragt, ob Sie verschiedene Pakete und Firmware-Komponenten auf dem Board aktualisieren möchten. Es wird dringend empfohlen, alle vorgeschlagenen Aktualisierungen zu akzeptieren und auszuführen, da die ab Werk installierte Firmware oft veraltet ist. Beachten Sie, dass diese anfängliche Aktualisierung einige Zeit in Anspruch nehmen kann (oft 5 bis 10+ Minuten, abhängig von der Netzwerkgeschwindigkeit); lassen Sie den Vorgang ungestört abschließen.

3. **SSH auf dem Board aktivieren & verbinden (Empfohlen)**:
   * Die Einrichtung des Boards ist über SSH von Ihrem Computer aus am einfachsten, da Sie Installationsbefehle direkt kopieren und einfügen können.
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
   * **Verbindung vom PC herstellen**:
     * **macOS**: Öffnen Sie das integrierte Programm **Terminal** oder **iTerm2** ([iterm2.com](https://iterm2.com/)) und stellen Sie eine Verbindung über die Befehlszeile her:
       ```bash
       ssh arduino@<hostname>
       # Oder direkt über die IP-Adresse:
       ssh arduino@<IP_ADRESSE>
       ```
     * **Windows**: Sie können die integrierte PowerShell oder Eingabeaufforderung (mit `ssh arduino@<hostname>` oder `ssh arduino@<IP_ADRESSE>`) verwenden oder einen grafischen SSH-Client wie **PuTTY** (Download unter [putty.org](https://www.putty.org/)) nutzen. Bei Verwendung von PuTTY:
       1. Geben Sie den Hostnamen oder die IP-Adresse des Boards in das Feld **Host Name (or IP address)** ein.
       2. Stellen Sie sicher, dass Port `22` und als Verbindungstyp **SSH** ausgewählt ist.
       3. Klicken Sie auf **Open**, bestätigen Sie beim ersten Verbinden den Host-Schlüssel und melden Sie sich als Benutzer `arduino` mit Ihrem Passwort an.

### Schritt 2: Voraussetzungen installieren
Installieren Sie die Java-Laufzeitumgebung (`default-jre-headless`), Audio-Dienstprogramme (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` und die Fensterverwaltung (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
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

##### Befehlszeilenoptionen
Das Installationsskript unterstützt optionale Befehlszeilenparameter zur Anpassung der Installation:

| Parameter | Beschreibung | Standard |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Board-Typ explizit festlegen. | Automatisch erkannt (`unoq` auf Uno Q) |
| `--user=<username>` | Linux-Benutzerkonto für Dienste und Dateiberechtigungen. | Automatisch über `$SUDO_USER` erkannt (Standard `arduino` auf Uno Q) |
| `--skip-sketch`, `--skip-mcu` | Kompilieren und Flashen der MCU-Firmware überspringen. | Firmware flashen (`false`) |
| `-v`, `--verbose` | Ausführliche Protokollierung aktivieren. | Standardausgabe (`false`) |
| `-h`, `--help` | Hilfe und Optionen anzeigen. | - |

##### Konfigurationsübersicht vor der Installation
Vor der Durchführung von Änderungen gibt das Skript eine Übersicht aus:
```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: unoq
   Resolution:      Auto-detected (/proc/device-tree/model: Qualcomm QRB2210...)
 Service Account:   arduino
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/arduino
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      COMPILE & UPLOAD to onboard Uno Q MCU (arduino:zephyr:unoq on 172.17.0.1)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

> [!NOTE] Download und Dauer des Zephyr-Board-Cores (~5 bis 10+ Minuten)
> Während der Ersteinrichtung lädt `arduino-cli` den **Zephyr-Board-Core (`arduino:zephyr`)** für die integrierte STM32U5 Cortex-M33 MCU herunter und entpackt ihn. Dieses Paket enthält das vollständige Zephyr-Echtzeitbetriebssystem, die ARM-Cross-Compiler-Toolchain und Hardwarebibliotheken (~500 MB+ Download und zehntausende Dateien).
>
> - **Geschätzte Dauer**: **5 bis 10+ Minuten** abhängig von Ihrer Internetverbindung und der eMMC-Schreibgeschwindigkeit. **Zeit für eine Kaffeepause!**
> - **Konsolenfortschritt**: Download- und Entpackungsfortschritte werden direkt im Terminal angezeigt. Wenn Sie zusätzliche Compiler- und Entpackungsdetails sehen möchten, führen Sie `sudo ./install.sh -v` aus.
> - **Überprüfung des Fortschritts über eine zweite Konsole / SSH**: Falls Sie befürchten, dass die Installation hängt, öffnen Sie eine zweite SSH-Sitzung (oder ein weiteres Terminal-Tab auf dem Uno Q) und führen Sie folgenden Befehl aus:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   Sie sehen direkt, dass `arduino-cli` aktiv CPU und I/O nutzt, während Pakete heruntergeladen und entpackt werden. Sie können auch die temporären Download-Dateien überprüfen:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

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
   sudo usermod -a -G dialout,audio arduino
   sudo loginctl enable-linger arduino
   systemctl --user enable --now speech-dispatcher.socket
   ```

3. **Systemd-Dienste installieren und registrieren**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Schritt 4: Mikrocontroller-Firmware flashen
Kompilieren und laden Sie den Hardware-Sketch auf die integrierte MCU hoch:
```bash
# Erkannte Boards und Ports prüfen
arduino-cli board list

# Zephyr-Board-Core in arduino-cli installieren
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Erforderliche Arduino-Bibliotheken installieren (Uno Q Router-Bridge)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# racecoordinatorai_sketch für die Uno Q MCU kompilieren
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Über die interne Netzwerkbrücke auf die integrierte MCU hochladen
# (Board-Passwort 'arduino' eingeben oder --upload-field password=arduino übergeben)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Hinweis: Wie über `arduino-cli board list` verifiziert, läuft auf dem Uno Q Mikrocontroller Zephyr OS über die interne Netzwerkbrücke `172.17.0.1` mit der FQBN `arduino:zephyr:unoq`. Die Bibliothek `Arduino_RouterBridge` wird für die serielle Kommunikation über die SoC-Brücke benötigt. Beachten Sie, dass das Ausführen von `arduino-cli core install arduino:zephyr` ~500 MB+ herunterlädt und 5 bis 10+ Minuten für das Entpacken auf dem eMMC-Speicher benötigt (holen Sie sich einen Kaffee, während es entpackt; den Fortschritt können Sie mit `top -p $(pgrep arduino-cli)` in einem zweiten Terminal prüfen). FastLED-RGB-Lichtstreifen werden auf der STM32U5 / Zephyr Cortex-M33 Architektur aufgrund von Upstream-CMSIS-6-Registerdefinitionen derzeit nicht unterstützt, alle Kernfunktionen für die Rennstrecke—Rundensensoren, Sektorzeiten, Ruftasten und Bahnrelais—funktionieren jedoch einwandfrei).*

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

## Bestehende Installation aktualisieren { #updating-an-existing-installation }

Sobald Race Coordinator AI auf Ihrem Arduino Uno Q eingerichtet ist und ausgeführt wird, können Sie die Software bei neuen Versionen, Fehlerbehebungen und Firmware-Verbesserungen problemlos aktualisieren. Wählen Sie je nachdem, ob Ihr Board mit dem Netzwerk verbunden ist oder komplett offline an der Rennbahn betrieben wird, die passende Aktualisierungsmethode:

- **[Aktualisierung mit aktiver Netzwerkverbindung (Empfohlen)](#aktualisierung-mit-einer-netzwerkverbindung)**: Vollautomatische Hintergrund-Updates, die direkt in der Weboberfläche konfiguriert werden.
- **[Aktualisierung ohne Netzwerkverbindung (Offline über USB)](#aktualisierung-ohne-netzwerkverbindung)**: Übertragen eines Release-Archivs über einen USB-Stick und lokale Installation auf dem Board.

---

### Aktualisierung mit einer Netzwerkverbindung { #aktualisierung-mit-einer-netzwerkverbindung }

Wenn Ihr Arduino Uno Q mit Ihrem lokalen Netzwerk und dem Internet verbunden ist (über WLAN oder Ethernet), können Sie automatische Updates im Hintergrund direkt über die Weboberfläche von Race Coordinator AI nutzen:

1. **Automatische Updates in der Weboberfläche aktivieren**:
   - Navigieren Sie in Race Coordinator AI zu **Optionen → Automatische Updates** im Renntag-Setup oder in der oberen Menüleiste.
   - Wählen Sie Ihren bevorzugten Release-Kanal:
     - **🟢 Offizielle / Produktions-Releases**: Vollständig validierte, stabile Versionen, empfohlen für den regulären Rennbetrieb und Club-Events, bei denen maximale Betriebsstabilität an erster Stelle steht.
     - **🟡 Beta-Releases**: Funktionsvollständige Vorschauversionen, die während aktiver Entwicklungszyklen für Community-Tests und Praxistests auf der Rennstrecke veröffentlicht werden. Empfohlen, um neue Funktionen vor dem offiziellen Release zu testen und Feedback zu geben.
     - **🔵 Tägliche Alpha-Builds**: Automatisierte tägliche Builds aus dem Entwicklungszweig mit den neuesten experimentellen Funktionen.
   - Eine ausführliche Erklärung der Funktionsweise der Release-Kanäle und wie Versionen befördert werden, finden Sie im Abschnitt [Release-Kanäle & Automatische Updates](downloads.de.md#release-channels) im Help Center.

2. **Wie automatische Updates auf dem Arduino Uno Q funktionieren**:
   Wenn ein Update für Ihren konfigurierten Kanal verfügbar ist:
   - **Download im Hintergrund**: Das Board lädt das neue Linux-ARM64-Paket (`RaceCoordinatorAI-Linux-ARM64*.tar.gz`) im Hintergrund herunter, ohne aktive Rennläufe zu unterbrechen.
   - **Dienste neu starten**: Der Updater entpackt die neue Version über `/opt/racecoordinatorai` und startet `racecoordinatorai.service` (sowie die Kiosk-Anzeige) nahtlos über `systemctl` neu.
   - **MCU-Sketch-Synchronisierung**: Falls das Update Änderungen an der Echtzeit-Mikrocontroller-Firmware (`racecoordinatorai_sketch.ino`) enthält, kompiliert der Updater den Sketch automatisch neu und flasht die Firmware über die interne Netzwerkbrücke mit `arduino-cli` auf den STM32-Mikrocontroller.
   - Alle Rennhistorien, Bahnkonfigurationen, benutzerdefinierten Layouts, Fahrerlisten und Ihre SQLite-Datenbank bleiben vollständig erhalten.

3. **Manuelle Update-Prüfung**:
   Auch wenn automatische Hintergrund-Updates deaktiviert oder auf manuelle Prüfung eingestellt sind, können Sie jederzeit über den Menüpunkt **Nach Updates suchen** in der Weboberfläche eine sofortige Prüfung auslösen.

---

### Aktualisierung ohne Netzwerkverbindung { #aktualisierung-ohne-netzwerkverbindung }

Wenn Ihr Arduino Uno Q an der Rennbahn komplett offline ohne Internetverbindung betrieben wird, können Sie die Installation ganz einfach manuell über einen Standard-USB-Stick aktualisieren.

#### Schritt 1: Update-Paket per USB-Stick auf das Board übertragen

1. **Release-Paket auf einem verbundenen PC herunterladen**:
   Laden Sie auf einem Computer mit Internetzugang (Mac, Windows oder Linux) über das [Download- & Release-Portal](downloads.de.md) oder die [GitHub Releases](https://github.com/daufderheide/racecoordinator_ai/releases) das Linux-ARM64-Paket herunter:
   - Dateiformat: `RaceCoordinatorAI-Linux-ARM64.tar.gz` (oder versioniert als `RaceCoordinatorAI-Linux-ARM64_v*.tar.gz`).
2. **Auf einen USB-Stick kopieren**:
   Kopieren Sie die heruntergeladene `.tar.gz`-Datei auf einen Standard-FAT32- oder exFAT-formatierten USB-Stick.
3. **USB-Stick am Uno Q einstecken**:
   Stecken Sie den USB-Stick in einen freien USB-Port des Arduino Uno Q.
4. **Datei auf das Board kopieren**:
   - **Über die Desktop-Oberfläche**: Öffnen Sie den Dateimanager auf dem Uno Q-Desktop, wählen Sie den eingehängten USB-Stick in der Seitenleiste aus und kopieren Sie die `.tar.gz`-Datei in Ihren Ordner `~/Downloads/` (oder das Home-Verzeichnis `~/`).
   - **Über das Terminal / SSH**: Das System bindet USB-Speichermedien automatisch unter `/media/arduino/<DRIVE_NAME>` ein (oder manuell via `sudo mount /dev/sda1 /mnt`). Kopieren Sie das Archiv in Ihr lokales Verzeichnis:
     ```bash
     cp /media/arduino/*/RaceCoordinatorAI-Linux-ARM64*.tar.gz ~/Downloads/
     ```
     *(Falls Ihr Laptop über ein Netzwerkkabel oder einen lokalen WLAN-Router ohne Internet direkt mit dem Board verbunden ist, können Sie die Datei alternativ per `scp` übertragen: `scp RaceCoordinatorAI-Linux-ARM64*.tar.gz arduino@<hostname>:~/Downloads/`).*

#### Schritt 2: Update anwenden

Sobald sich das `.tar.gz`-Archiv auf dem Board befindet (z. B. in `~/Downloads/`), wählen Sie eine der folgenden drei Methoden zur Installation des Updates:

##### Option 1: Integriertes Update-Hilfsskript (Am schnellsten & Empfohlen)
Race Coordinator AI enthält ein schlüsselfertiges Vor-Ort-Aktualisierungsskript unter `/opt/racecoordinatorai/scripts/update_app.sh`. Es stoppt automatisch die aktiven Dienste, entpackt das Release über `/opt/racecoordinatorai`, kompiliert und flasht die MCU-Firmware bei Bedarf neu, setzt die Dateiberechtigungen und startet alle Dienste wieder:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```
*(Alle Datenbankeinträge, Renndaten, benutzerdefinierten UI-Layouts und Einstellungen bleiben automatisch erhalten).*

##### Option 2: `install.sh` aus dem Update-Paket entpacken und ausführen
Sie können das heruntergeladene Release-Paket in ein temporäres Verzeichnis entpacken und das mitgelieferte `install.sh` ausführen. Das Installationsskript erkennt die bestehende Installation in `/opt/racecoordinatorai`, aktualisiert die Programmdateien, flasht die Mikrocontroller-Firmware und startet die systemd-Dienste neu:
```bash
# Heruntergeladenes Archiv entpacken
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Installer über bestehende Installation ausführen (Datenbank & Einstellungen bleiben erhalten)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Option 3: Manuelle Aktualisierung über Linux-Befehle (Ohne Hilfsskripte)
Wenn Sie das Update vollständig manuell ohne Skripte durchführen möchten, führen Sie folgende Befehle im Terminal aus:

1. **Laufende Dienste stoppen**:
     ```bash
     sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
     ```
2. **Aktualisierte Dateien über `/opt/racecoordinatorai` entpacken**:
     ```bash
     sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
     ```
     *(Hinweis: Dadurch werden Programmdateien, Weboberfläche und Skripte aktualisiert, während Ihre SQLite-Datenbank und benutzerdefinierten Medien unberührt bleiben).*
3. **Dateiberechtigungen und Eigentümerschaft sicherstellen**:
     ```bash
     sudo chown -R arduino:arduino /opt/racecoordinatorai
     ```
4. **Mikrocontroller-Firmware neu kompilieren und flashen (falls der Sketch aktualisiert wurde)**:
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

## FastLED- & RGB-LED-Unterstützung (Nicht unterstützt auf Uno Q)

> [!WARNING] Adressierbare FastLED-RGB-LEDs auf der Uno Q MCU nicht unterstützt
> Adressierbare RGB-LED-Lichtstreifen (WS2812B, NeoPixel, SK6812, APA102 usw.), die über **FastLED gesteuert werden, werden auf dem integrierten Mikrocontroller des Arduino Uno Q nicht unterstützt**. Die Echtzeit-MCU des Uno Q verwendet eine STM32U585-Architektur unter Zephyr OS (CMSIS 6), für die in der Upstream-FastLED-Bibliothek die Low-Level-Register- und Bit-Banging-Timing-Unterstützung fehlt. Dementsprechend deaktiviert der Race Coordinator AI-Sketch (`racecoordinatorai_sketch.ino`) FastLED (`WITH_FAST_LED`) beim Kompilieren für die Uno Q MCU explizit.

### Verfügbare Beleuchtungsalternativen

Wenn Sie visuelle Beleuchtungsanzeigen auf einem Arduino Uno Q-Setup wünschen, haben Sie zwei Möglichkeiten:

1. **Standard-Digitalausgangs-LEDs**: Einfarbige LEDs (z. B. rote, gelbe oder grüne Standard-LEDs, die über digitale Ausgangspins mit Vorwiderständen, Transistoren oder Relais angesteuert werden) können in Race Coordinator AI weiterhin auf der Uno Q MCU als Standard-Bahnruf- oder Statusanzeigen konfiguriert werden.
2. **Dedizierter sekundärer Arduino für FastLED-RGB-LEDs (Empfohlen für RGB-Streifen)**: Wenn Sie unbedingt adressierbare RGB-LED-Lichtstreifen für mehrstufige Startampel-Countdowns, Boxengassen-Tankanzeigen und Zielflaggen-Siegesanimationen verwenden möchten, können Sie einen **zweiten Arduino** anschließen, der ausschließlich für die Ansteuerung der RGB-LEDs zuständig ist.

> [!TIP] Verwendung eines zweiten Arduino für FastLED-RGB-LEDs
> Die **Multi-Interface-Architektur** von Race Coordinator AI unterstützt das gleichzeitige Anschließen und Betreiben mehrerer Hardware-Controller an derselben Rennstrecke:
> 
> - **Primäres Interface (Integrierte Uno Q MCU)**: Übernimmt die zeitkritischen Rennsignale—optische Rundenzählsensoren, Sektorzeiten, Fahrer-Ruftasten und Hauptbahnstrom-Relais—mit Sub-Millisekunden-Präzision.
> - **Sekundäres Interface (Zweiter Arduino über USB)**: Schließen Sie ein kostengünstiges Standard-Arduino-Board (wie einen **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** oder **ESP32**) an einen der USB-Host-Ports des Uno Q an. Laden Sie den Standard-`racecoordinatorai_sketch.ino` (auf dem FastLED aktiviert ist) auf dieses zweite Board hoch.
> - **Konfiguration im Strecken-Editor**: Navigieren Sie in der Race Coordinator AI-Weboberfläche zum **Strecken-Editor** $\rightarrow$ **Hardware-Schnittstellen** und klicken Sie auf **Schnittstelle hinzufügen**, um den seriellen Port des zweiten Arduino (z. B. `/dev/ttyUSB0` oder `/dev/ttyACM0`) hinzuzufügen. Konfigurieren Sie Ihre FastLED-Lichtketten auf dieser zweiten Schnittstelle. Race Coordinator AI synchronisiert und steuert beide Boards während der Rennen automatisch gleichzeitig.

---

## Text-to-Speech (TTS) & Audio-Fehlerbehebung

Race Coordinator AI nutzt die Web Speech API des Browsers (`window.speechSynthesis`), um Rundenzeiten, Rennereignisse und Fahrerkommentare anzusagen. Im Gegensatz zu Windows oder macOS verfügt Linux (Debian 12 auf dem Uno Q) über keinen integrierten Sprachsynthesizer, sodass Chromium auf **Speech Dispatcher** und **eSpeak NG** angewiesen ist.

### Erforderliche Pakete
Das automatisierte Installationsskript (`install.sh`) installiert diese Pakete automatisch. Wenn Sie eine manuelle Installation durchgeführt haben oder TTS keinen Ton ausgibt, stellen Sie sicher, dass die erforderlichen Sprach- und Audiopakete installiert sind:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Kiosk-Browser-Flags & Multi-Tab-Navigation
Im Kiosk-Display-Modus wird Chromium über `/opt/racecoordinatorai/scripts/start_kiosk.sh` gestartet. Race Coordinator AI verwendet `--start-maximized` (anstelle des abgesperrten `--kiosk`), damit sekundäre Tabs – wie z. B. Laufergebnisse, Rennergebnisse, Design-Ansichten und das Offline-Hilfecenter – über die Tableiste am oberen Bildschirmrand sichtbar und umschaltbar bleiben. Chromium benötigt zudem spezifische Flags, um Speech Dispatcher und die unaufgeforderte Audiowiedergabe zu aktivieren, sowie `--test-type`, um Warnhinweise auf nicht unterstützte Flags zu unterdrücken. Stellen Sie sicher, dass Ihre `start_kiosk.sh` Folgendes enthält:
```bash
  --start-maximized \
  --test-type \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Wenn Sie `start_kiosk.sh` manuell anpassen, starten Sie den Kiosk-Dienst anschließend neu: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Schritte zur Fehlerbehebung
1. **Betriebsmodus & Audioausgabe überprüfen**:
   - **Kiosk-Display-Modus**: Die Audioausgabe erfolgt direkt vom Uno Q über die USB-C-DisplayPort/HDMI-Verbindung zu Ihrem Fernseher/Monitor oder über angeschlossene USB-Lautsprecher.
   - **Entfernter Netzwerk-Client**: Wenn Sie Race Coordinator AI von einem Laptop, Tablet oder Smartphone über das lokale Netzwerk (`http://<hostname>:7070`) aufrufen, werden Audio und TTS über **den Browser und die Lautsprecher dieses Geräts** wiedergegeben, nicht über das Uno Q-Board.
2. **Hardware-Audioausgabe überprüfen**:
   Führen Sie im Uno Q-Terminal einen Tontest durch, um zu prüfen, ob die Audioausgabe aktiv und nicht stummgeschaltet ist:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Falls kein Ton zu hören ist, öffnen Sie `alsamixer` im Terminal und stellen Sie sicher, dass die Schieberegler für Master/PCM/HDMI nicht stummgeschaltet (`[MM]`) sind (mit Taste `M` umschalten) und die Lautstärke angehoben ist.
3. **Sprachsynthesizer über die Befehlszeile testen**:
   Prüfen Sie, ob eSpeak NG und Speech Dispatcher auf Betriebssystemebene funktionieren:
   ```bash
   # Reines eSpeak testen
   espeak-ng "Testing speech synthesis"

   # Speech Dispatcher testen (Chromiums Schnittstelle)
   spd-say "Testing speech dispatcher"
   ```
   Falls `spd-say` einen Fehler ausgibt oder hängt, starten Sie den Daemon neu: `pkill -f speech-dispatcher && spd-say "Hello"`.
   Stellen Sie sicher, dass der Speech Dispatcher-Socket und das Benutzer-Lingering aktiviert sind:
   ```bash
   systemctl --user enable --now speech-dispatcher.socket
   sudo loginctl enable-linger arduino
   ```
4. **In der Weboberfläche testen**:
   Öffnen Sie in der Weboberfläche von Race Coordinator AI **Benutzeroberfläche anpassen** (oder **Design-Editor** $\rightarrow$ **Audio-Einstellungen**). Überprüfen Sie das Dropdown-Menü **TTS-Stimme** – dort sollten die installierten Stimmen aufgeführt sein. Klicken Sie auf **TTS-Stimme testen**, um die Wiedergabe zu bestätigen.

