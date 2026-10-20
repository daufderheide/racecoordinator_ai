# Abstandsberechnungen & Abstands-Widgets (Gaps)

Race Coordinator AI verfügt über eine automatisierte serverseitige Engine zur Abstandsberechnung (`GapCalculator`), die in Echtzeit Zeitabstände und Rundenintervalle zwischen Teilnehmern ermittelt. Alle Berechnungen werden kontinuierlich auf dem Server durchgeführt und mit Client-Anzeigen, benutzerdefinierten UI-Widgets, Audioansagen und Tabellenexporten synchronisiert.

---

## Übersicht der Abstandsberechnungen

Sobald sich die Wertungen während des Rennens aktualisieren, sortiert die Engine alle Teilnehmer nach ihrer aktuellen Platzierung gemäß den aktiven Wertungsregeln (Meiste Runden, Schnellste Gesamtzeit oder Punkte). Anschließend werden die Abstandsmetriken für zwei unterschiedliche Bezugspunkte berechnet:

- **Abstand zum Führenden (`gapLeader` / `overallGapLeader`)**: Der Zeitabstand zwischen einem Fahrer und dem Erstplatzierten (P1). Der Abstand des Führenden zu sich selbst beträgt immer `0.0` (dargestellt als `--`).
- **Abstand zum Vordermann (`gapPosition` / `overallGapPosition`)**: Der Zeitabstand zwischen einem Fahrer und dem unmittelbar vor ihm platzierten Fahrzeug (z. B. P3 im Vergleich zu P2). Der Abstand des Erstplatzierten beträgt immer `0.0` (dargestellt als `--`).

### Datenbereiche: Durchgangs-Abstände vs. Gesamt-Abstände

Race Coordinator AI unterstützt die Abstandsbewertung über zwei verschiedene Datenbereiche:

| Bereich | Spaltenschlüssel | Beschreibung | Anwendungsfall |
| :--- | :--- | :--- | :--- |
| **Durchgangsdaten (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Bewertet Abstände ausschließlich zwischen den Fahrzeugen, die im aktuellen Durchgang aktiv auf der Strecke fahren. Pausierende Fahrer zeigen Striche (`--`). | Live-Rennen, Fahrerstandskarten, Live-Bestenlisten. |
| **Gesamtrendaten (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Bewertet kumulierte Abstände über alle registrierten Teilnehmer des gesamten Turniers hinweg, über alle abgeschlossenen Durchgänge. | Gesamtwertungsraster, turnierweite Ranglisten, Meisterschaftsverfolgung. |

---

## Die 4 unterstützten Abstands-Widgets

Race Coordinator AI bietet **4 verschiedene Abstands-Widgets** (verfügbar als Rasterspalten, eigenständige Spaltenkarten und benutzerdefinierte Insets), unterteilt nach Berechnungsmethode und Bezugsziel:

```
                          ┌──────────────────────────────────────────────┐
                          │             RENN-ABSTANDS-WIDGETS            │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │    STANDARD-ABSTÄNDE    │                                 │    FORMEL-1-ABSTÄNDE    │
      │  Kontinuierliche Pace   │                                 │   Exakte Linienquerung  │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │(P1-Führender│     │(Vordermann) │                         │(P1-Führender│     │(Vordermann) │
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Abstand zum Führenden (Standard)
- **Toolbox-Schlüssel**: `gapLeader` (Durchgang) / `overallGapLeader` (Gesamt)
- **Toolbox-Gruppe**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standardbezeichnungen**: `HEAT GAP LEADER`, `OVERALL GAP LEADER` oder `GAP LEADER`
- **Messmodell**: Kontinuierliche mathematische Pace-Projektion.
- **Anzeige**: Formatiert als `+X.XXX` Sekunden mit konfigurierbaren Nachkommastellen (1 bis 3 Dezimalstellen). Der Führende zeigt `--`.
- **Zweck**: Liefert einen in Echtzeit prognostizierten Zeitrückstand auf den Führenden. Selbst wenn der Führende mehr Runden absolviert hat, projiziert dieses Widget den Zeitabstand basierend auf der durchschnittlichen Rundenzeit des Verfolgers.

### 2. Abstand zum Vordermann (Standard)
- **Toolbox-Schlüssel**: `gapPosition` (Durchgang) / `overallGapPosition` (Gesamt)
- **Toolbox-Gruppe**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standardbezeichnungen**: `HEAT GAP POSITION`, `OVERALL GAP POSITION` oder `GAP POSITION`
- **Messmodell**: Kontinuierliche mathematische Pace-Projektion.
- **Anzeige**: Formatiert als `+X.XXX` Sekunden. Der Erstplatzierte zeigt `--`.
- **Zweck**: Zeigt den Zeitrückstand an, der nötig ist, um den unmittelbar vorausfahrenden Konkurrenten zu überholen. Unverzichtbar für Positionskämpfe.

### 3. Formel-1-Abstand zum Führenden (`F1`)
- **Toolbox-Schlüssel**: `gapLeaderF1` (Durchgang) / `overallGapLeaderF1` (Gesamt)
- **Toolbox-Gruppe**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standardbezeichnungen**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` oder `GAP LEADER`
- **Messmodell**: Exakte physische Zeitmessung an der Start-/Ziellinie.
- **Anzeige**:
  - **In derselben Runde**: Formatiert als `+X.XXX` Sekunden (physischer Zeitunterschied bei der Linienüberquerung).
  - **Überrundete Fahrer**: Ersetzt die Zeitanzeige automatisch durch `+1 Runde` oder `+N Runden` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Führender**: Zeigt `--`.
- **Zweck**: Bildet die offizielle Formel-1-Zeitmessung nach. Anstelle großer hochgerechneter Zeitabstände wird bei überrundeten Fahrzeugen klar der Rundenrückstand angezeigt.

### 4. Formel-1-Abstand zum Vordermann (`F1`)
- **Toolbox-Schlüssel**: `gapPositionF1` (Durchgang) / `overallGapPositionF1` (Gesamt)
- **Toolbox-Gruppe**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standardbezeichnungen**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` oder `GAP POSITION`
- **Messmodell**: Exakte physische Zeitmessung an der Start-/Ziellinie.
- **Anzeige**:
  - **In derselben Runde**: Formatiert als `+X.XXX` Sekunden hinter dem Vordermann.
  - **Vom Vordermann überrundet**: Zeigt `+1 Runde` oder `+N Runden`.
  - **Führender**: Zeigt `--`.
- **Zweck**: Bietet ein authentisches TV-Rennerlebnis für direkte Duelle, mit sofortiger Kennzeichnung überrundeter Abstände zum nächsten Wagen.

---

## Detaillierte Berechnungsformeln

Die gesamte Abstandsmathematik wird in `com.antigravity.race.GapCalculator` auf dem Java-Server berechnet.

Sei `leadParticipant` der vorausfahrende Fahrer (Führender oder Fahrzeug auf Position $N-1$) und `curParticipant` der nachfolgende Fahrer.

### Standard-Abstandsprojektion

Standardabstände berücksichtigen drei mögliche Rundenszenarien:

#### Szenario A: Gleiche Rundenzahl
Haben beide Fahrer exakt dieselbe Anzahl angepasster Runden absolviert:
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Szenario B: Keine vollständige Runde absolviert
Hat der nachfolgende Fahrer noch keine vollständige gezeitete Runde abgeschlossen (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Szenario C: Unterschiedliche Rundenzahl
Hat der vorausfahrende Fahrer mehr Runden absolviert, wird die Rundendifferenz berechnet:
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

Die Projektionsformel passt sich an die konfigurierte **Ende-Methode (Finish Method)** des Rennens an:

1. **Zeitbasierte Rennen (Timed Finish)** (z. B. 2-Minuten-Durchgänge):
   Bei zeitbasierten Rennen ist die Gesamtlaufzeit beim Signalton im Wesentlichen identisch. Der Abstand wird rein über das Rundentempo des nachfolgenden Fahrers entlang des Rundenrückstands projiziert:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Rundenbasierte Rennen (Lap Finish)** (z. B. 50-Runden-Durchgänge):
   Bei rundenbasierten Rennen weichen die Gesamtzeiten naturgemäß voneinander ab. Das System kombiniert die aktuelle Zeitdifferenz mit der prognostizierten Zeit für die fehlenden Runden:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Sollte $\text{ProjectedGap}$ aufgrund von Zeitanomalien oder manuellen Anpassungen negativ ausfallen, greift das System automatisch auf $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$ zurück.

---

### Formel-1-Abstandsmathematik

Formel-1-Abstände spiegeln physische Rennpositionen wider, wenn Fahrzeuge die Start-/Ziellinie überqueren:

#### 1. Ermittlung des Rundenrückstands (Laps Down)
Die Engine prüft, ob der nachfolgende Fahrer physisch überrundet wurde:
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Wenn $\text{LapsDown} > 0$: Der Fahrer ist überrundet. `lapsDownLeader` (oder `lapsDownPosition`) wird gespeichert, der Zeitabstand auf `0.0` gesetzt und in der UI `+X Runden` angezeigt.
- Wenn $\text{LapsDown} \le 0$: Der Fahrer befindet sich in der Führungsrunde ($\text{LapsDown} = 0$).

#### 2. Zeitdifferenz in der Führungsrunde
Fahren beide Fahrer in derselben Runde, wird die exakte Zeitdifferenz beim Überqueren der Linie berechnet:

- **Gleiche Anzahl physischer Runden absolviert**: Beide Fahrzeuge haben die Ziellinie für dieselbe Rundennummer überquert:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Führender hat eine zusätzliche Runde absolviert**: Der Führende hat bereits die nächste Runde begonnen, während der Verfolger seine Runde noch beendet. Der Abstand wird zu dem Zeitpunkt gemessen, an dem der Führende exakt dieselbe Runde beendet hatte:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Sollte der berechnete Zeitabstand durch Messschwankungen negativ sein, wird er auf `0.0` fixiert.

---

## Vergleich: Standard-Abstände vs. Formel-1-Abstände

| Eigenschaft | Standard-Abstände (`gapLeader`, `gapPosition`) | Formel-1-Abstände (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Berechnungsansatz** | Kontinuierliche statistische Pace-Projektion | Exakter Zeitvergleich bei Überquerung der Ziellinie |
| **Anzeige bei Überrundung** | Projizierte Sekunden (z. B. `+14.820`) | Rundenrückstand-Text (z. B. `+1 Runde`, `+3 Runden`) |
| **Anzeige in Führungsrunde** | Zeitdifferenz in Sekunden (`+1.450`) | Exakte Zeitdifferenz bei identischer Runde (`+1.450`) |
| **Ende-Methode** | Differenziert nach zeit- oder rundenbasiertem Ende | Überquerungsbasiert über alle Rennformate hinweg |
| **Empfohlener Einsatz** | Slotcar-Rennbetrieb, kontinuierliche Pace-Kontrolle | TV-Grafiken, Broadcast-Anzeigen, Zuschauer-Bildschirme |

---

## Verwendung der Abstands-Widgets im UI-Editor

### 1. In Rastern und Bestenlisten
Wählen Sie im UI-Editor das Grid-Widget aus und wechseln Sie zum Reiter **Spalten (Columns)**. Unter **Gaps & Intervals** (Durchgang) oder **Overall Gaps & Intervals** (Gesamt) aktivieren Sie die gewünschten Abstandsspalten:
- Verschieben Sie Spaltenkarten nach oben oder unten, um deren Reihenfolge anzupassen.
- Konfigurieren Sie die Dezimalstellen (1, 2 oder 3) im Spalten-Inspektor.

### 2. Eigenständige Spaltenkarten (Lane Column Cards)
Sie können einzelne Abstands-Widgets direkt aus der Toolbox auf die Leinwand ziehen:
- Binden Sie die Karte im **Lane Column Inspector** an eine bestimmte **Spur (Track Lane)**, eine **Durchgangsplatzierung (Heat Position)** oder die **Gesamtwertung (Overall Standings Rank)**.
- Wählen Sie die Layout-Ausrichtung: **Vertikal** (Titel über Wert) oder **Horizontal** (nebeneinander).

### 3. Inset-Abstände auf anderen Karten
Abstandswerte können direkt als kleine Zusatz-Badges (Insets) in andere Spurkarten integriert werden:
- Wählen Sie eine beliebige Lane-Column-Karte (z. B. Fahrerbild oder Rundenanzahl).
- Weisen Sie im Bereich **Card Insets** `gapLeader` oder `gapPositionF1` einer der 8 Ankerpositionen (z. B. unten rechts) zu.

---

## Integration mit Sprachausgabe (TTS), Audio & Export

Abstandsmetriken sind nahtlos in alle Subsysteme von Race Coordinator AI integriert:

- **Text-to-Speech (TTS)**: Ansagen von Abständen mittels dynamischer Variablenersetzung:
  - `{driver.gapLeader}`: Gesprochener Zeitabstand zum Führenden in Sekunden.
  - `{driver.gapPosition}`: Gesprochener Zeitabstand zum Vordermann in Sekunden.
- **Benutzerdefinierte HTML/JS-Widgets**: Zugriff auf Live-Abstände über `driver.gap_leader` und `driver.gap_position`.
- **Excel-Exporte (XLS)**: Ausgabe in Jxls-Vorlagen:
  - `${driver.gapLeader}` und `${driver.gapPosition}` (Gesamtwertung).
  - `${heatDriver.gapLeader}` und `${heatDriver.gapPosition}` (Durchgangsergebnisse).
