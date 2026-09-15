# Rennen-Editor

## Kraftstoffeinstellungen

Race Coordinator AI unterstützt umfassende Kraftstoffsimulationen für analoge und digitale Strecken, einschließlich anpassbarer Tankkapazität, Startlevel, Boxenstoppverzögerungen, Auftankraten, Strafaktionen bei leerem Tank und Kraftstoffverbrauchsmodellen.

### Streckenkompatibilität und Auswahl des Kraftstoffsystems

Der Rennen-Editor bietet zwei dedizierte Konfigurationsbereiche für Kraftstoff: **Analoger Kraftstoff** und **Digitaler Kraftstoff**. Welches System verfügbar und aktiv ist, wird automatisch anhand der für das Rennen ausgewählten Strecke bestimmt:

- **Analoge Strecken**: Traditionelle Slotcar-Bahnen, bei denen Fahrzeuge direkt über die Spuren versorgt werden, ohne digitale Decoder oder Fahrzeugtelemetrie. Bei Auswahl einer analogen Strecke ist der Bereich **Analoger Kraftstoff** aktiviert und der Bereich **Digitaler Kraftstoff** wird automatisch deaktiviert.
- **Digitale Strecken**: Digitale Slotcar-Systeme (wie Carrera Digital, Scalextric Digital, Scorpius oder oXigen), bei denen die Schnittstelle digitale Telemetrie überträgt (Fahrzeug-ID, Gasstellung in Prozent, Boxengassensensoren). Bei Auswahl einer digitalen Strecke ist der Bereich **Digitaler Kraftstoff** aktiviert und der Bereich **Analoger Kraftstoff** wird automatisch deaktiviert.

---

### Analoge Kraftstoffsimulation

Analoger Kraftstoff simuliert den Verbrauch auf **Rundenbasis**. Da analoge Strecken Fahrzeuge erfassen, wenn sie die Start-/Ziellinie überqueren, wird der Kraftstoff bei jeder vollendeten Runde berechnet und abgezogen.

#### Konfigurationsoptionen

- **Analogen Kraftstoff aktivieren**: Hauptschalter für die analoge Kraftstofferfassung. Bei Deaktivierung läuft das Rennen ohne Kraftstoffbeschränkungen.
- **Verbrauchstyp**: Bestimmt die mathematische Kurve zur Berechnung des Verbrauchs basierend auf der Rundenzeit:
    - **Linear**: Der Kraftstoffverbrauch skaliert linear mit der Rundenzeit. Schnellere Runden verbrauchen mehr Kraftstoff, während doppelt so langsame Runden die Hälfte des Basiskraftstoffs verbrauchen.
    - **Quadratisch**: Der Verbrauch skaliert mit dem inversen Quadrat der Rundenzeit, wodurch sehr schnelle Runden stark bestraft werden.
    - **Kubisch**: Der Verbrauch steigt bei schnellen Runden steil an und bestraft aggressive Rekordjagden überproportional.
    - **Benutzerdefinierte Kurve**: Ermöglicht eine punktgenaue, interaktive Formung der Verbrauchskurve direkt auf dem SVG-Graphen.
- **Verbrauchsrate**: Die Grundmenge an Kraftstoffeinheiten, die pro Runde verbraucht wird, wenn der Fahrer genau die **Referenzzeit** fährt.
- **Referenzzeit (s)**: Die Basis-Richtzeit für Strecke und Fahrzeugklasse (in Sekunden).
    - Schnellere Runden (unter der Referenzzeit) verbrauchen mehr Kraftstoff.
    - Langsamere Runden (über der Referenzzeit) verbrauchen weniger Kraftstoff.
    - Der aktive Berechnungsbereich erstreckt sich von $0,5 \times \text{Referenzzeit}$ bis $1,5 \times \text{Referenzzeit}$.
- **Kapazität**: Das Gesamtvolumen des Kraftstofftanks in beliebigen Einheiten (z. B. 100).
- **Startlevel (%)**: Der prozentuale Füllstand des Tanks zu Beginn eines Laufs (z. B. 100 % für vollen Tank oder weniger bei Sprint-/Handicap-Läufen).
- **Auftankrate (%/s)**: Die Geschwindigkeit des Nachtankens während eines Boxenstopps, gemessen in Prozent der Gesamttankkapazität pro Sekunde.
- **Boxenstopp-Verzögerung (s)**: Die vorgeschriebene Standzeit in Sekunden, bevor das Auftanken nach dem Einfahren in die Boxengasse beginnt.
- **Kraftstoff bei Laufstart zurücksetzen**:
    - **Aktiviert**: Der Kraftstoffstand jedes Fahrers wird zu Beginn jedes Laufs auf das konfigurierte **Startlevel** zurückgesetzt.
    - **Deaktiviert**: Der verbleibende Kraftstoff wird laufübergreifend mitgenommen, was strategisches Haushalten über das gesamte Rennen erfordert.
- **Aktion bei leerem Tank**: Die Strafe, wenn einem Fahrer der Kraftstoff ausgeht (Füllstand erreicht 0):
    - **Runden nicht zählen**: Das Fahrzeug fährt weiter, aber Runden werden nicht gewertet, bis in der Box nachgetankt wird.
    - **Lauf beenden**: Der Lauf wird für den Fahrer sofort beendet, der Strom zur Spur wird abgeschaltet und der Fahrer wird als gewertet/ausgeschieden markiert.
    - **Power-Stottern (Power Stutter)**: Simuliert stotternden Motorlauf bei Spritmangel durch schnelles Ein- und Ausschalten des Bahnstroms.
        - *Erfordert Spur-Relais*: Nur verfügbar, wenn die Streckenschnittstelle über getrennte Relais pro Spur verfügt.
        - **Einschaltzeit (s)**: Dauer, die der Bahnstrom während jedes Impulses eingeschaltet bleibt.
        - **Ausschaltzeit (s)**: Dauer, die der Bahnstrom während jedes Impulses ausgeschaltet bleibt.

#### Boxenstopps und Rennzeit bei analogem Kraftstoff

Damit die Standzeit beim Boxenstopp nicht fälschlicherweise als extrem langsame Runde interpretiert wird (was den Verbrauch fehlerhaft senken würde), erfasst Race Coordinator AI die **aufgelaufene Auftankzeit**. Die im Boxenstopp verbrachte Standzeit wird vor der Verbrauchsrechnung von der Rundenzeit abgezogen:

$$\text{Reine Rennzeit} = \text{Rundenzeit} - \text{Aufgelaufene Auftankzeit}$$

#### Diagrammvorschau (Analog)

- **Kraftstoffverbrauch pro Runde**: Zeigt den exakten Verbrauch über das gesamte Rundenzeitspektrum ($0,5 \times \text{Ref}$ bis $1,5 \times \text{Ref}$) an. Im Modus Benutzerdefinierte Kurve ermöglichen Griffe und Zurücksetzen-Schaltflächen sofortige Anpassungen.
- **Zeit bis Boxenstopp**: Zeigt die geschätzte Gesamtreisezeit (oder Runden) bis zum leeren Tank in Abhängigkeit von konstanten Rundenzeiten.

---

### Digitale Kraftstoffsimulation

Digitaler Kraftstoff simuliert den Verbrauch **kontinuierlich in Echtzeit** auf Basis von Gasstellungsdaten, die von digitalen Reglern und Decodern übertragen werden.

#### Kontinuierlicher gasabhängiger Verbrauch

Im Gegensatz zum analogen Kraftstoff wird der Verbrauch bei jedem empfangenen Telemetriepaket neu berechnet:

$$\text{Verbrauchter Kraftstoff} = \text{Verbrauch pro Sekunde} \times \Delta t$$

Fahrer, die gleichmäßig fahren oder vor Kurven vom Gas gehen, verbrauchen deutlich weniger Kraftstoff als Fahrer, die dauerhaft Vollgas geben.

#### Konfigurationsoptionen

- **Digitalen Kraftstoff aktivieren**: Hauptschalter für die digitale Kraftstofferfassung.
- **Verbrauchstyp**: Mathematisches Modell angewendet auf die Gasstellung ($0\,\%$ bis $100\,\%$):
    - **Linear**: Der Verbrauch skaliert direkt proportional zur Gasstellung.
    - **Quadratisch**: Der Verbrauch steigt im mittleren Gasbereich moderat und beschleunigt gegen Vollgas.
    - **Kubisch**: Hohe Gasstellungen verbrauchen exponentiell mehr Kraftstoff als Teillastfahrten.
    - **Benutzerdefinierte Kurve**: Ermöglicht individuelle Gas-Verbrauchs-Charakteristiken von 0 % bis 100 % Gas.
- **Verbrauchsrate**: Maximaler Verbrauch in Einheiten pro Sekunde bei **100 % Vollgas**.
- **Kapazität**, **Startlevel (%)**, **Auftankrate (%/s)**, **Boxenstopp-Verzögerung (s)**, **Kraftstoff bei Laufstart zurücksetzen**: Funktionsweise analog zum analogen Kraftstoff.
- **Aktion bei leerem Tank**:
    - **Runden nicht zählen**: Fahrzeug bleibt fahrbar, Runden werden bei leerem Tank jedoch nicht gezählt.
    - **Lauf beenden**: Fahrer scheidet bei leerem Tank sofort aus dem Lauf aus.

#### Diagrammvorschau (Digital)

- **Digitaler Kraftstoffverbrauch**: Trägt die Gasstellung ($0\,\%$ bis $100\,\%$) gegen den Verbrauch pro Sekunde auf.
- **Zeit bis Tank leer**: Trägt die Gasstellung gegen die verbleibenden Fahrsekunden bis zum leeren Tank auf.

---

### Interaktives Bearbeiten der benutzerdefinierten Kurve

Wenn **Benutzerdefinierte Kurve** als Verbrauchstyp (analog oder digital) ausgewählt ist, erscheinen Kontrollgriffe direkt auf der SVG-Verbrauchskurve:

- **Initiale Kurvengenerierung**: Beim ersten Wechsel zu Benutzerdefinierte Kurve werden die anfänglichen 5 Punkte ohne sichtbaren Sprung direkt von der aktiven Vorgabe (Linear, Quadratisch oder Kubisch) abgetastet.
- **Interaktives Drag-and-Drop**: Klicken und ziehen Sie jeden Punkt nach oben, unten, links oder rechts, um die Kurve anzupassen.
- **Erzwungene Monotonie**:
    - *Analoger Kraftstoff*: Schnellere Rundenzeiten verbrauchen immer mehr oder gleich viel Kraftstoff wie langsamere Rundenzeiten (monoton fallende Kurve). Das Ziehen ist so eingeschränkt, dass Punkte nicht invertiert werden können.
    - *Digitaler Kraftstoff*: Höhere Gasstellungen verbrauchen immer mehr oder gleich viel Kraftstoff wie niedrigere Gasstellungen (monoton steigende Kurve).
- **Punkte hinzufügen**: Klicken Sie auf die Kurvenlinie, um an der exakt interpolierten Position einen neuen Kontrollpunkt einzufügen.
- **Punkte löschen**: Klicken Sie mit der rechten Maustaste auf einen Zwischenpunkt, um ihn zu entfernen (mindestens 2 Endpunkte bleiben erhalten).
- **Vorgaben-Schaltflächen**: Setzen Sie die benutzerdefinierte Kurve über die Schaltflächen oberhalb des Diagramms schnell auf Linear, Quadratisch oder Kubisch zurück.
- **Hintergrund-Persistenz**: Wenn Sie von der benutzerdefinierten Kurve zu einer Vorgabe und später zurück wechseln, bleiben Ihre benutzerdefinierten Punkte im Hintergrund erhalten.
- **Autoritative Server-Berechnungen**: Der Server berechnet den Kraftstoffverbrauch während der Rennen mit demselben stückweise linearen Interpolationsalgorithmus, sodass UI-Vorschau und Rennausführung absolut identisch sind.
