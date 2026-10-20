# Calcoli dei Distacchi & Widget Distacco (Gaps)

Race Coordinator AI dispone di un motore automatizzato lato server per il calcolo dei distacchi (`GapCalculator`), che calcola in tempo reale i distacchi cronometrici e le differenze di giri tra i concorrenti. Tutti i calcoli avvengono sul server e vengono sincronizzati con l'interfaccia client, i widget personalizzati, gli annunci vocali (TTS) e le esportazioni in fogli di calcolo.

---

## Panoramica dei Calcoli dei Distacchi

Ogni volta che la classifica si aggiorna, il motore ordina tutti i piloti in base all'ordine di marcia attuale secondo il sistema di punteggio attivo (Maggior Numero di Giri, Tempo Totale Più Rapido o Punti). Successivamente, le metriche di distacco vengono calcolate rispetto a due riferimenti distinti:

- **Distacco dal Leader (`gapLeader` / `overallGapLeader`)**: Il distacco temporale tra un pilota e la 1ª posizione della gara (P1). Il distacco del leader rispetto a se stesso è sempre `0.0` (visualizzato come `--`).
- **Distacco dal Pilota che Precede (`gapPosition` / `overallGapPosition`)**: Il distacco temporale tra un pilota e l'auto immediatamente avanti in classifica (ad esempio, P3 rispetto a P2). Il distacco della 1ª posizione è sempre `0.0` (visualizzato come `--`).

### Ambiti dei Dati: Distacchi di Manche vs. Distacchi Generali

Race Coordinator AI supporta la valutazione dei distacchi su due ambiti distinti:

| Ambito | Chiavi di Colonna | Descrizione | Caso d'Uso |
| :--- | :--- | :--- | :--- |
| **Dati di Manche (Heat Data)** | `gapLeader`<br>`gapPosition`<br>`gapLeaderF1`<br>`gapPositionF1` | Valuta i distacchi esclusivamente tra le vetture che stanno gareggiando nella manche attiva. I piloti a riposo mostrano trattini (`--`). | Gare dal vivo, schede corsia, classifiche di manche. |
| **Dati Generali (Overall Data)** | `overallGapLeader`<br>`overallGapPosition`<br>`overallGapLeaderF1`<br>`overallGapPositionF1` | Valuta i distacchi cumulativi dell'evento tra tutti i piloti iscritti, su tutte le manche completate. | Tabelloni di classifica generale, monitoraggio campionati. |

---

## I 4 Widget di Distacco Supportati

Race Coordinator AI mette a disposizione **4 widget di distacco specifici** (disponibili come colonne di griglia, schede corsia autonome e riquadri inset personalizzati):

```
                          ┌──────────────────────────────────────────────┐
                          │            WIDGET DISTACCHI DI GARA          │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │    DISTACCHI STANDARD   │                                 │   DISTACCHI FORMULA 1   │
      │   Proiezione del Passo  │                                 │ Passaggio Linea Arrivo  │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
         ┌─────────┴─────────┐                                       ┌─────────┴─────────┐
         ▼                   ▼                                       ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                         ┌─────────────┐     ┌─────────────┐
  │ Gap Leader  │     │Gap Position │                         │Gap Leader F1│     │Gap Pos. F1  │
  │ (Leader P1) │     │ (Pilota Av) │                         │ (Leader P1) │     │ (Pilota Av) │
  └─────────────┘     └─────────────┘                         └─────────────┘     └─────────────┘
```

### 1. Distacco dal Leader (Standard)
- **Chiavi Strumenti**: `gapLeader` (Manche) / `overallGapLeader` (Generale)
- **Gruppo Strumenti**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etichette Predefinite**: `HEAT GAP LEADER`, `OVERALL GAP LEADER` o `GAP LEADER`
- **Modello di Misurazione**: Proiezione matematica continua del passo.
- **Visualizzazione**: Formattato come `+X.XXX` secondi con cifre decimali configurabili (da 1 a 3 decimali). Il leader mostra `--`.
- **Scopo**: Fornisce una stima in tempo reale del ritardo temporale rispetto al leader. Anche se il leader ha completato più giri, proietta il ritardo in base al passo medio del concorrente inseguitore.

### 2. Distacco dal Pilota che Precede (Standard)
- **Chiavi Strumenti**: `gapPosition` (Manche) / `overallGapPosition` (Generale)
- **Gruppo Strumenti**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etichette Predefinite**: `HEAT GAP POSITION`, `OVERALL GAP POSITION` o `GAP POSITION`
- **Modello di Misurazione**: Proiezione matematica continua del passo.
- **Visualizzazione**: Formattato come `+X.XXX` secondi. La 1ª posizione mostra `--`.
- **Scopo**: Indica il distacco cronometrico necessario per superare il pilota immediatamente avanti. Essenziale per i duelli diretti.

### 3. Distacco Formula 1 dal Leader (`F1`)
- **Chiavi Strumenti**: `gapLeaderF1` (Manche) / `overallGapLeaderF1` (Generale)
- **Gruppo Strumenti**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etichette Predefinite**: `HEAT GAP LEADER LAP`, `OVERALL GAP LEADER LAP` o `GAP LEADER`
- **Modello di Misurazione**: Misurazione cronometrica fisica al passaggio sulla linea del traguardo.
- **Visualizzazione**:
  - **Nello stesso giro**: `+X.XXX` secondi di differenza temporale all'attraversamento della linea.
  - **Piloti doppiati**: Sostituisce il tempo con `+1 Giro` o `+N Giri` (`RD_LAP_DOWN` / `RD_LAPS_DOWN`).
  - **Leader**: Mostra `--`.
- **Scopo**: Emula la grafica televisiva della Formula 1, mostrando chiaramente i giri di distacco per le auto doppiate anziché cifre temporali sproporzionate.

### 4. Distacco Formula 1 dal Pilota che Precede (`F1`)
- **Chiavi Strumenti**: `gapPositionF1` (Manche) / `overallGapPositionF1` (Generale)
- **Gruppo Strumenti**: *Heat Data → Gaps & Intervals* / *Overall Race Data → Overall Gaps & Intervals*
- **Etichette Predefinite**: `HEAT GAP POSITION LAP`, `OVERALL GAP POSITION LAP` o `GAP POSITION`
- **Modello di Misurazione**: Misurazione cronometrica fisica al passaggio sulla linea del traguardo.
- **Visualizzazione**:
  - **Nello stesso giro**: Formattato come `+X.XXX` secondi dal concorrente precedente.
  - **Doppiato dall'auto precedente**: Mostra `+1 Giro` o `+N Giri`.
  - **Leader**: Mostra `--`.
- **Scopo**: Fornisce un'esperienza autentica nelle sfide ravvicinate, indicando subito i giri persi nei confronti dell'auto precedente.

---

## Formule di Calcolo Dettagliate

Tutti i calcoli matematici sono implementati in `com.antigravity.race.GapCalculator` sul server Java.

Sia `leadParticipant` il pilota che precede e `curParticipant` il pilota inseguitore.

### Matematica dei Distacchi Standard

Vengono gestiti tre scenari di giri:

#### Scenario A: Stesso Numero di Giri
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Scenario B: Nessun Giro Completo
Se l'inseguitore non ha ancora completato un giro valido (`hasNoFullLaps()`):
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Scenario C: Diverso Numero di Giri
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La formula di proiezione varia a seconda del **Metodo di Fine Gara (Finish Method)**:

1. **Gare a Tempo (Timed Finish)**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$

2. **Gare a Giri (Lap Finish)**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

   > [!NOTE]
   > Qualora $\text{ProjectedGap}$ risultasse negativo a causa di anomalie di cronometraggio, il sistema impiega $\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$.

---

### Matematica dei Distacchi Formula 1

#### 1. Giri di Distacco (Laps Down)
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$

- Se $\text{LapsDown} > 0$: L'inseguitore è doppiato. Il distacco temporale è impostato su `0.0` e l'interfaccia mostra `+X Giri`.
- Se $\text{LapsDown} \le 0$: L'inseguitore si trova nel giro del leader ($\text{LapsDown} = 0$).

#### 2. Distacco nel Giro del Leader
- **Stesso Numero di Giri Fisici Completati**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Il Leader ha Completato un Giro in Più**: Il distacco viene misurato al momento in cui il leader ha completato lo stesso giro:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

> [!TIP]
> Se il distacco temporale calcolato risultasse negativo, viene forzato a `0.0`.

---

## Confronto: Distacchi Standard vs. Distacchi Formula 1

| Caratteristica | Distacchi Standard (`gapLeader`, `gapPosition`) | Distacchi Formula 1 (`gapLeaderF1`, `gapPositionF1`) |
| :--- | :--- | :--- |
| **Approccio di Calcolo** | Proiezione statistica continua del passo | Confronto temporale esatto al traguardo |
| **Auto Doppiate** | Secondi stimati (es. `+14.820`) | Testo giri persi (es. `+1 Giro`, `+2 Giri`) |
| **Nello Stesso Giro** | Differenza di tempo in secondi (`+1.450`) | Distacco reale al traguardo (`+1.450`) |
| **Fine Gara** | Distingue tra gare a tempo e a giri | Basato sul passaggio sulla linea del traguardo |
| **Utilizzo Ottimale** | Controllo continuo del ritmo nello slot racing | Grafiche televisive, schermi per spettatori |

---

## Utilizzo dei Widget nell'Editor UI

### 1. In Griglie e Classifiche
Nell'Editor UI, selezionare il widget Grid e accedere alla scheda **Colonne**. Nei sottogruppi **Gaps & Intervals** o **Overall Gaps & Intervals**, attivare le colonne desiderate e impostare i decimali.

### 2. Schede Corsia Autonome
Trascinare il widget distacco direttamente sul canvas e collegarlo a una **Corsia Specifica**, una **Posizione di Manche** o alla **Classifica Generale**.

### 3. Inset su Altre Schede
Integrare il distacco come badge secondario all'interno di un'altra scheda corsia tramite le 8 ancore disponibili nella sezione **Card Insets**.

---

## Integrazione con Sintesi Vocale (TTS), Audio ed Export

- **Sintesi Vocale (TTS)**:
  - `{driver.gapLeader}`: Distacco dal leader pronunciato in secondi.
  - `{driver.gapPosition}`: Distacco dal pilota precedente pronunciato in secondi.
- **Widget HTML/JS Personalizzati**: `driver.gap_leader` e `driver.gap_position`.
- **Modelli Excel (XLS)**:
  - `${driver.gapLeader}` e `${driver.gapPosition}` (Classifica generale).
  - `${heatDriver.gapLeader}` e `${heatDriver.gapPosition}` (Risultati di manche).
