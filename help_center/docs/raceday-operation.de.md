# Renntag-Betrieb

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
