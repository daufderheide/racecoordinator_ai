# Rennen-Editor

Der **Rennen-Editor** ermöglicht es Ihnen, Rennkonfigurationen zu erstellen, anzupassen und zu verwalten. Hier richten Sie Wertungsregeln, Laufläufe, Kraftstoffsimulationen und Rennoptionen ein.

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

---

## Renneinrichtung {: #race-setup }

Das linke Bedienfeld konfiguriert das Kernformat und die Streckenzuordnung für Ihr Rennen:

- **Rennenname**: Eindeutiger Name zur Identifizierung des Rennformats am Renntag und in Statistiken.
- **Strecke**: Die diesem Rennen zugewiesene physische Strecke. Die ausgewählte Strecke bestimmt, ob analoge oder digitale Kraftstoffsimulation verfügbar ist.
- **Design**: Visuelles UI-Design für die Anzeige am Renntag.
- **Laufrotationsformat**: Wählen Sie zwischen Standard-Rotationen (**Round Robin**, **Leiter**, **Turnier**) oder benutzerdefinierten Sequenzen.
- **Laufdurchläufe**: Gibt an, wie oft jeder Fahrer die komplette Laufrotation durchläuft.
- **Umgekehrte Läufe**: Dreht die Laufreihenfolge um, sodass Fahrer Läufe in umgekehrter Reihenfolge fahren.
- **Fahreranzahl-Vorschau**: Zeigt eine dynamische Vorschau der generierten Laufliste basierend auf der eingestellten Fahreranzahl.

Das rechte Bedienfeld zeigt die **Live-Laufvorschau**, die die vollständige Liste der Läufe, Fahrerrotationen und Spurzuweisungen in Echtzeit dynamisch generiert, während Sie Einstellungen anpassen.

---

## Navigations-Tabs {: #navigation-tabs }

Die Tableiste am oberen Rand des Rennen-Editors bietet Ein-Klick-Verknüpfungen, um direkt zu jedem Konfigurationsbereich zu springen:

- **Allgemein**: Designs, Audio-Ansagen, Rundenzeitfilter und UI-Einstellungen.
- **Läufe**: Zeiten für automatischen Start und Weiterlauf, Laufdurchläufe und umgekehrte Laufreihenfolge.
- **Wertung**: Lauf- und Gesamtwertungsmethoden, Zielbedingungen, Tiebreaker und Streichergebnisse.
- **Gruppen**: Gruppentrennung der Fahrer, unabhängige Laufpläne und Ranglistenaufstieg.
- **Startmethode**: Start- und Neustartzeiten, Streckenstartpositionen, fliegende Starts und Frühstartstrafen.
- **Team-Optionen**: Langstreckenrennen, Fahrerwechsel und Stint-Limits.
- **Analoger Kraftstoff**: Rundenbasierter Kraftstoffverbrauch, Tankkapazität und Nachtankraten.
- **Digitaler Kraftstoff**: Kontinuierlicher verbrauchsgesteuerter Kraftstoffverbrauch und benutzerdefinierte Kurven.
- **Saisonpunkte**: Meisterschafts-Punktetabelle, Laufpunkte und Bonuspunkte.

Durch Klicken auf einen Tab wird der entsprechende Akkordeonbereich sofort aufgerufen und erweitert.

---

## Allgemeine Einstellungen {: #general-settings }

Der Bereich Allgemeine Einstellungen steuert Präsentation, Zeitfilter und das Rennleiterverhalten:

- **Designauswahl**: Zuweisung benutzerdefinierter Farbschemata und Anzeigelayouts für den Renntag.
- **Audio-Ansagen**: Automatische Sprachansagen für Führungswechsel, schnellste Runden, Boxenstopps und Rennabschlüsse.
- **Minimale Rundenzeit (s)**: Kürzeste zulässige Rundenzeit zur Filterung von Sensorstörungen oder Fehlmessungen.
- **Driftzeit (s)**: Sensor-Erfassungsfenster zur Bewältigung von schleudernden Fahrzeugen auf der Ziellinie.
- **Gelbe-Flagge-Regeln**: Automatische oder manuelle Rennpausen bei Gelbphase mit Bahnstromabschaltung.
- **Benutzerdefinierte UI-Optionen**: Auswahl spezialisierter Bestenlisten und Telemetrie-Widgets.

---

## Lauf-Optionen {: #heat-options }

Der Bereich Lauf-Optionen konfiguriert automatisierte Zeitsteuerungen, Durchläufe und die Reihenfolge:

- **Automatische Weiterschaltzeit (s)**: Wartezeit nach Ende eines Laufs, bevor automatisch zum nächsten Lauf gewechselt wird.
- **Aufwärmzeit für Weiterschaltung (s)**: Vorlaufzeit vor dem automatischen Weiterschalten.
- **Automatische Startzeit (s)**: Automatischer Verzögerungscountdown vor dem Start des nächsten Laufs.
- **Aufwärmzeit für Start (s)**: Vorlaufzeit vor Beginn des automatischen Start-Countdowns.
- **Laufdurchläufe**: Bestimmt, wie oft jeder Fahrer die gesamte Laufrotation durchläuft.
- **Umgekehrte Läufe**: Dreht die geplante Laufreihenfolge um, sodass Läufe rückwärts ausgetragen werden.
---

## Wertungsregeln {: #scoring-rules }

#### Runden- und Zeitanpassungen (Auswirkungen auf Ranglisten und Metriken)

- **Laufwertungsmethode**: Platzierung der Fahrer in jedem Lauf nach **Meiste Runden**, **Schnellste Runde** oder **Schnellste Gesamtzeit** mit konfigurierbaren Tiebreakern.
- **Zielmethode**: Legt fest, wie das Ende eines Laufs bestimmt wird (nach **Rundenzahl** oder verstrichener **Zeit** in Sekunden).
- **Zielerlaubnis**: Bestimmt, wie Fahrzeuge ihre Runden beenden, wenn der Führende das Ziel erreicht oder die Zeit abläuft (z. B. sofortiges Ende, alle beenden lassen, Einzelrundenabschluss oder automatische Segmentgutschrift).
- **Gesamtwertungsmethode**: Platzierung der Gesamtrangliste über alle Läufe mit anpassbaren Tiebreakern und Streichergebnissen.

## Gruppen & Stufen {: #groups-and-stages }

Der Bereich Gruppen & Stufen teilt Fahrer in getrennte Gruppen ein, die auf der Strecke nicht gegeneinander fahren:

- **Gruppentrennung**: Fahrer werden in isolierte Gruppen eingeteilt und bestreiten ihre Läufe unabhängig nach der Rotationskonfiguration.
- **Maximale Gruppen**: Legt die maximale Anzahl zulässiger Gruppen für das Rennen fest.
- **Gruppen ausgleichen**: Verteilt die Fahreranzahl automatisch gleichmäßig auf alle Gruppen.
- **Leere Spuren erlauben**: Ermöglicht Läufe mit unbesetzten Spuren, wenn Gruppen nicht exakt auf die Spurenanzahl passen.
- **Vielfaches des Maximums erzwingen**: Stellt sicher, dass die Gesamtzahl der Läufe einem Vielfachen der maximalen Gruppenkapazität entspricht.
- **Gruppenläufe rotieren**: Wechselt Läufe zwischen verschiedenen Gruppen ab, anstatt eine Gruppe vollständig vor der nächsten abzuschließen.
- **Mindestaufsteiger**: Setzt die besten Fahrer jeder Gruppe automatisch an die Spitze der Gesamtrangliste.
- **Gruppennamen**: Weist jeder Gruppe individuelle Namen zu (z. B. Profi, Halbprofi, Gruppe A/B/C).
---

## Startmethoden {: #start-methods }

Der Bereich Startmethoden konfiguriert den Start von Läufen, die Fahrzeugpositionierung auf der Strecke und Startstrafen:

- **Start- / Neustartzeit (s)**: Countdown-Dauer vor Beginn oder Wiederaufnahme eines Laufs.
- **Zufallsverzögerungen (s)**: Zufällige Verzögerung zum Countdown, um ein Antizipieren des Startsignals zu verhindern.
- **Hinter Sensor starten**: Schreibt vor, dass Fahrzeuge auf Runde Null hinter den Start-/Ziellinien-Sensoren stehen müssen.
- **An aktueller Position starten**: Ermöglicht es Fahrzeugen, nach einer Gelbphase an ihrer aktuellen Position weiterzufahren.
- **Fliegende Starts**: Hält den Bahnstrom beim Start aktiv, sodass Fahrzeuge bei Grün sofort beschleunigen können.
- **Neustart bei Frühstart**: Startet den Countdown bei Erkennung eines Frühstarts automatisch neu.
- **Frühstartstrafen**: Konfiguriert Runden- oder Zeitabzüge für Fahrer, die einen Frühstart verursachen.
---

## Teamrennen-Optionen {: #team-racing }

Der Bereich Teamrennen-Optionen ermöglicht Langstreckenrennen mit mehreren Fahrern pro Team:

- **Teamrennen-Modus**: Aktiviert teambasierte Wertungen, bei denen Fahrer eines Teams Laufläufe gemeinsam bestreiten.
- **Fahrerwechsel-Strategie**: Automatischer Round-Robin-Wechsel der Teamfahrer über aufeinanderfolgende Läufe.
- **Fahrerwechsel während des Laufs**: Erlaubt Teamfahrern den Wechsel bei Boxenstopps oder bestimmten Rundenzahlen.
- **Stint-Limits**: Minimale und maximale Fahrzeit pro Fahrer zur Gewährleistung ausgewogener Einsätze.
- **Pflicht-Fahrerwechsel**: Vorschreiben einer Mindestanzahl von Fahrerwechseln pro Lauf oder Rennen.

---

## Rennen-Editor - Analoge Kraftstoffsimulation {: #analog-fuel-simulation }

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

---

## Rennen-Editor - Digitale Kraftstoffsimulation {: #digital-fuel-simulation }

Digitaler Kraftstoff simuliert den Verbrauch **kontinuierlich in Echt

---

## Saisonwertung {: #season-scoring }

Der Bereich Saisonwertung definiert die Verteilung von Meisterschaftspunkten für Rennserien:

- **Platzierungspunkte-Tabelle**: Punkteverteilung pro Platzierung (z. B. 25 für Platz 1, 18 für Platz 2 usw.).
- **Laufpunkte**: Optionale zusätzliche Punkte für Einzellaufergebnisse neben dem Gesamtergebnis.
- **Bonuspunkte**:
    - *Schnellste Runde*: Zusatzpunkte für die absolut schnellste Rennrunde.
    - *Pole Position*: Bonuspunkte für die beste Qualifikationsplatzierung.
    - *Meiste Führungsrunden*: Bonuspunkte für die meisten Runden in Führung.
- **Meisterschafts-Aggregation**: Automatische Zusammenrechnung der Punkte über Rennen hinweg inklusive Streichergebnissen.
