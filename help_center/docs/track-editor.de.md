# Strecken-Editor

Der **Strecken-Editor** ist die zentrale Konfigurationsoberfläche zur Modellierung Ihrer physischen Slotcar-Rennstrecke, zur Anpassung von Spuren, Abmessungen und Farben sowie zur Einrichtung der Kommunikation mit Ihrer Zeitmess-Hardware, Relais, Sensoren und Lichtsystemen.

Race Coordinator AI verfügt über eine fortschrittliche Multi-Interface-Architektur, mit der mehrere Zeitmess- und Steuerungs-Controller (wie Arduino, Trackmate, Phidget oder BART) gleichzeitig auf einer einzigen Strecke betrieben werden können.

---

## Übersicht & Automatisches Speichern

Der Strecken-Editor ist in zwei synchronisierte Arbeitsbereiche unterteilt:

- **Linkes Panel (Allgemeine Strecken- & Spureigenschaften)**: Konfigurieren Sie Streckenbezeichnung, Sektorenanzahl, Maßstab sowie individuelle Spureigenschaften (Abmessungen, Reihenfolge und Farben). Am unteren Rand dieses Panels können neue Hardware-Schnittstellen hinzugefügt werden.
- **Rechtes Panel (Hardware-Schnittstellen & Interaktive Tests)**: Konfigurieren Sie angeschlossene Hardware-Controller, weisen Sie physische Pins und Kanäle den Streckenfunktionen zu, richten Sie adressierbare RGB-LED-Streifen ein und testen Sie Sensoren sowie Relais in Echtzeit.

Alle Änderungen im Strecken-Editor werden **automatisch validiert und in Echtzeit gespeichert**. Wird eine ungültige Konfiguration festgestellt (z. B. ein leerer oder doppelter Streckenname oder ein fehlender Pflicht-Pin), wird das Speichern vorübergehend angehalten und optische Warnhinweise heben die zu korrigierenden Felder hervor.

---

## Allgemeine Streckenkonfiguration

Im oberen Bereich des Strecken-Editors legen Sie die grundlegenden Eigenschaften Ihres Streckenlayouts fest:

### Streckenname (Track Name)
Die eindeutige Bezeichnung Ihrer Rennstrecke in der Datenbank von Race Coordinator AI. Jede Strecke muss einen unverwechselbaren Namen tragen.

### Anzahl der Streckenabschnitte (Number of Track Sections)
Definiert die Anzahl der Segmente, in die Ihre Strecke unterteilt ist. Diese Einstellung erfüllt zwei wichtige Funktionen:

1. **Teilrundenwertung bei Laufende**:
   - Der Standardwert **100** entspricht einer prozentualen Aufteilung, mit der Rennleiter Teilrunden auf zwei Nachkommastellen genau erfassen können (z. B. $14{,}65$ Runden), basierend auf der Position, an der ein Fahrzeug am Ende eines Zeitlaufs stoppt.
   - Wenn Sie physische Streckenmarkierungen oder Markierungspunkte entlang Ihrer Bahn angebracht haben, tragen Sie hier die exakte Anzahl der Markierungen ein (z. B. 20 Markierungen auf einer 18-Meter-Strecke). Nach dem Lauf notieren die Streckenposten die letzte passierte Markierungsnummer jedes Fahrzeugs.
2. **Zwischenzeit- / Sektorenmessung**:
   - Wenn Schnittstellen mit Zwischenzeit- bzw. Sektorensensoren ausgestattet sind, bestimmt dieser Wert die logische Sektorenaufteilung des Layouts.

### Streckenmaßstab (Track Scale)
Wählen Sie den Maßstab Ihrer Rennstrecke aus dem Dropdown-Menü:

- **1:1 (Originalgröße)**
- **Maßstab 1:24** (Große kommerzielle Slotcars / Hartplastik-Karosserien)
- **Maßstab 1:32** (Standard-Club- und Heimbahnen, Carrera, Scalextric, Policar)
- **Maßstab 1:43** (Kompakte analoge und digitale Bahnen)
- **Maßstab 1:64 (HO)** (HO-Slotcars, AFX, Auto World, Tyco)

!!! info "Maßstabsberechnete Geschwindigkeiten"
    Race Coordinator AI nutzt den **Streckenmaßstab** zusammen mit der individuellen **Spurlänge**, um authentische Modellgeschwindigkeiten (in km/h oder mph) auf Telemetrie-Bildschirmen, Fahrerstand-Anzeigen und in XLS-Exporten anzuzeigen.

---

## Spurkonfiguration (Lane Configuration)

Im Bereich **Spur-Editor (Lane Editor)** passen Sie die Geometrie, Startaufstellung und Farbgebung jeder Spur an.

```
+---------------+-------------------+--------------------+-------------------+
| Sortieren / X |  Spur # & Länge   |  Hintergrundfarbe  |  Schriftfarbe     |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Rot ]       |     [ Weiß ]      |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ Weiß ]       |     [ Schwarz ]   |
|  [::]   [X]   |  #3  [ 52.00 ] ft |      [ Blau ]      |     [ Weiß ]      |
|  [::]   [X]   |  #4  [ 53.75 ] ft |      [ Gelb ]      |     [ Schwarz ]   |
+---------------+-------------------+--------------------+-------------------+
```

### Spuren hinzufügen und löschen
- **Spur hinzufügen (`+`)**: Klicken Sie auf **`+`** im Kopfbereich des Spur-Editors, um eine neue Spur anzuhängen. Race Coordinator AI wählt automatisch passende Standard-Kontrastfarben aus.
- **Spur löschen (`X`)**: Klicken Sie auf das rote **`X`** neben einer Spur, um diese zu entfernen. Alle Hardware-Schnittstellen passen ihre Pin-Zuordnungen automatisch an.

### Spuranordnung per Drag-and-Drop
Greifen Sie das Griff-Symbol (**`::`**) links neben einer Spur, um sie in der Startaufstellung nach oben oder unten zu ziehen. Die Neuanordnung aktualisiert sofort Rotationspläne, Fahrerstand-Zuweisungen und Ranglisten.

### Spurlänge (Fuß / Meter)
Geben Sie die physische Mittellinienlänge jeder Spur in **Fuß (ft)** ein.

Auf Rennstrecken ohne Spurausgleichskreuzungen sind Innenspuren kürzer als Außenspuren. Die Eingabe exakter Längen für jede einzelne Spur stellt sicher, dass:
- Geschwindigkeitsberechnungen (km/h) für jede Spur exakt stimmen.
- Runden- und Verbrauchsdaten die tatsächlich zurückgelegte Distanz widerspiegeln.

!!! tip "Umrechnung Meter in Fuß"
    Wenn Sie Ihre Bahn in Metern gemessen haben, rechnen Sie wie folgt um:
    
    $$\text{Länge (Fuß)} = \text{Länge (Meter)} \times 3{,}28084$$
    
    $$(1\text{ Fuß} = 0{,}3048\text{ Meter})$$

### Spurfarben (Hintergrund- & Schriftfarbe)
Für jede Spur stehen zwei Farbwähler zur Verfügung:

- **Hintergrundfarbe**: Die primäre Kennfarbe der Spur (z. B. Rot, Weiß, Blau, Gelb, Orange, Grün, Lila, Schwarz). Wird auf allen Bildschirmen, Fahrerstand-Kacheln und Ranglisten verwendet.
- **Schriftfarbe / Vordergrund**: Die Kontrastfarbe für Text und Ziffern auf der Spurfarbe (z. B. weißer Text auf rotem Grund, schwarzer Text auf gelbem Grund).

!!! note "Hardware-Farbsynchronisation"
    Das Ändern der Hintergrundfarbe einer Spur synchronisiert sich automatisch mit konfigurierten Arduino FastLED-Streifen und passt Statusleuchten sowie Tankstandsanzeigen an Ihre echten Streckenfarben an.

---

## Hardware-Schnittstellen-Architektur

Race Coordinator AI unterstützt den gleichzeitigen Anschluss mehrerer Hardware-Systeme.

### Multi-Interface-Betrieb
Sie können unterschiedliche Controller auf derselben Strecke kombinieren:
- Nutzen Sie ein **Trackmate**-Board für hochpräzise optische Rundenzählung und die Bahnstrom-Hauptabschaltung.
- Schließen Sie gleichzeitig einen **Arduino** mit dem Race Coordinator AI Sketch an, um adressierbare FastLED RGB-Startampeln, Boxenstopp-Füllstandsanzeigen und Gelbflaggen-Blinker anzusteuern.
- Integrieren Sie ein **Phidget**-Digital-I/O-Modul für Bahnruftasten, Boxensensoren oder Sektorzeiten.

### Schnittstellen-Reiter & Schnellnavigation
Im rechten Panel finden Sie am oberen Rand Tabs für jede konfigurierte Schnittstelle. Ein Klick auf einen Tab scrollt direkt zum entsprechenden Konfigurationsbereich.

### Live-Verbindungsstatus
Jede Schnittstellenkarte besitzt eine gut sichtbare Statusanzeige:

| Statusanzeige | Bedeutung | Maßnahme |
| :--- | :--- | :--- |
| **Verbunden** (Grün) | Aktive Kommunikation hergestellt; Daten fließen in beide Richtungen. | Bereit für Rennen und interaktive Tests. |
| **Keine Daten** (Gelb/Orange) | Gerät am Port erkannt, aber kein Datenstrom oder Heartbeat. | Baudrate, USB-Kabel oder Sketch-Version prüfen. |
| **Getrennt** (Grau / Rot) | Hardware nicht gefunden, Port belegt oder Stromversorgung fehlt. | COM-Port-Auswahl, USB-Verbindung und Stromversorgung prüfen. |

---

## Unterstützte Hardware-Schnittstellen

### 1. Arduino-Schnittstelle

Die **Arduino**-Schnittstelle ist die flexibelste und am weitesten verbreitete Lösung in Race Coordinator AI. Mit einem Arduino Uno, Mega oder kompatiblen Mikrocontroller steuern Sie Rundenzählung, Bahnstromrelais, Chaostasten, Sektorzeitmessung, analoge Gas-Telemetrie und adressierbare FastLED RGB-Beleuchtung.

#### Board-Typen
- **Arduino Uno**: Ideal für 2- bis 4-spurige Bahnen. Bietet 14 digitale Pins (Pins 2–13) und 6 analoge Eingänge (A0–A5).
- **Arduino Mega 2560**: Empfohlen für 6- bis 8-spurige Strecken, Zwischenzeitmessungen mit mehreren Sektoren oder umfangreiche RGB-LED-Installationen. Bietet 54 digitale Pins (Pins 2–53) und 16 analoge Eingänge (A0–A15).

#### Verbindung & Firmware-Kompatibilität
- **Serieller COM-Port**: Wählen Sie den USB-COM-Port Ihres Betriebssystems aus.
- **Baudrate**: Schnelle serielle Übertragung (Standard `115200` Baud).
- **Sketch-Kompatibilität**:
    - **Race Coordinator AI Sketch (`v2.1.0.x`)**: Unterstützt alle modernen Funktionen wie adressierbare FastLED RGB-LEDs, Spannungsteiler und erweiterte Telemetrie.
    - **Klassischer Race Coordinator 1.0 Sketch (`v1.0.0.x`)**: Vollständig abwärtskompatibel für Rundenzählung, Relais und Chaostasten. Bei Verbindung mit einem Legacy-Sketch werden die FastLED-Optionen mit einem Hinweistext deaktiviert.

#### Entprellzeit / Debounce ($\mu\text{s}$)
Konfiguriert die Entprellzeit der Eingangspins in **Mikrosekunden** ($1\text{ ms} = 1000\,\mu\text{s}$). Signalwechsel innerhalb dieses Zeitfensters werden als Rauschen ignoriert.

- Optische Infrarot- oder Fototransistor-Sensoren: **100 bis 500 $\mu\text{s}$**.
- Mechanische Reed-Kontakte oder Dead Strips: **1000 bis 5000 $\mu\text{s}$**.

#### Invertierungs-Optionen (Ruhestrom / Normally Closed)
- **Ruhestrom-Spursensoren (Normally Closed Lane Sensors)**: Aktivieren, wenn Sensoren im Ruhezustand High liefern und beim Durchfahren eines Fahrzeugs auf Low fallen (typisch für Lichtschranken und IR-Sensoren). Bei Dead Strips oder Reed-Kontakten bleibt diese Option in der Regel deaktiviert.
- **Ruhestrom-Relais (Normally Closed Relays)**: Wenn aktiviert, zieht das Relais an, um den Bahnstrom zu unterbrechen. Dies stellt sicher, dass die Bahn auch bei ausgeschaltetem PC mit Strom versorgt bleibt.

#### Rundenpin-Boxenverhalten (Lap Pin Pit Behavior)
Ermöglicht es den Start/Ziel-Sensoren, bei Tankrennen als Boxenstopp-Erkennung zu dienen:
- **Keine (None)**: Reine Rundenzählung.
- **Boxeneinfahrt (Pit In)**: Sensor löst den Tankvorgang aus.
- **Boxenausfahrt (Pit Out)**: Sensor beendet den Tankvorgang.
- **Einfahrt/Ausfahrt (Pit In/Out)**: Erste Auslösung startet das Auftanken; nach Verlassen der Box zählt die nächste Durchfahrt wieder als reguläre Rennrunde.

#### Pin-Zuweisungen (Digital & Analog)
Jeder Pin kann einer bestimmten Funktion zugewiesen werden:
- **Rundenzählung**: Runden-Sensor pro Spur.
- **Stromsteuerung**: Hauptrelais (Master Relay) und Einzelspur-Relais (Lane Relays).
- **Rennkontrolle**: Gesamt-Bahntaste (Track Call) und fahrerspezifische Chaostasten.
- **Zeitmessung & Boxen**: Sektor-Zwischenzeitsensoren sowie dedizierte Boxen-Ein-/Ausfahrt-Sensoren.
- **RGB-Beleuchtung**: Datenleitung für adressierbare LED-Streifen.

!!! tip "Interaktive Hardware-Tests"
    Neben jedem Pin befindet sich eine **Live-Statusanzeige**:
    - **Eingänge (Sensoren/Taster)**: Das Auslösen eines Sensors lässt die Anzeige für 500 ms grün aufleuchten.
    - **Ausgänge (Relais)**: Durch Anklicken der Anzeige schalten Sie das physische Relais testweise ein und aus.

#### Spannungsteiler & Gas-Telemetrie (Voltage Dividers)
Über analoge Spannungsteiler an den Fahrstromleitern kann die Gashebelstellung in Echtzeit gemessen werden:
- **Live-Anzeige**: Zeigt den aktuellen Rohwert ($0\text{--}1023$) des Reglers.
- **Maximalspannung (Max Voltage)**: Kalibrierung des Werts für 100% Vollgas.
- **„Max auf Anzeige setzen“**: Übernimmt den maximal gemessenen Ausschlag direkt als Kalibrierwert.
- **Spuren koppeln (Link Lanes)**: Synchronisiert die Kalibrierung über alle Spuren hinweg.

#### Adressierbare FastLED RGB-Beleuchtung
Unterstützung für digitale LED-Streifen (WS2812B, NeoPixel, WS2811, SK6812):
1. **Streifen-Konfiguration**: Pin zuweisen, Anzahl der LEDs angeben, Helligkeit ($0\text{--}255$), Blinkrate und Farbreihenfolge (`GRB`, `RGB`, etc.) einstellen.
2. **LED-Funktionszuweisung**:
   - **Startampel (Start Lights)**: Mehrstufiger Countdown, Grüne Startphase, Rote Frühstart-Warnung.
   - **Flaggenstatus (Flag Status)**: Grün (Rennen aktiv), Gelb blinkend (Chaos/Unterbrechung), Rot/Kariert (Lauf beendet).
   - **Spurstatus / Strom**: Leuchtet in Spurfarbe bei aktivem Bahnstrom, erlischt bei Stromabschaltung.
   - **Tank-Balkenanzeige**: Füllt sich als Lichtbalken während des Auftankens und leuchtet grün bei 100%.
   - **Führenden-Anzeige (Heat Leader)**: Zeigt die Farbe des aktuell im Lauf Führenden.
   - **Rundenblitzer (Lap Flasher)**: Blinkt bei jeder Zieldurchfahrt in der jeweiligen Spurfarbe auf.

---

### 2. Trackmate-Schnittstelle

Unterstützt kommerzielle Trackmate-Zeitmesskarten über serielle Schnittstellen (USB oder RS-232 COM-Port).

- **Serieller Port**: Auswahl des COM-Ports.
- **Entprellfilter (Stufen 1–4)**: Hardware-Entprellung gegen Doppelauslösungen bei Hochgeschwindigkeits-Slotcars (Stufe 2 oder 3 empfohlen).
- **Normally Closed Logik**: Invertierung für Infrarot-Lichtschranken und Relaisschaltungen.
- **Einzelspur-Relais (Per-Lane Relays)**: Aktivieren, wenn eine Relaiskarte mit separater Abschaltung jeder einzelnen Spur installiert ist.
- **8 Sensorkanäle**: Freie Zuweisung der 8 Hardwarekanäle zu Spuren oder Boxensensoren.
- **Relaistest**: Schalten Sie Haupt- und Einzelrelais direkt per Mausklick in der Benutzeroberfläche.
- **Chaostaste (Call Button)**: Separater Eingang mit Live-Statusanzeige.

---

### 3. Phidget-Schnittstelle

Integration industrieller Phidgets USB- und VINT-Module (z. B. PhidgetInterfaceKit 0/16/16, 8/8/8, 1014 Relais und VINT-Hubs).

- **Automatische Geräteerkennung**: Module werden automatisch über Seriennummer und Hub-Port erkannt.
- **Digitale Eingänge**: Optisch isolierte Eingänge für Rundensensoren, Chaostasten und Sektormessung mit Live-Pulsanzeige.
- **Digitale Ausgänge / Relais**: Robuste Ausgänge zur Steuerung von Bahnstromrelais und externen Alarmsirenen.
- **Analoge Eingänge**: Anschluss von Spannungssensoren zur Gasüberwachung.
- **Invertierungslogik**: Unabhängige Polaritätseinstellung für Sensoren und Relais.

!!! warning "Phidget22-Treiber erforderlich"
    Für Phidget-Hardware müssen die offiziellen **Phidget22**-Systemtreiber auf dem Rechner installiert sein. Fehlen diese, zeigt Race Coordinator AI einen Hilfedialog mit Download-Hinweisen an.

---

### 4. BART-Schnittstelle (Policar Bluetooth Timer)

Drahtlose Anbindung an Policar BART Bluetooth Low Energy (BLE) Zeitmessbrücken und Transponder-Sensoren.

- **Kabellose BLE-Erkennung**: Automatischer Scan nach Bluetooth-LE-Geräten in Reichweite ohne COM-Port-Konfiguration.
- **Hardware-Kanäle (bis zu 32)**: Dynamische Kanalzuordnung zu Spuren und Boxensensoren.
- **Mindestrundenzeit-Filter (ms)**: Hardwareseitiger Schwellenwert gegen Prellen und Fehlauslösungen.
- **Kanalaktivitäts-Anzeige**: Bestätigt optisch jede Sensordurchfahrt in Echtzeit.

---

### 5. Demo- / Simulations-Schnittstelle

Für Tests von Rennformaten, Rotationen, Themes, Audioansagen und Leaderboards ohne angeschlossene Hardware steht der **Demo-Modus** bereit.

- **Realistische Rennsimulation**: Der Server generiert Rundenzeiten, Rennschwankungen und simulierte Boxenstopps basierend auf den konfigurierten Spuren.
- **Keine Einrichtung erforderlich**: Funktioniert sofort auf jeder Strecke.

---

## Editor-Bedienung & Symbolleiste

- **Rückgängig (`Ctrl+Z`) / Wiederholen (`Ctrl+Y`)**: Schritthafte Wiederherstellung aller Spur-, Farb- und Pin-Änderungen.
- **Als Neu speichern (Strecke duplizieren)**: Erstellt eine Kopie der aktuellen Strecke unter neuem Namen, ideal zum Testen alternativer Einstellungen.
- **Geführte Tour**: Klick auf das Fragezeichen (**`?`**) startet einen interaktiven Rundgang über alle Elemente der Seite.

---

## Fehlersuche & Häufige Hardware-Fragen

### Bahnstrom invertiert (Relais schaltet falsch herum)
- **Symptom**: Strom ist da bei Gelbphase, schaltet aber bei Grün ab.
- **Lösung**: Aktivieren oder deaktivieren Sie die Option **Ruhestrom-Relais (Normally Closed Relays)**.

### Dauertanken im Tankrennen
- **Symptom**: Fahrzeuge beginnen sofort ununterbrochen zu tanken.
- **Lösung**: Ändern Sie die Einstellung **Ruhestrom-Spursensoren (Normally Closed Lane Sensors)**.

### Doppelauslösungen oder verpasste Runden
- **Lösung**: Entprellzeit (Debounce) erhöhen (bei Doppelauslösungen) bzw. verringern (bei verpassten Runden schneller Fahrzeuge) und Lichtschrankenausrichtung prüfen.

### FastLED RGB-Streifen leuchten nicht
- **Lösung**: Sicherstellen, dass der offizielle **Race Coordinator AI Sketch (`v2.1.0.x`)** geladen ist, LED-Typ und Farbreihenfolge stimmen und das externe 5V-Netzteil eine gemeinsame Masseverbindung (GND) mit dem Arduino hat.
