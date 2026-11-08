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

### Mikrocontroller-Resets & Brownouts {: #microcontroller-brownout-resets }

- **Symptom**: Während eines Rennens oder Trainings erscheint ein Warnbanner auf dem Renntag-Bildschirm: *"Mikrocontroller-Reset erkannt: Der Schnittstellen-Mikrocontroller wurde während des Betriebs unerwartet zurückgesetzt."* Ein Klick auf **Details** öffnet einen Dialog mit Schnittstellenname, Reset-Anzahl und dem Zeitstempel des letzten Resets. Treten in einer Sitzung mehrere Resets auf, weist ein Hinweistext auf häufige Resets hin.
- **Was gemeldet wird**: Die Zeitnahme-Schnittstelle (z. B. Arduino Uno, Nano, Mega oder ein kompatibler USB-Mikrocontroller) hat einen unerwarteten Hardware-Reset oder Brownout erlitten. Dies bedeutet, dass der Prozessor des Mikrocontrollers einen vorübergehenden Spannungseinbruch oder eine elektrische Störspitze erfahren hat, wodurch die interne Hardware-Reset-Leitung oder die Brown-Out-Detection (BOD)-Schaltung ausgelöst wurde.

#### Was in Race Coordinator AI (RMS) geschieht
Wenn ein Mikrocontroller während des Rennbetriebs unerwartet zurückgesetzt wird:
1. **Bootloader & Handshake**: Der Mikrocontroller startet neu und sendet einen Identifikations-Handshake sowie Status-Pings an Race Coordinator AI.
2. **Automatische Zustandswiederherstellung**: Race Coordinator AI erkennt, dass das Board bereits verbunden und aktiv war. Anstatt das Rennen abzubrechen, konfiguriert das RMS den Mikrocontroller umgehend neu: Eingangs-Pins werden zugewiesen, Polaritäten (Active-High/Active-Low) gesetzt, Entprellzeiten angewendet und Relaiszustände entsprechend dem aktuellen Heat-Status (z. B. Bahnstrom AN) wiederhergestellt.
3. **Schutzschild-Zeitfenster (250 ms)**: Beim Starten eines Arduinos können digitale Eingänge kurzzeitig schweben oder Standardzustände melden, bevor sie sich stabilisieren. Race Coordinator AI aktiviert unmittelbar nach einem unerwarteten Reset ein 250-ms-Schutzfenster. Während dieses Fensters werden statische Pin-Meldungen gefiltert, um Fehlrundenzählungen, Phantom-Rundenzeiten oder versehentliche Rennunterbrechungen durch Start-Störsignale zu verhindern.
4. **Auswirkungen auf das Rennen — Mögliche verpasste Runden**:
    - Obwohl Race Coordinator AI die Verbindung automatisch wiederherstellt und den Bahnstrom ohne Abbruch des Heats reaktiviert, ist der Mikrocontroller während des Hardware-Neustarts, Bootloader-Ablaufs und Handshakes (in der Regel 200–500 Millisekunden) **vollständig blind für Sensoreingaben**.
    - **Jedes Slotcar, das während dieses Reset-Fensters eine Lichtschranke, Dead-Strip oder einen Reedschalter überquert, wird NICHT registriert, was zu verpassten Runden führt.**
    - Treten Resets wiederholt auf, werden Rundenzählung und Rennergebnisse verfälscht, und die Fahrer können kurze Stromunterbrechungen bemerken.

#### Häufige Ursachen
*Hinweis: Die nachfolgend genannten Ursachen stellen die häufigsten Probleme bei Slotcar-Bahnen dar. Jede Bahninstallation ist jedoch individuell, und es können weitere elektrische oder mechanische Einflussfaktoren vorliegen.*

1. **Induktive Relais-Rückschläge (Gegen-EMK-Spitzen)**:
    - **Die häufigste Ursache für Mikrocontroller-Brownouts im Slotcar-Sport.**
    - Bahnstrom-Relais enthalten elektromagnetische Spulen. Wenn ein Relais bei einer Rennunterbrechung oder am Heat-Ende abschaltet, erzeugt das zusammenbrechende Magnetfeld der Spule eine massive induktive Spannungsspitze (Gegen-EMK von mehreren hundert Volt).
    - Verfügt das Relaismodul über keine ausreichende Freilaufdioden-Schutzschaltung oder teilt es sich Masse/Stromversorgung direkt mit dem Arduino, gelangt diese Hochspannungsspitze direkt in den Mikrocontroller und löst dessen Brown-Out-Detection (BOD) oder einen CPU-Absturz aus.
2. **Verdrahtung von Bahnabschaltungstastern & lange Leitungsantennen**:
    - Taster rund um die Bahn erfordern oft lange ungeschirmte Leitungen (3 bis 15+ Meter).
    - Diese langen Leitungen wirken wie Antennen und fangen starke elektromagnetische Interferenzen (EMI) von Motoren, Schleiferfunken und Schienenübergängen ein.
    - Das Betätigen oder Loslassen mechanischer Taster ohne externe Pull-up-Widerstände oder RC-Entprellung kann Spannungstransienten direkt auf die Eingangspins übertragen.
3. **Spannungseinbrüche auf dem 5V-USB-Bus**:
    - Mikrocontroller benötigen stabile 4,5 V bis 5,2 V für einen zuverlässigen Betrieb.
    - Wird der Arduino an einem passiven USB-Hub, einem Front-USB-Port mit langem Innenkabel oder einem stark belasteten USB-Controller betrieben, kann die Spannung kurzzeitig unter die Abschaltschwelle (BOD) fallen (typischerweise 2,7 V oder 4,3 V) und einen sofortigen Reset erzwingen.
4. **Elektromagnetische Störungen durch Bahnstrom (EMI)**:
    - Slotcar-Motoren ziehen hohe Ströme und erzeugen Bürstenfeuer zwischen Schleifern und Leitern.
    - Laufen Sensorkabel, Tasterleitungen oder der Mikrocontroller parallel zu Bahnstromkabeln oder regelbaren Netzteilen, können induktive und kapazitive Kopplungen Spannungsspitzen in die Zeitnahme-Elektronik einkoppeln.
5. **Gemeinsame 230V-Stromkreise & mangelnde Entkopplung**:
    - Werden Zeitnahme-PC, Bahnnetzteil, Reifenschleifmaschinen oder Werkzeuge an derselben Steckdosenleiste ohne Netzfilter betrieben, können Netztransienten über das PC-Netzteil auf den USB-Bus gelangen.
6. **Elektrostatische Entladungen (ESD)**:
    - In trockenen Räumen erzeugen fahrende Autos auf Kunststoffschienen statische Aufladung. Berührt ein Streckenposten oder Fahrer einen Metalltaster oder Schienenleiter, kann die statische Entladung das Board zurücksetzen.

#### Mögliche Lösungsansätze

- **Freilaufdioden an allen Relaisspulen installieren**:
    - Löten Sie eine Standard-Gleichrichterdiode (z. B. **1N4001**, **1N4004** oder **1N4007**) in Sperrrichtung direkt über die DC-Anschlüsse jeder Relaisspule (Kathode/Ringseite an +DC, Anode an Masse/-DC). Dadurch wird die Gegen-EMK beim Abschalten des Relais sicher abgeleitet.
- **Optokoppler-Relaisplatinen mit getrennter Stromversorgung verwenden**:
    - Viele 5V-Relaismodule besitzen einen Jumper namens **JD-VCC / VCC / GND**.
    - Entfernen Sie den `JD-VCC`-Jumper. Verbinden Sie 5V und Signalpins des Arduinos mit der Steuerleiste, speisen Sie die Relaisspulen jedoch unabhängig über ein separates 5V-Steckernetzteil an `JD-VCC` und Relais-`GND` ein. Dies trennt den Relaisstromkreis galvanisch vom Arduino-USB-Bus.
- **Externe Pull-up-Widerstände & Entstörkondensatoren an Tastern nachrüsten**:
    - Verlassen Sie sich bei langen Leitungen nicht ausschließlich auf die schwachen internen Pull-ups des Arduinos (~20 kΩ–50 kΩ). Installieren Sie stattdessen **1 kΩ bis 4,7 kΩ externe Pull-up-Widerstände** zwischen Eingangspin und +5V direkt an der Arduino-Klemme.
    - Schalten Sie zusätzlich einen kleinen **0,1 µF (100 nF) Keramikkondensator** parallel zu den Tasteranschlüssen gegen Masse, um hochfrequente Einstreuungen und Kontaktschwingen abzufangen.
- **Einen aktiven USB-Hub mit eigenem Netzteil verwenden**:
    - Schließen Sie den Mikrocontroller an einen USB-Hub mit eigener 230V-Stromversorgung an, anstatt direkt an den PC oder Laptop. Ein aktiver Hub liefert stabile 5V unabhängig von der Rechnerauslastung.
- **Signalkabel räumlich von Bahnstromleitungen trennen**:
    - Führen Sie Sensorkabel (Infrarot, Licht, Reedschalter) und Tasterleitungen mindestens 15 bis 30 cm entfernt von stromführenden Bahnschienen und Netzteilkabeln.
    - Müssen sich Signal- und Bahnstromleitungen kreuzen, führen Sie diese im **90-Grad-Winkel** zueinander und nicht parallel.
- **Geschirmte verdrillte Leitungen (Twisted-Pair) verwenden**:
    - Verwenden Sie für längere Strecken geschirmte Netzwerkkabel (Cat5e/Cat6 STP) oder geschirmte Steuerleitungen. Schließen Sie den Schirmdraht nur einseitig am Arduino an Masse an.
- **Getrennte Stromkreise**:
    - Schließen Sie Bahnnetzteil und Zeitnahme-Computer an getrennte Steckdosen an oder nutzen Sie eine Steckdosenleiste mit Überspannungs- und Netzfilter.

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
