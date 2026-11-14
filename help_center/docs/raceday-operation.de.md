# Renntag-Betrieb

## Starten und Pausieren

Am Renntag durchläuft das System automatisierte Zustände, die vom Rennleiter über Tastenkombinationen, Werkzeugleisten-Schaltflächen oder externe Chaos-Taster gesteuert werden:

### Läufe Starten
- **Aufstellung & Countdown**: Wird ein Lauf gestartet, leitet Race Coordinator AI einen automatischen Countdown ein (konfigurierbar über Autostart oder Startverzögerung im Renneditor). Akustische Töne und visuelle Startampeln bereiten die Fahrer vor.
- **Grüne Flagge**: Erreicht der Countdown null, wird der Bahnstrom eingeschaltet und der Lauf wechselt in den Zustand `Racing`.
- **Reaktionszeit**: Wenn „Hinter dem Sensor starten“ aktiviert ist, erfasst der erste Sensorimpuls jedes Fahrzeugs dessen Reaktionszeit beim Start anstelle einer vollen Runde.

### Pausieren & Gelbe Flaggen
- **Auslösen einer Pause**: Durch Drücken der Leertaste, Klick auf das **Pause**-Symbol in der Werkzeugleiste oder Betätigung eines externen Streckentasters wird sofort die Gelbe Flagge geschaltet (`Paused`).
- **Sofortige Stromabschaltung**: Die Bahnstrom-Relais öffnen unverzüglich und stoppen die Stromzufuhr.
- **Erfassung von Teilzeiten**: In derselben Millisekunde erfasst die Zeitnahme-Schnittstelle die bisherige Teilrundenzeit aller aktiven Fahrzeuge und speichert sie als offene Zeit ab.
- **Ausrollen über die Ziellinie (Drift-Runden)**: Nähert sich ein Auto bei Stromabschaltung der Ziellinie, kann sein Schwung es noch über den Sensor tragen.
    - Erfolgt die Auslösung innerhalb des konfigurierten **Driftzeit**-Fensters, wird der Durchgang als **Drift-Runde** (`isDrift: true`) gewertet. In der Bahnspalte erscheint das **`DRIFT`**-Badge, eine dringende Sprachansage ertönt und die Runde wird dem Fahrer gutgeschrieben.
    - Erfolgt die Auslösung erst nach Ablauf der Driftzeit, wird der Impuls verworfen, um versehentliche Runden durch Streckenposten zu verhindern.
    - Ausführliche Details zur Driftmechanik finden Sie unter [Renneditor: Driften & Drift-Timing-Mechanik](race-editor.de.md#drifting-and-drift-timing).

### Rennen Wiederaufnehmen
- **Neustart unter Grün**: Nach Beendigung der Pause startet der Countdown erneut. Bei Freigabe wird der Bahnstrom zugeschaltet und die Hardware-Timer beginnen bei null.
- **Rundenabschluss (Runden mit Drift-Beteiligung)**: Fährt ein auf der Strecke gestopptes Auto nach der Freigabe weiter und überquert die Ziellinie, setzt sich seine Rundenzeit aus der Teilzeit vor der Pause und der Zeit nach der Freigabe zusammen. Dies ist eine **Runde mit Drift-Beteiligung**. Ist „Runden mit Drift von Rekorden ausschließen“ aktiv, zählt die Runde für den Lauf, wird jedoch nicht als Rekord gewertet.

## Runden- und Zeitanpassungen

Rennleiter können Rundenanzahlen und Laufzeiten von Fahrern direkt am Renntag-Bildschirm manuell anpassen, um Bahnprobleme, verpasste Sensorauslösungen oder Strafen zu korrigieren:

### Öffnen des Anpassungsdialogs
- **Zellenklick**: Klicken Sie mit der linken Maustaste auf eine Zelle für **Rundenzahl** (`lapCount`, `physicalLapCount`) oder **Gesamtzeit** (`totalTime`, `overallTotalTime`) in der Spur- oder Spaltenansicht.
- **Rennleiter-Menü**: Öffnen Sie das **Rennleiter-Menü** und wählen Sie **Rundenabschnitte/Zeit anpassen**, um Fahrer über aktuelle, vergangene oder noch nicht gestartete Läufe hinweg im Batch zu bearbeiten.
- **Ergebnis-Bildschirme**: Ebenfalls über die Bildschirme **Laufergebnisse** und **Rennergebnisse** zugänglich, um gewertete Läufe nach dem Rennen zu bearbeiten.

### Schnelltasten (Runden)
Beim Klick auf eine anklickbare Rundenzelle:
- **`Shift + Linksklick`**: Fügt sofort +0,25 Runden (+1/4 Runde) hinzu, ohne den Dialog zu öffnen.
- **`Alt + Linksklick`**: Zieht sofort -0,25 Runden (-1/4 Runde) ab, ohne den Dialog zu öffnen.

### Anpassungssteuerelemente im Dialog
1. **Streckenabschnitte**: Geben Sie Abschnitte ein (z. B. bei 100 Abschnitten pro Runde), um die Rundenanzahl anzupassen. Eine Live-Vorschau zeigt den entsprechenden Rundenwert (z. B. 25 Abschnitte = 0,25 Runden).
2. **Zeitanpassung**: Geben Sie positive Sekunden (Strafzeit, z. B. `+5.000`) oder negative Sekunden (Zeitgutschrift, z. B. `-2.500`) mit Millisekundengenauigkeit (`0.001s`) ein.
3. **Live-Gesamtzeit-Vorschau**: Der Dialog berechnet und zeigt die bereinigte Gesamtzeit des Fahrers in Echtzeit vor dem Übernehmen an.

### Auswirkungen auf Ranglisten und Rennmetriken
- **Angepasste Runden**: Verändert direkt die Position in **Meiste Runden**-Wertungen und aktualisiert Rundenabstände (`gapLeader`, `gapPosition`). Physische Runden, beste Rundenzeit, Median-Rundenzeit und durchschnittliche Pace bleiben unberührt.
- **Angepasste Gesamtzeit**: Verändert die Position in **Schnellste Gesamtzeit**-Wertungen, dient als primärer Tiebreaker bei Rundengleichstand und aktualisiert die **Durchschnittliche Rundenzeit** ($\text{Bereinigte Gesamtzeit} / \text{Physische Runden}$) sowie Zeitabstände.
- **Geschützte Metriken**: **Beste Rundenzeit** und **Median-Rundenzeit** basieren strikt auf tatsächlichen physischen Sensorrunden und werden durch Zeitanpassungen niemals verändert.

---

## Crash-and-Learn-Betrieb {: #crash-and-learn-operations }

Wenn ein Rennen mit aktiviertem **Crash and Learn (CNL)** durchgeführt wird, erfasst Race Coordinator AI Deslots (Crashes) der Fahrer in Echtzeit, setzt Crash-Limits durch, vergibt Strafen und verwaltet Disqualifikationen.

### Deslot-Erkennung & Chaosschalter
- **Automatische Crash-Erkennung**: Wenn im Rennprofil konfiguriert und die Rundenzeit eines Fahrzeugs die **Automatische Crash-Zeit** überschreitet, erkennt das System automatisch einen Deslot und rechnet dem Fahrer einen Crash an.
- **Automatische Gelbphasen**: Wenn **Lauf bei Crash pausieren** aktiviert ist, löst ein automatischer Crash sofort eine Rennunterbrechung (Gelbe Flagge) aus und schaltet den Bahnstrom ab.
- **Mehrere Crashes pro Runde**: Wenn **Mehrere Crashes pro Runde erlauben** aktiviert ist, sammelt ein Fahrzeug, das neben der Spur verbleibt, für jedes erneute Verstreichen der Crash-Zeit einen weiteren Crash an.
- **Spurbezogene Chaosschalter**: Bei Bahnen mit spurbezogenen Chaosschaltern löst das Drücken des Schalters eine Gelbphase aus und verbucht einen Crash für diese Spur. Ein Drücken anderer Chaosschalter während einer bestehenden Pause rechnet keinen weiteren Crash an.

### Disqualifikations-Mechanik (DQ)
Überschreitet ein Fahrer die eingestellte **Maximale Crash-Anzahl** (z. B. 4 Crashes bei einem Limit von 3):
- **Schwarze Flagge**: Der Spurstatus des Fahrers wechselt sofort zur Schwarzen Flagge (`flag.disqualified`).
- **Spurstrombabschaltung**: Sind spurbezogene Relais vorhanden, wird der Bahnstrom dieser Spur sofort abgeschaltet.
- **Rundenzählung gestoppt**: Sensorimpulse und Runden werden für disqualifizierte Fahrer im restlichen Lauf ignoriert.
- **Sofortige Teilrundenberechnung**: In Teilrunden-Rennen (`NoneAutoSegments` oder `SingleLapAutoSegments`) werden die Segmente des disqualifizierten Fahrers im Moment der Disqualifikation nach dem Prinzip „Fertigfahren nicht erlauben“ berechnet ($\text{timeSinceLastLap} / \text{medianLapTime}$, maximal $0.99$). Dadurch wird verhindert, dass der Fahrer fälschlicherweise auf 0.99 Teilrunden anwächst, während er auf das Laufende wartet.
- **Wertungsrangfolge**: Disqualifizierte Fahrer können in der Laufwertung nicht vor nicht-disqualifizierten Fahrern platziert werden. Bei mehreren DQ-Fahrern entscheidet deren relatives Laufergebnis (skaliert nach dem eingestellten **DQ-Laufwertungsprozentsatz**).

### Crashes & Strafen prüfen und anpassen
Die Rennleitung hat jederzeit volle manuelle Kontrolle:
- **Crash-Zähler-Widgets**: Die Spurenspalten zeigen den aktuellen Crash-Zähler des Laufs an.
- **Manuelle Crash-Anpassung**: Über die Schaltflächen oder den Dialog **Rundensektoren / Zeit anpassen** können Crashes hinzugefügt oder abgezogen werden.
- **Aufhebung einer Disqualifikation**: Sinkt die Crash-Zahl durch Abzug wieder auf oder unter das Limit, wird die Disqualifikation sofort aufgehoben: Die Flagge schaltet zurück auf Grün, der Bahnstrom wird wiederhergestellt und die Strafen werden neu berechnet.
- **Transparenz der Strafen**: Strafrunden und Strafzeiten werden im Anpassungsdialog neben den Runden- und Zeiteingaben angezeigt.
