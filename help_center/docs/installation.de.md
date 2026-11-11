# Installationsanleitung

Diese Anleitung führt Sie durch das Herunterladen, Installieren und Konfigurieren von Race Coordinator AI auf Ihrem Computer.

---

## Unterstützte Betriebssysteme

Race Coordinator AI ist vollständig plattformübergreifend und läuft auf modernen sowie älteren Betriebssystemen:

| Plattform | Unterstützte Versionen | Empfohlenes Installationsprogramm |
| :--- | :--- | :--- |
| **🪟 Windows (Modern)** | Windows 10, Windows 11 (64-Bit & 32-Bit) | **Online-Setup** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Legacy)** | Windows 8, Windows 7, Windows XP | **Offline-Vollsetup** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Erforderlich für Erstinstallation auf Win 8 und älter)* |
| **🍏 macOS** | macOS 10.15 (Catalina) bis macOS 15+ (Intel & Apple Silicon) | **Disk-Image** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64-Bit), Arduino Linux OS, Debian, Ubuntu | **ARM64 / Linux-Paket** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Auswahl des Release-Kanals

Race Coordinator AI wird über drei Kanäle bereitgestellt:

* **🟢 Offizielle stabile Versionen** *(Empfohlen)*: Vollständig getestete, produktionsreife Builds für den regulären Rennbetrieb, Heimbahnen und Clubveranstaltungen.
* **🟡 Beta-Vorschauversionen**: Vorabversionen mit kommenden Funktionen, neuen Hardwaretreibern und experimentellen Verbesserungen für Community-Tests.
* **🔵 Alpha / Nightly-Builds**: Automatische Entwicklungs-Snapshots aus der aktiven Entwicklung.

👉 Besuchen Sie das **[Download- & Versionsportal](downloads.de.md)**, um Versionen herunterzuladen oder das Versionsarchiv einzusehen.

---

## 🪟 Windows-Installation

### 1. Installationsprogramm herunterladen
* Für **Windows 10 / 11**: Laden Sie `RaceCoordinatorAI_Online_Setup_*.exe` herunter.
* Für **Windows 8 und älter** (oder PCs ohne aktive Internetverbindung): Laden Sie `RaceCoordinatorAI_Offline_Setup_*.exe` herunter.

### 2. Installationsprogramm ausführen
1. Doppelklicken Sie auf die heruntergeladene `.exe`-Datei.
2. Falls Windows SmartScreen den Hinweis *"Der Computer wurde durch Windows geschützt"* anzeigt, klicken Sie auf **Weitere Informationen** und dann auf **Trotzdem ausführen**.
3. Folgen Sie den Anweisungen des Inno Setup-Assistenten zur Auswahl des Installationsverzeichnisses (Standard: `C:\Program Files\RaceCoordinator AI`).
4. Wählen Sie aus, ob eine Desktop-Verknüpfung erstellt werden soll.
5. Klicken Sie auf **Installieren**, um die Einrichtung abzuschließen.

### 3. Starten
Doppelklicken Sie auf die Verknüpfung **Race Coordinator AI** auf Ihrem Desktop oder öffnen Sie die Anwendung über das Windows-Startmenü.

!!! note "Voraussetzungen für ältere Windows-Versionen (XP / 7 / 8)"
    Stellen Sie bei Windows 7, 8 oder XP sicher, dass das [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784) installiert ist.

---

## 🍏 macOS-Installation

### 1. Disk-Image herunterladen
Laden Sie `RaceCoordinator_Mac_*.dmg` von der Versionsseite herunter.

### 2. Im Programme-Ordner installieren
1. Doppelklicken Sie auf die heruntergeladene Datei `RaceCoordinator_Mac_*.dmg`, um das Disk-Image zu öffnen.
2. Ziehen Sie das Symbol **Race Coordinator AI** in Ihren Ordner **Programme** (Applications).
3. Werfen Sie das Disk-Image aus.

### 3. Erster Start & macOS-Sicherheit
1. Öffnen Sie Ihren Ordner **Programme** und doppelklicken Sie auf **Race Coordinator AI**.
2. Falls macOS die Meldung anzeigt, dass die App nicht geöffnet werden kann, weil sie von einem nicht verifizierten Entwickler stammt:
   - Öffnen Sie **Systemeinstellungen** → **Datenschutz & Sicherheit**.
   - Scrollen Sie nach unten zum Bereich **Sicherheit** und klicken Sie neben Race Coordinator AI auf **Dennoch öffnen**.
   - Alternativ halten Sie die `Control`-Taste gedrückt, während Sie auf das App-Symbol klicken, und wählen **Öffnen**.

---

## 🐧 Linux, Raspberry Pi & Arduino Uno Q Installation

Für eigenständige Hardware-Appliances mit automatisierten systemd-Hintergrunddiensten, Kiosk-Anzeigemodus und Hardware-Schnittstellen konsultieren Sie unsere speziellen Einrichtungsanleitungen:

* **[Arduino UNO Q Einrichtungsleitfaden](arduino-uno-q.de.md)**: Komplette Einrichtung für die Arduino Uno Q Dual-Core-Appliance mit integriertem STM32-Echtzeit-Mikrocontroller.
* **[Raspberry Pi Einrichtungsleitfaden (Experimentell)](raspberry-pi.de.md)**: Einrichtung für Raspberry Pi 4 / 5 in einer Zwei-Platinen-Architektur mit externem USB-Arduino-Mikrocontroller.

### 1. Linux-Paket herunterladen
Laden Sie `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` von der Versionsseite herunter.

### 2. Entpacken und Starten
1. Öffnen Sie ein Terminal und entpacken Sie das Archiv in das gewünschte Verzeichnis:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Stellen Sie sicher, dass das Startskript Ausführungsrechte besitzt:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Starten Sie die Anwendung:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Erster Start & Erste Schritte

Beim ersten Start von Race Coordinator AI:

1. **Standard-Datenbank**: Die Anwendung initialisiert automatisch eine integrierte SQLite-Datenbank (`racecoordinator.db`), die bereits Beispiel-Fahrer, Teams, eine standardmäßige 4-Spur-Bahn und Standard-Rennformate (Jeder-gegen-Jeden, Training) enthält.
2. **Tastatur-Demonstrationsmodus**: Sie können Rennmodi sofort über die Tastaturzeiterfassung testen, ohne physische Bahnhardware anzuschließen.
3. **Bahnsensoren konfigurieren**: Navigieren Sie zu **Bahn-Verwaltung** → **Bahn bearbeiten**, um Ihre Schnittstellen-Hardware einzurichten (Arduino Uno / Uno Q, Phidget, Trak-Mate oder Webcam-Zeiterfassung).

---

## Aktualisierung bestehender Installationen

Das Upgrade auf eine neuere Version von Race Coordinator AI ist nahtlos:

* **Ihre Daten bleiben erhalten**: Ihre Datenbank (`racecoordinator.db`), Rennstatistiken, Fahrerprofile, Bahnkonfigurationen und benutzerdefinierten Designs werden im Benutzeranwendungsdatenordner gespeichert und bei App-Updates **nicht** überschrieben.
* **Aktualisierung unter Windows**: Führen Sie einfach das neu heruntergeladene Installationsprogramm über die vorhandene Installation aus oder klicken Sie im In-App-Update-Banner auf **Jetzt installieren**.
* **Aktualisierung unter Linux / Arduino Uno Q / Raspberry Pi**: Führen Sie `sudo /opt/racecoordinatorai/scripts/update_app.sh /pfad/zu/RaceCoordinatorAI-Linux-ARM64*.tar.gz` aus oder entpacken Sie das Archiv und führen Sie `sudo ./install.sh` aus. Siehe den [Arduino UNO Q Leitfaden](arduino-uno-q.de.md#aktualisierung-einer-bestehenden-installation) oder den [Raspberry Pi Leitfaden](raspberry-pi.de.md#aktualisierung-einer-bestehenden-installation) für Schritt-für-Schritt-Anleitungen.

---

## Fehlermeldungen & Feedback

Wenn Sie während der Installation auf Probleme stoßen oder einen Funktionswunsch haben:

1. Besuchen Sie unser **[GitHub Issues Portal](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Durchsuchen Sie bestehende Tickets nach Lösungen oder Workarounds.
3. Klicken Sie auf **New Issue** und geben Sie folgende Informationen an:
   * Betriebssystem und Version.
   * Race Coordinator AI-Version (z. B. `v1.0.0` oder `v1.0.0-beta.1`).
   * Schritte zur Reproduktion sowie Screenshots/Logs, falls zutreffend.
