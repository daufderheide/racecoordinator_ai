# Verschilberekeningen & Verschil-Widgets (Gaps)

Race Coordinator AI beschikt over een geautomatiseerde server-side berekeningsengine (`GapCalculator`) die in realtime tijdsverschillen en ronde-intervallen tussen deelnemers bepaalt. Alle berekeningen worden continu op de server uitgevoerd en gesynchroniseerd naar client-displays, aangepaste UI-widgets, gesproken meldingen (TTS) en spreadsheet-exports.

---

## Overzicht van Verschilberekeningen

Wanneer de tussenstand van een race wordt bijgewerkt, sorteert de engine alle deelnemers op hun huidige positie volgens de actieve scoreregels (Meeste Ronden, Snelste Totale Tijd of Punten). Vervolgens worden de verschilmetrieken berekend voor twee afzonderlijke referentiepunten:

- **Verschil met de Leider (`gapLeader` / `overallGapLeader`)**: Het tijdsverschil tussen een deelnemer en de nummer 1 in de race (P1). Het verschil van de leider met zichzelf is altijd `0.0` (weergegeven als `--`).
- **Verschil met de Voorligger (`gapPosition` / `overallGapPosition`)**: Het tijdsverschil tussen een deelnemer en de auto die direct ervoor rijdt in het klassement (bijv. P3 ten opzichte van P2). Het verschil van de nummer 1 is altijd `0.0` (weergegeven als `--`).

### Gegevensbereiken: Heat-verschillen vs. Algemene Verschillen

Race Coordinator AI ondersteunt verschilberekeningen binnen twee afzonderlijke bereiken:

| Bereik | Kolomsleutels | Omschrijving | Toepassing |
| :--- | :--- | :--- | :--- |
| **Heat-gegevens (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Berekent verschillen uitsluitend tussen de auto's die op de baan rijden in de actieve heat. Rustende rijders tonen streepjes (`--`). | Live races, baankaarten, live heat-klassementen. |
| **Algemene Gegevens (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Berekent cumulatieve toernooiverschillen over alle ingeschreven deelnemers over alle voltooide heats heen. | Algemene toernooiroosters, klassementsoverzichten, kampioenschappen. |

---

## De 4 Ondersteunde Verschil-Widgets

Race Coordinator AI biedt **4 specifieke verschil-widgets** (beschikbaar als tabelkolommen, zelfstandige baankaarten en aangepaste insets), ingedeeld naar berekeningsmethode en referentiedoel:

```
                          ┌──────────────────────────────────────────────┐
                          │            RACE-VERSCHIL-WIDGETS             │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │   STANDAARDVERSCHILLEN  │                                 │    FORMULE 1-VERSCHIL   │
      │  Continue Pace-projectie│                                 │   Exacte Doorkomstijd   │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │ (Leider P1) │     │(Voorligger) │                         │ (Leider P1) │     │(Voorligger) │
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Verschil met de Leider (Standaard)
- **Toolbox-sleutels**: `gapLeader` (Heat) / `overallGapLeader` (Algemeen)
- **Toolbox-groep**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standaardlabels**: `HEAT GAP LEADER`, `OVERALL GAP LEADER` of `GAP LEADER`
- **Meetmethode**: Continue wiskundige pace-projectie.
- **Weergave**: Opgemaakt als `+X.XXX` seconden met instelbare decimalen (1 tot 3 decimalen). De leider toont `--`.
- **Doel**: Geeft een realtime berekende achterstand op de leider. Zelfs als de leider meer ronden heeft gereden, projecteert deze widget het tijdsverschil op basis van het gemiddelde tempo van de achtervolger.

### 2. Verschil met de Voorligger (Standaard)
- **Toolbox-sleutels**: `gapPosition` (Heat) / `overallGapPosition` (Algemeen)
- **Toolbox-groep**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standaardlabels**: `HEAT GAP POSITION`, `OVERALL GAP POSITION` of `GAP POSITION`
- **Meetmethode**: Continue wiskundige pace-projectie.
- **Weergave**: Opgemaakt als `+X.XXX` seconden. De nummer 1 toont `--`.
- **Doel**: Toont het tijdsverschil dat nodig is om de directe voorligger in te halen. Essentieel voor positieduels.

### 3. Formule 1-verschil met de Leider (`F1`)
- **Toolbox-sleutels**: `gapLeaderF1` (Heat) / `overallGapLeaderF1` (Algemeen)
- **Toolbox-groep**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standaardlabels**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` of `GAP LEADER`
- **Meetmethode**: Exacte fysieke tijdmeting bij passage van de start/finishlijn.
- **Weergave**:
  - **In dezelfde ronde**: Opgemaakt als `+X.XXX` seconden (daadwerkelijk tijdsverschil bij het overschrijden van de finishlijn).
  - **Gedubbelde rijders**: Vervangt de tijdsweergave automatisch door `+1 Ronde` of `+N Ronden` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Leider**: Toont `--`.
- **Doel**: Bootst officiële Formule 1-televisie-uitzendingen na. Voorkomt buitenproportionele projectietijden voor gedubbelde rijders door direct de rondeachterstand te tonen.

### 4. Formule 1-verschil met de Voorligger (`F1`)
- **Toolbox-sleutels**: `gapPositionF1` (Heat) / `overallGapPositionF1` (Algemeen)
- **Toolbox-groep**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Standaardlabels**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` of `GAP POSITION`
- **Meetmethode**: Exacte fysieke tijdmeting bij passage van de start/finishlijn.
- **Weergave**:
  - **In dezelfde ronde**: Opgemaakt als `+X.XXX` seconden achter de voorligger.
  - **Gedubbeld door voorligger**: Toont `+1 Ronde` of `+N Ronden`.
  - **Leider**: Toont `--`.
- **Doel**: Biedt een authentieke tv-ervaring voor onderlinge duels, met directe weergave van rondenachterstand op de wagen direct ervoor.

---

## Gedetailleerde Berekeningsformules

Alle wiskundige berekeningen vinden plaats in `com.antigravity.race.GapCalculator` op de Java-server.

Laat `leadParticipant` de voorliggende rijder zijn en `curParticipant` de achtervolgende rijder.

### Standaard Verschilberekening

Er worden drie mogelijke rondescenario's onderscheiden:

#### Scenario A: Zelfde Aantal Ronden
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Scenario B: Geen Volledige Ronde Gereden
Als de achtervolger nog geen volledige getimede ronde heeft voltooid (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Scenario C: Verschillend Aantal Ronden
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

De projectieformule past zich aan op basis van de geconfigureerde **Finishmethode (Finish Method)**:

1. **Races op Tijd (Timed Finish)**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Races op Ronden (Lap Finish)**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Als $\text{ProjectedGap}$ door timinganomalieën negatief uitvalt, valt het systeem automatisch terug op $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### Formule 1-Verschilberekening

#### 1. Ronden Achterstand (Laps Down)
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Als $\text{LapsDown} > 0$: De achtervolger is gedubbeld. Het tijdsverschil wordt `0.0` en de interface toont `+X Ronden`.
- Als $\text{LapsDown} \le 0$: De achtervolger bevindt zich in dezelfde ronde als de voorligger ($\text{LapsDown} = 0$).

#### 2. Tijdsverschil in de Leiderronde
- **Gelijk Aantal Fysieke Ronden**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Leider heeft een Extra Ronde Voltooid**: Het verschil wordt gemeten ten opzichte van het moment waarop de leider diezelfde ronde voltooide:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Als het berekende tijdsverschil negatief is, wordt dit vastgezet op `0.0`.

---

## Vergelijking: Standaardverschillen vs. Formule 1-verschillen

| Eigenschap | Standaardverschillen (`gapLeader`, `gapPosition`) | Formule 1-verschillen (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Berekeningsmethode** | Continue statistische pace-projectie | Exacte doorkomsttijd aan de finishlijn |
| **Gedubbelde Wagens** | Geprojecteerde seconden (bijv. `+14.820`) | Rondenachterstand (bijv. `+1 Ronde`, `+2 Ronden`) |
| **In Dezelfde Ronde** | Tijdsverschil in seconden (`+1.450`) | Doorkomsttijdsverschil bij dezelfde ronde (`+1.450`) |
| **Finishmethode** | Onderscheidt tijd- en rondengestuurde races | Gebaseerd op doorkomstmeting in alle races |
| **Aanbevolen Gebruik** | Continue snelheidscontrole bij slotracen | Televisiegrafieken, toeschouwersschermen |

---

## Gebruik van Verschil-Widgets in de UI Editor

### 1. In Roosters en Klassementen
Selecteer in de UI Editor de Grid-widget en ga naar het tabblad **Kolommen**. Vink onder **Gaps & Intervals** of **Overall Gaps & Intervals** de gewenste kolommen aan.

### 2. Zelfstandige Baankaarten
Sleep een verschil-widget vanuit de Toolbox naar het canvas en koppel deze aan een **Specifieke Baan**, een **Heat-positie** of het **Algemeen Klassement**.

### 3. Inset-verschillen op Andere Kaarten
Voeg een verschilwaarde toe als secundaire badge binnen een andere kaart via de 8 ankerposities in **Card Insets**.

---

## Integratie met Spraak (TTS), Audio & Export

- **Tekst-naar-Spraak (TTS)**:
  - `{driver.gapLeader}`: Gesproken verschil met de leider in seconden.
  - `{driver.gapPosition}`: Gesproken verschil met de voorligger in seconden.
- **Aangepaste HTML/JS Widgets**: `driver.gap_leader` en `driver.gap_position`.
- **Excel-sjablonen (XLS)**:
  - `${driver.gapLeader}` en `${driver.gapPosition}` (Algemeen klassement).
  - `${heatDriver.gapLeader}` en `${heatDriver.gapPosition}` (Heat-resultaten).
