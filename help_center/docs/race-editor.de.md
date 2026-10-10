# Rennen-Editor

Der **Rennen-Editor** ist die zentrale Konfigurationsoberfläche zum Entwerfen, Konfigurieren und Testen Ihrer Slotcar-Rennformate, Wertungsregeln, Laufläufe, Kraftstoffsimulationen und Zeiteinstellungen.

---

## Übersicht & Automatisches Speichern

Der Rennen-Editor bietet eine einheitliche Oberfläche zur Auswahl, Anzeige, Konfiguration und zum Testen Ihrer Rennformate:

- **Rennenauswahl**: In der oberen Leiste neben dem Seitentitel listet dieses Dropdown-Menü alle konfigurierten Rennen auf und ermöglicht ein schnelles Wechseln.
- **Schreibgeschützter Modus**: Standardmäßig zeigt der Editor Renneigenschaften, Wertungsregeln und Einstellungen im schreibgeschützten Modus an. Formularfelder sind gesperrt, während Akkordeonbereiche und Laufvorschauen interaktiv bleiben.
- **Bearbeitungsmodus**: Ein Klick auf das **Bearbeiten**-Symbol (Stift) schaltet alle Eingabesteuerelemente frei. Während der Bearbeitung ist die Rennenauswahl gesperrt.
- **Kontinuierliche automatische Speicherung**: Alle Änderungen werden automatisch im Hintergrund auf dem Server gespeichert, ohne den Bearbeitungsmodus zu verlassen.
- **Bearbeitungsmodus beenden**: Ein Klick auf das **Fertig**-Symbol (Häkchen) validiert alle Änderungen und kehrt in den schreibgeschützten Modus zurück.
- **Änderungen verwerfen**: Ein Klick auf Verwerfen stellt die zuletzt gespeicherte Version wieder her und verlässt den Bearbeitungsmodus.

Der Arbeitsbereich ist in zwei synchronisierte Bereiche unterteilt:

- **Linkes Bedienfeld (Rennenkonfiguration)**: Allgemeine Renneigenschaften, Format, Wertungsmethoden, Rotationstyp, Gruppeneinstellungen und analoge/digitale Kraftstoffsimulation.
- **Rechtes Bedienfeld (Live-Laufvorschau)**: Generiert dynamisch die vollständige Liste der Läufe basierend auf dem aktiven Rotationstyp und der Fahreranzahl.

---

## Rennenkonfiguration & Optionen

### Rennenname & Streckenzuordnung
- **Rennenname**: Eindeutiger Name für das Rennformat.
- **Strecke**: Die zugeordnete Strecke bestimmt die Verfügbarkeit von analogem oder digitalem Kraftstoff.
- **Design**: Visuelles UI-Design für die Anzeige am Renntag.

### Lauflauf-Format
- **Rotationstyp**: Standard-Rotationen (**Round Robin**, **Leiter**, **Turnier**) oder benutzerdefinierte Sequenzen.
- **Laufdurchläufe**: Wie oft jeder Fahrer die komplette Laufrotation durchläuft.
- **Umgekehrte Läufe**: Dreht die Laufreihenfolge um.

### Wertungsoptionen
- **Laufwertung**: Abschluss nach Runden oder Zeit, Platzierungsmethode und Tiebreaker.
  - **Zielerlaubnis**: Legen Sie fest, wie Fahrzeuge ihre Runden beenden, wenn der Führende das Ziel erreicht oder die Zeit abläuft:
    - *Sofort beenden*: Lauf endet sofort bei Zielerreichung.
    - *Zu Ende fahren lassen*: Alle Fahrer fahren weiter, bis sie die Vorgaben erfüllen.
    - *Eine weitere Runde*: Fahrer dürfen ihre aktuelle Runde beenden; diese Runde zählt vollständig.
    - *Zieleinlauf nicht erlauben (Auto-Segmente)*: Lauf endet sofort und die Teilrundengutschrift wird aus der verstrichenen Zeit auf der aktuellen Runde geteilt durch die Median-Rundenzeit des Fahrers berechnet (`autoSegments = timeSinceLastLap / medianLapTime`, maximal 0,99).
    - *Eine weitere Runde (Auto-Segmente)*: Fahrer beenden ihre aktuelle Runde auf der Strecke; die Runde zählt nicht als volle Runde, sondern die Teilrundengutschrift wird aus der Rennzeit vor Laufende geteilt durch die Median-Rundenzeit des Fahrers berechnet (`autoSegments = partialLapTime / medianLapTime`, maximal 0,99).
  - **Auto-Segmente bei Pause**: Wenn aktiviert, werden Fahrer-Autosegmente beim Pausieren eines Laufs mit derselben Formel wie bei *Zieleinlauf nicht erlauben (Auto-Segmente)* angenähert. Diese Segmente schätzen ab, wo auf der Strecke die Fahrer angehalten haben, und werden beim Fortsetzen des Rennens wieder entfernt. Sie zählen nur dann zum Rundentotal, wenn der Lauf im pausierten Zustand beendet wird und eine Autosegment-Abschlussoption verwendet wird.
- **Gesamtwertung**: Ranglistenmethode, Tiebreaker-Regeln und Streichergebnisse.
- **Saisonwertung**: Punkteverteilung pro Position für Meisterschaften.

#### Runden- und Zeitanpassungen (Auswirkungen auf Ranglisten und Metriken)

Race Coordinator AI ermöglicht es Rennleitern, die Rundenanzahl und die Gesamtlaufzeit eines Fahrers während oder nach einem Lauf manuell anzupassen (durch Klicken auf Runden-/Zeitspalten, Tastaturkürzel oder über das Rennleiter-Menü). Da der Server als maßgebliche Quelle für alle Berechnungen dient, fließen manuelle Anpassungen deterministisch in Laufranglisten, Gesamtwertungen und Telemetriestatistiken ein:

- **Angepasste Runden (`userLaps`)**:
  - **Formel**: $\text{Bereinigte Rundenzahl} = \text{Physische Runden} + \text{Strafe-Runden} + \text{Benutzer-Runden} + \text{Auto-Segmente}$.
  - **Ranglisten**: Wenn die Wertungsmethode **Meiste Runden** ist, bestimmen die angepassten Runden direkt die Lauf- und Gesamtrangliste.
  - **Metriken**: Die physische Rundenanzahl bleibt unberührt (spiegelt tatsächliche Sensordurchfahrten wider). Durchschnittliche Rundenzeit ($\text{Gesamtzeit} / \text{Physische Runden}$), beste Rundenzeit und Median-Rundenzeit bleiben unbeeinflusst. Rundenabstände werden sofort aktualisiert.
- **Angepasste Zeit (`userTime`)**:
  - **Formel**: $\text{Bereinigte Gesamtzeit} = \sum (\text{Physische Rundenzeiten}) + \text{Benutzer-Zeit}$.
  - **Ranglisten**: Wenn die Wertungsmethode **Schnellste Gesamtzeit** ist, bestimmt die bereinigte Zeit direkt die Platzierung (geringere Zeit platziert weiter vorne). Bei Wertung nach **Meiste Runden** dient die bereinigte Zeit als primärer Tiebreaker für rundengleiche Fahrer. Die Gesamtwertung summiert die bereinigten Gesamtzeiten aller gewerteten Läufe.
  - **Metriken**: Die durchschnittliche Rundenzeit ($\text{Bereinigte Gesamtzeit} / \text{Physische Runden}$) wird direkt beeinflusst – das Hinzufügen von Strafzeit erhöht die durchschnittliche Rundenzeit (langsamere Pace). Abstandswerte (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`) werden neu berechnet, um den Zeitunterschied widerzuspiegeln.
  - **Geschützte Metriken**: **Beste Rundenzeit** und **Median-Rundenzeit** werden durch Zeitanpassungen **NICHT beeinflusst**. Die beste Rundenzeit repräsentiert strikt die schnellste einzelne physische Sensorrunde, und die Median-Rundenzeit stellt die statistische mittlere physische Rundenzeit dar.

| Metrik / Wertungsmerkmal | Angepasste Runden (`userLaps`) | Angepasste Zeit (`userTime`) |
| :--- | :--- | :--- |
| **Bereinigte Rundenzahl** | **Ändert sich direkt** ($\pm\text{Segmente}/\text{Runden}$) | Unverändert |
| **Physische Rundenanzahl** | Unverändert (nur tatsächliche Sensorrunden) | Unverändert (nur tatsächliche Sensorrunden) |
| **Lauf-Gesamtzeit** | Unverändert | **Ändert sich direkt** ($+ \text{userTime}$) |
| **Gesamtzeit (Rennen)** | Unverändert | **Ändert sich direkt** (summiert Laufzeiten) |
| **Rangliste (Meiste Runden)** | **Primärer Rankingfaktor** | **Tiebreaker-Faktor** (geringere Zeit gewinnt) |
| **Rangliste (Schnellste Gesamtzeit)** | Tiebreaker-Faktor | **Primärer Rankingfaktor** (geringere Zeit gewinnt) |
| **Durchschnittliche Rundenzeit** | Unverändert ($\text{Zeit} / \text{Physische Runden}$) | **Ändert sich direkt** ($\text{Bereinigte Zeit} / \text{Physische Runden}$) |
| **Beste Rundenzeit** | **Kein Einfluss** (schnellste physische Runde) | **Kein Einfluss** (schnellste physische Runde) |
| **Median-Rundenzeit** | **Kein Einfluss** (mittlere physische Runde) | **Kein Einfluss** (mittlere physische Runde) |
| **Abstände (`gapLeader`, `gapPosition`)** | Aktualisiert Rundenabstand | Aktualisiert Zeit- und Pace-Abstand |

### Zeiteinstellungen
- **Start- / Neustartverzögerung**: Countdown-Vorlaufzeit in Sekunden.
- **Minimale Rundenzeit**: Mindestrundenzeit zur Filterung von Fehlauslösungen.
- **Driftzeit**: Sensor-Auslösefenster für driftende Fahrzeuge über die Ziellinie.
- **Hinter Sensor starten**: Erzwingt den Start hinter dem Zielsensor in Runde null.

## Kraftstoffeinstellungen

Race Coordinator AI unterstützt umfassende Kraftstoffsimulationen für analoge und digitale Strecken, einschließlich anpassbarer Tankkapazität, Startlevel, Boxenstoppverzögerungen, Auftankraten, Strafaktionen bei leerem Tank und Kraftstoffverbrauchsmodellen.

### Streckenkompatibilität und Auswahl des Kraftstoffsystems

Der Rennen-Editor bietet zwei dedizierte Konfigurationsbereiche für Kraftstoff: **Analoger Kraftstoff** und **Digitaler Kraftstoff**. Welches System verfügbar und aktiv ist, wird automatisch anhand der für das Rennen ausgewählten Strecke bestimmt:

- **Analoge Strecken**: Traditionelle Slotcar-Bahnen, bei denen Fahrzeuge direkt über die Spuren versorgt werden, ohne digitale Decoder oder Fahrzeugtelemetrie. Bei Auswahl einer analogen Strecke ist der Bereich **Analoger Kraftstoff** aktiviert und der Umschalter für **Digitalen Kraftstoff** wird automatisch deaktiviert (beim Bewegen des Mauszeigers über das deaktivierte Kontrollkästchen wird ein erklärender Tooltip angezeigt).
- **Digitale Strecken**: Digitale Slotcar-Systeme (wie Carrera Digital, Scalextric Digital, Scorpius oder oXigen), bei denen die Schnittstelle digitale Telemetrie überträgt (Fahrzeug-ID, Gasstellung in Prozent, Boxengassensensoren). Bei Auswahl einer digitalen Strecke ist der Bereich **Digitaler Kraftstoff** aktiviert und der Umschalter für **Analogen Kraftstoff** wird automatisch deaktiviert (beim Bewegen des Mauszeigers über das deaktivierte Kontrollkästchen wird ein erklärender Tooltip angezeigt).

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
- **Schnellste Zeit (s)**: Die schnellste erwartete Rundenzeit für Strecke und Fahrzeugklasse (in Sekunden).
- **Langsamste Zeit (s)**: Die langsamste Rundenzeit (in Sekunden) für minimalen Kraftstoffverbrauch.
- **Max. Kraftstoffverbrauch pro schnellster Runde**: Der Kraftstoffverbrauch pro Runde beim Fahren mit oder schneller als die **Schnellste Zeit**.
- **Min. Kraftstoffverbrauch pro langsamster Runde**: Der Kraftstoffverbrauch pro Runde beim Fahren mit oder langsamer als die **Langsamste Zeit**.
    - Für Rundenzeiten zwischen schnellster und langsamster Zeit geht der Kraftstoffverbrauch entsprechend dem gewählten **Verbrauchstyp** (Linear, Quadratisch, Kubisch oder Benutzerdefinierte Kurve) fließend über.
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

- **Gleichzeitiger Modellvergleich**: Alle 3 voreingestellten mathematischen Modelle (**Linear**, **Quadratisch** und **Kubisch**) werden gleichzeitig in beiden Diagrammen dargestellt. Der aktuell ausgewählte Typ ist fett mit einem Leuchten hervorgehoben, während die übrigen Modelle als gedämpfte Referenzlinien (~40 % Deckkraft) sichtbar bleiben.
- **Kraftstoffverbrauch pro Runde**: Zeigt den exakten Verbrauch über das gesamte Rundenzeitspektrum (von Schnellste Zeit bis Langsamste Zeit) an. Im Modus Benutzerdefinierte Kurve ermöglichen Griffe und Zurücksetzen-Schaltflächen sofortige Anpassungen, während die 3 Basismodelle zum Vergleich sichtbar bleiben.
- **Zeit bis Boxenstopp**: Zeigt die geschätzte Gesamtreisezeit (oder Runden) bis zum leeren Tank in Abhängigkeit von konstanten Rundenzeiten für alle Modelle.
- **Interaktive Legende und Sichtbarkeit**: Klicken Sie mit der linken Maustaste auf eine Kurve in der Legende, um sie ein- oder auszublenden. Das Ausblenden skaliert die Diagrammachsen dynamisch neu, um verbleibende Kurven genauer betrachten zu können.
- **Vergleichende Hover-Karten**: Beim Überfahren der Diagramme mit der Maus werden Vergleichswerte aller sichtbaren Kurven am aktuellen Messpunkt mit Farbfeldern, Werten und einer `(Aktiv)`-Kennzeichnung angezeigt.

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

- **Gleichzeitiger Modellvergleich**: Stellt lineare, quadratische und kubische Reaktionskurven gleichzeitig dar, wobei das ausgewählte Modell hervorgehoben wird und die anderen Modelle als Hintergrundreferenzen dienen.
- **Digitaler Kraftstoffverbrauch**: Trägt die Gasstellung ($0\,\%$ bis $100\,\%$) gegen den Verbrauch pro Sekunde für alle Modelle auf.
- **Zeit bis Tank leer**: Trägt die Gasstellung gegen die verbleibenden Fahrsekunden bis zum leeren Tank auf.
- **Interaktive Legende und Skalierung**: Kurven lassen sich über die Legende ein- und ausschalten, wodurch die Achsen automatisch neu skaliert werden.
- **Vergleichende Hover-Karten**: Zeigt beim Überstreichen des Diagramms die Echtzeit-Messwerte aller sichtbaren Kurven bei der jeweiligen Gasstellung an.

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
