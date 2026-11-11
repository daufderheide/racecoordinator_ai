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
# Oder für detaillierte ausführliche Ausgabe:
# sudo ./install.sh -v
```
*(Hinweis: Warnungen wie `tar: Ignoring unknown extended header...` sind harmlose macOS-Metadaten und können ignoriert werden).*

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
Im Kiosk-Display-Modus wird Chromium über `/opt/racecoordinatorai/scripts/start_kiosk.sh` gestartet. Race Coordinator AI verwendet `--start-maximized` (anstelle des abgesperrten `--kiosk`), damit sekundäre Tabs – wie z. B. Laufergebnisse, Rennergebnisse, Design-Ansichten und das Offline-Hilfecenter – über die Tableiste am oberen Bildschirmrand sichtbar und umschaltbar bleiben. Chromium benötigt zudem spezifische Flags, um Speech Dispatcher und die unaufgeforderte Audiowiedergabe zu aktivieren. Stellen Sie sicher, dass Ihre `start_kiosk.sh` Folgendes enthält:
```bash
  --start-maximized \
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
4. **In der Weboberfläche testen**:
   Öffnen Sie in der Weboberfläche von Race Coordinator AI **Benutzeroberfläche anpassen** (oder **Design-Editor** $\rightarrow$ **Audio-Einstellungen**). Überprüfen Sie das Dropdown-Menü **TTS-Stimme** – dort sollten die installierten Stimmen aufgeführt sein. Klicken Sie auf **TTS-Stimme testen**, um die Wiedergabe zu bestätigen.

---

## Automatische Software-Updates

Wenn eine Verbindung zu WLAN besteht, prüft Race Coordinator AI GitHub Releases automatisch:
1. **App-Update**: Lädt das neue Linux-ARM64-Paket im Hintergrund herunter.
2. **Neustart des Dienstes**: Startet `racecoordinatorai.service` über systemd nahtlos neu.
3. **MCU-Sketch-Synchronisierung**: Flasht die Firmware des STM32-Mikrocontrollers automatisch neu mit `arduino-cli`, wenn `racecoordinatorai_sketch.ino` aktualisiert wurde.

> [!TIP]
> Wenn Sie ein `.tar.gz`-Release-Archiv über den Link **Update herunterladen** im Browser heruntergeladen haben, finden Sie oben unter [Bestehende Installation manuell aktualisieren](#bestehende-installation-manuell-aktualisieren-aus-heruntergeladenem-archiv) Anweisungen zur Installation.

