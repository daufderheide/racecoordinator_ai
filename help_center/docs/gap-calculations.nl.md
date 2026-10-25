# Verschilberekeningen & Verschil-Widgets (Gaps)

Race Coordinator AI beschikt over een geautomatiseerde server-engine voor verschilberekening (`GapCalculator`), die in realtime tijdsverschillen en rondenintervallen tussen deelnemers bepaalt. Alle berekeningen worden continu op de server uitgevoerd en gesynchroniseerd met client-displays, aangepaste UI-widgets, audiospraak en spreadsheet-exporten.

---

## Overzicht van Verschilberekeningen

Zodra de tussenstand tijdens de race wordt bijgewerkt, sorteert de engine alle deelnemers volgens de actieve scorecriteria (Meeste ronden, Snelste totale tijd of Punten). Vervolgens worden de verschilwaarden berekend voor twee verschillende referentiekaders:

- **Verschil met de Leider (`leader`)**: Het interval tussen een deelnemer en de huidige leider (P1). Het verschil van de leider met zichzelf is altijd `0.0` (weergegeven als `--`).
- **Verschil met de Voorligger (`position`)**: Het interval tussen een deelnemer en de auto die direct ervoor rijdt in het klassement (bijv. P3 vergeleken met P2). Het verschil van de leider is altijd `0.0` (weergegeven als `--`).

### Gegevensbereiken: Heat-verschillen vs. Algemene Verschillen

Race Coordinator AI ondersteunt verschilbepaling over twee gegevensbereiken:

| Bereik | Kolomsleutel | Omschrijving | Toepassing |
| :--- | :--- | :--- | :--- |
| **Heat-gegevens (Heat Data)** | `gap` | Berekent intervallen uitsluitend tussen de auto's die actief op de baan rijden in de huidige heat. Rustende rijders tonen streepjes (`--`). | Live races, baanvak-kaarten, live heat-klassementen. |
| **Algemene Gegevens (Overall Data)** | `overallGap` | Berekent cumulatieve toernooi-intervallen over alle deelnemers aan het evenement, over alle voltooide heats heen. | Algemene standenrasters, toernooiranglijsten. |

> [!NOTE]
> Bestaande lay-outs die gebruikmaken van oudere kolomsleutels (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, enz.) worden bij het laden automatisch gemigreerd naar `gap` of `overallGap` met de bijbehorende doel- en modusinstellingen.

---

## De 2 Configureerbare Verschil-Widgets

Race Coordinator AI biedt **2 configureerbare verschil-widgets** (beschikbaar als rasterkolommen, afzonderlijke baanvak-kaarten en aangepaste insets):

```
                          ┌──────────────────────────────────────────────┐
                          │            RACE VERSCHIL-WIDGETS             │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │   HEAT-VERSCHIL (`gap`) │                                 │ALGEMEEN VERSCHIL(`overallGap`)│
      │   Actieve Heat-rijders  │                                 │   Alle Deelnemers       │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │     DOEL-KIEZER       │           │   BEREKENINGSMODUS    │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Leider (P1)         │           │ • Altijd tijd         │
                   │ • Voorgaande positie  │           │ • Ronden en tijd (F1) │
                   │                       │           │ • Altijd ronden       │
                   └───────────────────────┘           └───────────────────────┘
```

### Doelselectie
- **Leider (`leader`)**: Interval ten opzichte van de huidige raceleider (P1). De leider toont streepjes (`--`).
- **Voorgaande positie (`position`)**: Interval ten opzichte van de directe voorligger (bijv. P3 t.o.v. P2). De leider toont streepjes (`--`).

### Berekeningsmodi
1. **Altijd tijd (`always_time`)**:
   - Continue pace-projectie van het tijdsverschil in seconden.
   - Opgemaakt als `+X.XXX` met instelbare tijddecimalen (1 tot 3 decimalen).
2. **Ronden en tijd (`laps_and_time`)**:
   - Formule 1-stijl weergave.
   - Toont seconden (`+X.XXX`) wanneer coureurs in dezelfde ronde rijden.
   - Toont rondenachterstand (`+1 Ronde`, `+N Ronden`) bij een dubbeling.
3. **Altijd ronden (`always_laps`)**:
   - Exact rondenverschil berekend op het moment dat een deelnemer over de finishlijn komt om een ronde te voltooien.
   - Houdt rekening met de partiële rondevoortgang van de doelcoureur op dat exacte moment.
   - Opgemaakt met instelbare rondedecimalen (0 tot 3 decimalen).

---

## Gedetailleerde Berekeningsformules

Alle berekeningen worden uitgevoerd in `com.antigravity.race.GapCalculator` op de Java-server.

Laat `leadParticipant` de voorliggende coureur zijn (leider of positie $N-1$) en `curParticipant` de achtervolgende coureur.

### 1. Formule: Altijd Tijd (`always_time`)

Standaard tijdsverschillen onderscheiden drie situaties:

#### Situatie A: Zelfde Aantal Voltooide Ronden
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Situatie B: Geen Voltooide Ronden
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Situatie C: Verschillend Aantal Ronden
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

De projectieformule past zich aan aan de **Finishmethode**:
1. **Tijdgebonden Races**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$
2. **Rondegebonden Races**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

---

### 2. Formule: Formule 1 (`laps_and_time`)

#### 1. Rondenachterstand Bepalen
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$
- Als $\text{LapsDown} > 0$: De coureur is gedubbeld (`+X Ronden`).
- Als $\text{LapsDown} \le 0$: In dezelfde ronde als de leider.

#### 2. Tijdsverschil in Dezelfde Ronde
- **Gelijk aantal doorkomsten**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Leider heeft één ronde extra voltooid**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Formule: Altijd Ronden (`always_laps`)

Meet het exacte rondenverschil bij elke voltooide ronde:

#### 1. Voltooiingstrigger
Wanneer een coureur over de finishlijn komt, registreert de server het aantal aangepaste ronden en wordt de referentiecoureur vastgesteld.

#### 2. Berekening van Partiële Ronde
Om een eerlijke en nauwkeurige vergelijking te waarborgen, wordt de partiële rondevoortgang van de referentiecoureur berekend op basis van de verstreken tijd sinds diens laatste doorkomst:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Als de referentiecoureur nog geen geldige mediane rondetijd heeft ($\le 0$) of $\text{TimeSinceLastLap} \le 0$, is de partiële ronde $0.0$. De waarde wordt begrensd op maximaal $0.99$ om afronding naar een hele ronde voor de feitelijke doorkomst te voorkomen.

#### 3. Effectief Rondenverschil
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

De coureur behoudt deze berekende waarde tot diens eigen volgende rondeovergang.

---

## Vergelijking van Berekeningsmodi

| Eigenschap | Altijd tijd (`always_time`) | Ronden en tijd (`laps_and_time`) | Altijd ronden (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Aanpak** | Continue wiskundige pace-projectie | Exacte tijdstempels bij finishdoorkomst | Rondenverschil met partiële ronde |
| **Gedubbelde Auto's** | Berekende seconden (bijv. `+14.820`) | Tekst met rondenachterstand (`+1 Ronde`) | Decimaal rondenverschil (bijv. `+2.45`) |
| **In Zelfde Ronde** | Tijdsverschil in seconden (`+1.450`) | Exact tijdsverschil aan de lijn (`+1.450`) | Decimaal rondenverschil (bijv. `+0.28`) |
| **Decimale Basis** | Tijddecimalen (1 tot 3) | Tijddecimalen (1 tot 3) | Rondedecimalen (0 tot 3) |
| **Updatemoment** | Continue projectie-updates | Finishlijnovergang | Eigen voltooide ronde |
| **Ideale Toepassing** | Slotcar pacing, kwalificaties | F1 TV-uitzendingsborden | Rondegebaseerde langeafstandsraces |

---

## Verschil-Widgets Gebruiken in de UI-Editor

### 1. In Rasters en Ranglijsten
Selecteer in de UI-Editor uw Raster-widget en open het tabblad **Kolommen**. Vink onder **Gaps & Intervallen** **Heat-verschil** (`gap`) of **Algemeen verschil** (`overallGap`) aan:
- Selecteer de kolomkaart om de **Kolom-inspector** te openen.
- Kies onder **Verschilconfiguratie** het **Doel** (*Leider* of *Voorgaande positie*) en de **Berekeningsmodus** (*Altijd tijd*, *Ronden en tijd* of *Altijd ronden*).
- Meerdere verschilkolommen met verschillende instellingen kunnen gelijktijdig aan hetzelfde raster worden toegevoegd.

### 2. Afzonderlijke Baanvak-kaarten
Sleep verschil-widgets rechtstreeks van de gereedschapskist naar het canvas en stel doel en modus in via de inspector.

### 3. Inset-Gegevens
Verschillen kunnen als sub-badge in andere baanvak-kaarten worden ingevoegd door `gap` of `overallGap` toe te wijzen aan een van de 8 ankerposities.

---

## Integratie met Tekst-naar-Spraak (TTS), Audio & Export

- **Tekst-naar-Spraak (TTS)**: `{driver.gapLeader}` en `{driver.gapPosition}`.
- **Aangepaste HTML/JS-widgets**: `driver.gap_leader` en `driver.gap_position`.
- **Excel-exports**: `${driver.gapLeader}` en `${driver.gapPosition}`.
