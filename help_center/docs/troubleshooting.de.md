# Fehlerbehebung

## Verbindungsprobleme

### USB-Schnittstellen-Ruhezustand & Verbindungsabbrüche zwischen den Heats (Selektives Energiesparen) {: #usb-sleep-prevention }
- **Symptom**: In den Pausen zwischen den Heats, beim Umsetzen der Spuren oder nach längerem Stillstand bricht die Verbindung zur Schnittstelle (Phidget, Arduino, Trackmate oder USB-Seriell-Adapter) ab. Sobald das nächste Rennen startet oder Autos die Sensoren auslösen, verbindet sich die Schnittstelle wieder und es erscheint der Hinweis: *"Schnittstelle verbunden: Die Verbindung zur Schnittstelle wurde wiederhergestellt."*
- **Ursache**: Moderne Betriebssysteme (Windows, macOS und Linux) verfügen über aggressive Energiesparmechanismen für USB-Controller und Human Interface Devices (HID). Obwohl Race Coordinator AI den Ruhezustand des Gesamtsystems verhindert, schaltet das Betriebssystem ungenutzte USB-Ports, USB-Root-Hubs und HID-Geräte bei Inaktivität selbstständig ab (USB Selective Suspend), wenn kurzzeitig keine Sensordaten übertragen werden.
- **Warum dies softwareseitig nicht automatisch abgeschaltet werden kann**: Das Hardware-Energiemanagement wird direkt vom Betriebssystem-Kernel gesteuert. Unter Windows erfordert das Ändern der Geräteeinstellungen Administratorrechte (UAC) und Eingriffe in geschützte Registrierungsschlüssel (`HKLM`). Anwendungen dürfen und können dies nicht ohne Weiteres eigenständig ändern, um Konflikte mit anderen Geräten (wie Tastaturen, Mäusen oder Bluetooth-Adaptern) zu vermeiden.
- **Lösung nach Betriebssystem**:

#### Windows 10 & Windows 11 (Empfohlene dauerhafte Lösung)

##### 1. Energiesparen für USB- und HID-Geräte im Geräte-Manager deaktivieren
1. Klicken Sie mit der rechten Maustaste auf das **Start**-Symbol (oder drücken Sie `Win + X`) und wählen Sie den **Geräte-Manager**.
2. Erweitern Sie die Kategorie **Eingabegeräte (Human Interface Devices)**:
    - Suchen Sie nach den **USB-Eingabegerät**-Einträgen Ihrer Schnittstelle.
    - Klicken Sie mit der rechten Maustaste auf den Eintrag, wählen Sie **Eigenschaften** und wechseln Sie zum Reiter **Energieverwaltung**.
    - **Deaktivieren Sie das Häkchen** bei *"Computer kann das Gerät ausschalten, um Energie zu sparen"* und bestätigen Sie mit **OK**.
3. Erweitern Sie die Kategorie **USB-Controller (Universal Serial Bus controllers)**:
    - Klicken Sie mit der rechten Maustaste auf jeden **USB-Root-Hub** und **Generischen USB-Hub**, wählen Sie **Eigenschaften** und wechseln Sie zur **Energieverwaltung**.
    - **Deaktivieren Sie das Häkchen** bei *"Computer kann das Gerät ausschalten, um Energie zu sparen"* und klicken Sie auf **OK**.
4. (Für Arduino / Seriell): Erweitern Sie **Anschlüsse (COM & LPT)**:
    - Klicken Sie mit der rechten Maustaste auf Ihren COM-Port (z. B. *Arduino Uno*, *USB-Seriell-Anschluss*), wählen Sie **Eigenschaften** und deaktivieren Sie im Reiter **Energieverwaltung** (falls vorhanden) die Option *"Computer kann das Gerät ausschalten, um Energie zu sparen"*.

##### 2. Selektives USB-Energiesparen in den Windows-Energieoptionen deaktivieren
1. Öffnen Sie die Windows-**Systemsteuerung** und navigieren Sie zu den **Energieoptionen** (oder drücken Sie `Win + R`, geben Sie `powercfg.cpl` ein und drücken Sie Enter).
2. Klicken Sie neben Ihrem aktiven Energiesparplan auf **Energiesparplaneinstellungen ändern**.
3. Klicken Sie auf **Erweiterte Energieeinstellungen ändern**.
4. Erweitern Sie **USB-Einstellungen** -> **Einstellung für selektives USB-Energiesparen**.
5. Setzen Sie die Einstellungen für **Auf Akku** und **Netzbetrieb** auf **Deaktiviert**.
6. Klicken Sie auf **Übernehmen** und **OK**.

---

#### Linux & Raspberry Pi OS

##### 1. Kernel-USB-Autosuspend deaktivieren
Standardmäßig schaltet der Linux-Kernel inaktive USB-Geräte nach 2 Sekunden ab:
- **Unter Ubuntu, Debian oder Linux Mint (GRUB)**:
    1. GRUB-Konfiguration bearbeiten: `sudo nano /etc/default/grub`.
    2. Fügen Sie `usbcore.autosuspend=-1` zu `GRUB_CMDLINE_LINUX_DEFAULT` hinzu.
    3. Aktualisieren und neu starten: `sudo update-grub && sudo reboot`.
- **Unter Raspberry Pi OS**:
    1. Boot-Konfigurationsdatei öffnen: `sudo nano /boot/firmware/cmdline.txt` (oder `/boot/cmdline.txt`).
    2. Fügen Sie `usbcore.autosuspend=-1` am Ende der Zeile an (alle Parameter müssen in einer einzigen Zeile bleiben).
    3. Speichern und neu starten: `sudo reboot`.

##### 2. Autosuspend per Udev-Regel deaktivieren (Alternative)
1. Neue Regeldatei anlegen: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Folgende Regel einfügen:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Regeln neu laden: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Energieeinstellungen**: Öffnen Sie **Systemeinstellungen** -> **Displays** -> **Erweitert...** (oder **Energie sparen**) und aktivieren Sie **"Automatisches Aktivieren des Ruhezustands bei ausgeschaltetem Display verhindern"**.
- **Aktive USB-Hubs mit Netzteil verwenden**: macOS kann passive USB-Hubs bei schwankender Last stromlos schalten. Schließen Sie Schnittstellen stets über einen aktiven USB-Hub mit eigener Stromversorgung an.

## Anzeigeprobleme


### Browserkompatibilität & Leerer Bildschirm auf älteren Geräten (Android < 9, ältere Windows-Systeme & Tablets) {: #browser-compatibility }
- **Symptom**: Beim Öffnen von Race Coordinator AI auf einem älteren Tablet (z. B. Android 4.4 KitKat bis Android 8 Oreo), älteren PC oder veralteten Browser bleibt der Bildschirm komplett leer oder zeigt die Warnung „Browser nicht unterstützt“.
- **Ursache**: Race Coordinator AI basiert auf modernem Angular und ECMAScript (ES2020+) unter Verwendung von CSS Grid, CSS Custom Properties (`var(--...)`), ES-Modulen und modernen JavaScript-APIs (einschließlich `BigInt`, `globalThis`, `queueMicrotask`, Optional Chaining `?.`, Nullish Coalescing `??` und privaten Klassenfeldern `#x`).
- **Betriebssystem- & Browser-Unterstützung**:

| Plattform | Unterstützte Versionen & Mindestbrowser | Status | Hinweise |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Aktuelles Google Chrome, Microsoft Edge, Mozilla Firefox | **Vollständig unterstützt** | Sofort einsatzbereit mit automatischen Browser-Updates. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 oder Mozilla Firefox 115 ESR | **Unterstützt** | Erfordert die letzten veröffentlichten Browserversionen (Chrome 109 / Firefox 115 ESR). Internet Explorer wird nicht unterstützt. |
| **Windows XP / Vista** | Offizielle Standard-Browser (Chrome 49, Firefox 52 ESR) | **Nur Server** | Standard-Browser unterstützen kein ES2020+ und können die Benutzeroberfläche nicht lokal ausführen. Der Java-Server (JRE 8) kann jedoch im Headless-Modus auf XP/Vista als Host für Tablets oder moderne PCs betrieben werden. |
| **Android** | Android 9.0+ mit modernem Google Chrome oder System WebView | **Unterstützt** | Google hat Updates für Android 8 und älter dauerhaft eingestellt. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Unterstützt** | Moderne WebKit-Engine mit voller ECMAScript-Unterstützung. |
| **macOS** | macOS 10.15 (Catalina) bis macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Unterstützt** | Vollständig kompatibel auf Intel- und Apple Silicon Macs. |
| **Linux** | Jede moderne Distribution mit Chrome, Chromium oder Firefox | **Unterstützt** | Beinhaltet Raspberry Pi OS 64-Bit und ARM64-Systeme. |

- **Lösung & Empfehlungen**:
  - **Einen unterstützten modernen Browser verwenden**: Verwenden Sie Google Chrome, Microsoft Edge, Mozilla Firefox oder Apple Safari auf einem unterstützten Betriebssystem (Android 9.0+, iOS 14+, Windows 7+, macOS oder Linux).
  - **Ältere Windows-Systeme (Win 7 / 8 / 8.1)**: Installieren Sie **Google Chrome 109** oder **Mozilla Firefox 115 ESR** anstelle des veralteten Internet Explorers.
  - **Kostengünstige moderne Tablets**: Preiswerte moderne Tablets (z. B. Amazon Fire HD 8/10 oder günstige Android-Tablets mit Android 11–14) unterstützen modernes Chrome und bieten die volle Leistung.
  - **Bildschirmübertragung / Remote Desktop**: Für ältere Tablets können Sie den Browser-Bildschirm des Host-Rechners über einen schlanken VNC- oder Remote-Desktop-Client (z. B. bVNC oder AnyDesk) anzeigen.
