# Abstandsberechnungen & Abstands-Widgets (Gaps)

Race Coordinator AI verfügt über eine automatisierte serverseitige Engine zur Abstandsberechnung (`GapCalculator`), die in Echtzeit Zeitabstände und Rundenintervalle zwischen Teilnehmern ermittelt. Alle Berechnungen werden kontinuierlich auf dem Server durchgeführt und mit Client-Anzeigen, benutzerdefinierten UI-Widgets, Audioansagen und Tabellenexporten synchronisiert.

---

## Übersicht der Abstandsberechnungen

Sobald sich die Wertungen während des Rennens aktualisieren, sortiert die Engine alle Teilnehmer nach ihrer aktuellen Platzierung gemäß den aktiven Wertungsregeln (Meiste Runden, Schnellste Gesamtzeit oder Punkte). Anschließend werden die Abstandsmetriken für zwei unterschiedliche Bezugspunkte berechnet:

- **Abstand zum Führenden (`leader`)**: Der Zeitabstand zwischen einem Fahrer und dem Erstplatzierten (P1). Der Abstand des Führenden zu sich selbst beträgt immer `0.0` (dargestellt als `--`).
- **Abstand zum Vordermann (`position`)**: Der Zeitabstand zwischen einem Fahrer und dem unmittelbar vor ihm platzierten Fahrzeug (z. B. P3 im Vergleich zu P2). Der Abstand des Erstplatzierten beträgt immer `0.0` (dargestellt als `--`).

### Datenbereiche: Durchgangs-Abstände vs. Gesamt-Abstände

Race Coordinator AI unterstützt die Abstandsbewertung über zwei verschiedene Datenbereiche:

| Bereich | Spaltenschlüssel | Beschreibung | Anwendungsfall |
| :--- | :--- | :--- | :--- |
| **Durchgangsdaten (Heat Data)** | `gap` | Bewertet Abstände ausschließlich zwischen den Fahrzeugen, die im aktuellen Durchgang aktiv auf der Strecke fahren. Pausierende Fahrer zeigen Striche (`--`). | Live-Rennen, Fahrerstandskarten, Live-Bestenlisten. |
| **Gesamtdaten (Overall Data)** | `overallGap` | Bewertet kumulierte Abstände über alle registrierten Teilnehmer des gesamten Turniers hinweg, über alle abgeschlossenen Durchgänge. | Gesamtwertungsraster, turnierweite Ranglisten, Meisterschaftsverfolgung. |

> [!NOTE]
> Bestehende Layouts mit veralteten Spaltenschlüsseln (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, `overallGapPosition`, `overallGapLeaderF1`, `overallGapPositionF1`) werden beim Laden automatisch zu `gap` bzw. `overallGap` mit den entsprechenden Ziel- und Berechnungsmoduseinstellungen migriert.

---

## Die 2 konfigurierbaren Abstands-Widgets

Race Coordinator AI bietet **2 konfigurierbare Abstands-Widgets** (verfügbar als Rasterspalten, eigenständige Spaltenkarten und benutzerdefinierte Insets):

```
                          ┌──────────────────────────────────────────────┐
                          │             RENN-ABSTANDS-WIDGETS            │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │   LAUF-ABSTAND (`gap`)  │                                 │GESAMT-ABSTAND(`overallGap)│
      │  Aktive Fahrer im Lauf  │                                 │ Alle Turnierteilnehmer  │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │     ZIEL-AUSWAHL      │           │   BERECHNUNGSMODUS    │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Führender (P1)      │           │ • Immer Zeit          │
                   │ • Vorausfahrender     │           │ • Runden und Zeit (F1)│
                   │                       │           │ • Immer Runden (Delta)│
                   └───────────────────────┘           └───────────────────────┘
```

### Zielauswahl
- **Führender (`leader`)**: Abstand relativ zum Führenden des Rennens (P1). Der Führende zeigt Striche (`--`).
- **Vorausfahrender (`position`)**: Abstand relativ zum unmittelbar davor platzierten Konkurrenten (z. B. P3 zu P2). Der Führende zeigt Striche (`--`).

### Berechnungsmodi
1. **Immer Zeit (`always_time`)**:
   - Kontinuierliche mathematische Pace-Projektion in Sekunden.
   - Formatiert als `+X.XXX` mit konfigurierbaren Zeitdezimalstellen (1 bis 3 Stellen).
2. **Runden und Zeit (`laps_and_time`)**:
   - Formel-1-Übertragungsanzeige.
   - Zeigt Sekunden (`+X.XXX`) an, wenn die Fahrer in der Führungsrunde sind.
   - Zeigt Rundenrückstände (`+1 Runde`, `+N Runden`) bei Überrundung an.
3. **Immer Runden (`always_laps`)**:
   - Exakter Runden-Delta-Wert, der jedes Mal berechnet wird, wenn ein Fahrer die Linie zur Rundenbeendigung überquert.
   - Bezieht den Teilrundenfortschritt des Zielfahrers im exakten Überquerungsmoment mit ein.
   - Formatiert mit konfigurierbaren Rundendezimalstellen (0 bis 3 Stellen).

---

## Detaillierte Berechnungsformeln

Die gesamte Abstandsmathematik wird in `com.antigravity.race.GapCalculator` auf dem Java-Server ausgeführt.

Sei `leadParticipant` der vorausfahrende Fahrer (Führender oder Konkurrent auf Position $N-1$) und `curParticipant` der verfolgende Fahrer.

### 1. Formel: Immer Zeit (`always_time`)

Standardmäßige Zeitabstände bewerten drei Runden-Szenarien:

#### Szenario A: Gleiche absolvierte Runden
Haben beide Fahrer exakt dieselbe Anzahl bereinigter Runden zurückgelegt:
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Szenario B: Keine abgeschlossenen Runden
Hat der Verfolger noch keine vollständige gezeitete Runde beendet (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Szenario C: Unterschiedliche Rundenzahlen
Hat der vorausfahrende Fahrer mehr Runden absolviert, wird die Rundendifferenz ermittelt:
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

Die Projektionsformel passt sich an die konfigurierte **Beendigungsmethode** an:

1. **Zeitbasierte Rennen** (z. B. 2-Minuten-Heats):
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Rundenbasierte Rennen** (z. B. 50-Runden-Heats):
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Ergibt $\text{ProjectedGap}$ ausnahmsweise einen negativen Wert, greift das System automatisch auf $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$ zurück.

---

### 2. Formel: Formel-1-Abstand (`laps_and_time`)

Formel-1-Abstände spiegeln physische Streckenabstände bei Start-/Ziellinienüberquerung wider:

#### 1. Überrundungsprüfung
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Ist $\text{LapsDown} > 0$: Der Fahrer ist überrundet (`+X Runden`).
- Ist $\text{LapsDown} \le 0$: Der Fahrer befindet sich in der Führungsrunde.

#### 2. Zeitabstand in der Führungsrunde
- **Gleiche Rundenzahl beendet**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Führender hat eine Runde mehr absolviert**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Formel: Immer Runden (`always_laps`)

Die Berechnung im Modus „Immer Runden“ misst den exakten Runden-Delta-Wert bei jedem Rundenabschluss:

#### 1. Rundenabschluss-Auslöser
Überquert ein Fahrer die Ziellinie, wird seine Rundenzahl erfasst. Der Referenzfahrer (Führender oder Vordermann) wird ermittelt.

#### 2. Berechnung der Teilrunde
Um einen fairen und genauen Vergleich zu gewährleisten, wird der Teilrundenfortschritt des Referenzfahrers basierend auf der Zeit seit dessen letzter Rundenüberquerung berechnet:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Hat der Referenzfahrer noch keine gültige Median-Rundenzeit ($\le 0$) oder ist $\text{TimeSinceLastLap} \le 0$, beträgt die Teilrunde $0.0$. Die Teilrunde wird auf maximal $0.99$ begrenzt, um vorzeitige Rundenaufrundungen vor der echten Linienüberquerung auszuschließen.

#### 3. Effektives Runden-Delta
Die effektive Rundenzahl des Referenzfahrers wird bestimmt:
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$

Der Rundenabstand für den Fahrer beträgt:
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

Der Fahrer behält diesen berechneten Wert bei, bis er selbst die nächste Runde vollendet.

---

## Vergleich der Berechnungsmodi

| Merkmal | Immer Zeit (`always_time`) | Runden und Zeit (`laps_and_time`) | Immer Runden (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Berechnungsansatz** | Kontinuierliche statistische Pace-Projektion | Exakte Zeitstempelvergleiche an der Ziellinie | Runden-Delta mit Teilrundenfortschritt |
| **Überrundete Autos** | Prognostizierte Sekunden (z. B. `+14.820`) | Rundenrückstand-Text (z. B. `+1 Runde`, `+3 Runden`) | Dezimales Runden-Delta (z. B. `+2.45`) |
| **Führungsrunden-Autos** | Zeitdifferenz in Sekunden (`+1.450`) | Exakte Zeitdifferenz an der Linie (`+1.450`) | Dezimales Runden-Delta (z. B. `+0.28`) |
| **Genauigkeitsbasis** | Zeitdezimalstellen (1 bis 3 Stellen) | Zeitdezimalstellen (1 bis 3 Stellen) | Rundendezimalstellen (0 bis 3 Stellen) |
| **Aktualisierungszeitpunkt** | Kontinuierliche Projektionsaktualisierung | Start-/Ziellinienüberquerung | Vollendete eigene Rundenüberquerung |
| **Empfohlener Einsatz** | Slot-Car-Pacing, Zeittrainings | Formel-1-TV-Timing-Anzeigen | Langstreckenrennen, rundenbasierte Serien |

---

## Verwendung der Abstands-Widgets im UI-Editor

### 1. In Rastern und Ranglisten
Wählen Sie im UI-Editor Ihr Raster-Widget aus und wechseln Sie zum Reiter **Spalten**. Aktivieren Sie unter **Gaps & Intervalle** (Lauf) oder **Gesamt-Gaps & Intervalle** (Gesamt) die Spalte **Lauf-Abstand** (`gap`) oder **Gesamt-Abstand** (`overallGap`):
- Wählen Sie die Spaltenkarte aus, um den **Spalten-Inspektor** zu öffnen.
- Wählen Sie unter **Abstandskonfiguration** das **Ziel** (*Führender* oder *Vorausfahrender*) und den **Berechnungsmodus** (*Immer Zeit*, *Runden und Zeit* oder *Immer Runden*).
- Mehrere Abstandsspalten mit unterschiedlichen Zielen oder Modi können gleichzeitig demselben Raster hinzugefügt werden!

### 2. Eigenständige Spaltenkarten
Sie können Abstands-Widgets direkt aus der Toolbox auf die Arbeitsfläche ziehen:
- Verknüpfen Sie die Karte im **Spalten-Inspektor** mit einer Spur, Laufposition oder Gesamtwertungsplatzierung.
- Konfigurieren Sie Ziel und Berechnungsmodus.

### 3. Inset-Daten auf anderen Karten
Abstandsmetriken können direkt als Sub-Badges in andere Spaltenkarten eingebettet werden:
- Wählen Sie eine beliebige Spaltenkarte aus (z. B. Fahrer-Avatar oder Rundenanzahl).
- Weisen Sie im Bereich **Karten-Insets** `gap` oder `overallGap` einer der 8 Ankerpositionen zu.
- Passen Sie Ziel und Berechnungsmodus direkt in den Inset-Einstellungen an.

---

## Integration mit Sprachausgabe (TTS), Audio & Export

Abstandsmetriken sind nahtlos in alle Subsysteme von Race Coordinator AI integriert:

- **Text-to-Speech (TTS)**: Ansage von Intervallen über dynamische Variablen:
  - `{driver.gapLeader}`: Gesprochener Zeitabstand zum Führenden in Sekunden.
  - `{driver.gapPosition}`: Gesprochener Zeitabstand zum Vordermann in Sekunden.
- **Benutzerdefinierte HTML/JS-Widgets**: Zugriff auf Livedaten über `driver.gap_leader` und `driver.gap_position`.
- **Excel-Exporte**: Integration von Abstandsspalten über Jxls-Tags:
  - `${driver.gapLeader}` und `${driver.gapPosition}` (Gesamtwertung).
  - `${heatDriver.gapLeader}` und `${heatDriver.gapPosition}` (Laufergebnisse).
