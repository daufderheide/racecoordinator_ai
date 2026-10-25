# Calcoli dei Distacchi e Widget Distacco (Gaps)

Race Coordinator AI include un motore server per il calcolo automatizzato dei distacchi (`GapCalculator`), che determina in tempo reale i distacchi cronometrici e gli intervalli in giri tra i concorrenti. Tutti i calcoli vengono eseguiti continuamente sul server e sincronizzati con i display del client, i widget personalizzati, gli avvisi vocali e le esportazioni in fogli di calcolo.

---

## Panoramica dei Calcoli dei Distacchi

A ogni aggiornamento della classifica, il motore ordina i concorrenti in base all'ordine di gara corrente secondo le regole di punteggio attive (Maggior numero di giri, Tempo totale più veloce o Punti). Vengono quindi calcolate le metriche di distacco rispetto a due riferimenti distinti:

- **Distacco dal Leader (`leader`)**: L'intervallo tra un concorrente e il leader attuale della gara (P1). Il distacco del leader da se stesso è sempre `0.0` (visualizzato come `--`).
- **Distacco dal Pilota che Precede (`position`)**: L'intervallo tra un concorrente e l'auto immediatamente avanti in classifica (es. P3 rispetto a P2). Il distacco del leader è sempre `0.0` (visualizzato come `--`).

### Ambiti dei Dati: Distacchi Manche vs Distacchi Generali

Race Coordinator AI supporta la valutazione dei distacchi su due ambiti:

| Ambito | Chiave Colonna | Descrizione | Caso d'Uso |
| :--- | :--- | :--- | :--- |
| **Dati Manche (Heat Data)** | `gap` | Valuta i distacchi esclusivamente tra le auto attualmente in pista nella manche attiva. I piloti a riposo mostrano trattini (`--`). | Gare live, schede corsia, classifiche manche live. |
| **Dati Generali (Overall Data)** | `overallGap` | Valuta i distacchi cumulativi su tutti i partecipanti all'evento, attraverso tutte le manche completate. | Griglie generali, classifiche di campionato. |

> [!NOTE]
> I layout esistenti che utilizzano le chiavi precedenti (`gapLeader`, `gapPosition`, `gapLeaderF1`, `gapPositionF1`, `overallGapLeader`, ecc.) vengono migrati automaticamente al caricamento a `gap` o `overallGap` con le relative impostazioni di obiettivo e modalità di calcolo.

---

## I 2 Widget Distacco Configurabili

Race Coordinator AI fornisce **2 widget distacco configurabili** (disponibili come colonne di griglia, schede corsia autonome e riquadri interni personalizzati):

```
                          ┌──────────────────────────────────────────────┐
                          │           WIDGET DISTACCO DI GARA            │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
      ┌─────────────────────────┐                                 ┌─────────────────────────┐
      │  DISTACCO MANCHE (`gap`)│                                 │DISTACCO GENERALE(`overallGap`)│
      │   Piloti Manche Attiva  │                                 │ Tutti i Partecipanti    │
      └────────────┬────────────┘                                 └────────────┬────────────┘
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                   ┌───────────────────────┐           ┌───────────────────────┐
                   │  SELETTORE OBIETTIVO  │           │  MODALITÀ DI CALCOLO  │
                   ├───────────────────────┤           ├───────────────────────┤
                   │ • Leader (P1)         │           │ • Sempre tempo        │
                   │ • Posizione precedente│           │ • Giri e tempo (F1)   │
                   │                       │           │ • Sempre giri         │
                   └───────────────────────┘           └───────────────────────┘
```

### Selezione dell'Obiettivo
- **Leader (`leader`)**: Intervallo relativo al leader attuale della gara (P1). Il leader mostra trattini (`--`).
- **Posizione precedente (`position`)**: Intervallo relativo all'auto immediatamente avanti in classifica (es. P3 vs P2). Il leader mostra trattini (`--`).

### Modalità di Calcolo
1. **Sempre tempo (`always_time`)**:
   - Proiezione matematica continua del passo in secondi.
   - Formattato come `+X.XXX` con decimali di tempo configurabili (da 1 a 3 cifre decimali).
2. **Giri e tempo (`laps_and_time`)**:
   - Visualizzazione stile trasmissione Formula 1.
   - Mostra secondi (`+X.XXX`) se sullo stesso giro.
   - Mostra giri di ritardo (`+1 Giro`, `+N Giri`) in caso di doppiaggio.
3. **Sempre giri (`always_laps`)**:
   - Distacco esatto in giri calcolato ogni volta che un pilota taglia il traguardo per completare un giro.
   - Include l'avanzamento parziale del pilota obiettivo in quell'esatto momento.
   - Formattato con decimali di giro configurabili (da 0 a 3 cifre decimali).

---

## Formule di Calcolo Dettagliate

Tutti i calcoli vengono eseguiti in `com.antigravity.race.GapCalculator` sul server Java.

Sia `leadParticipant` il pilota che precede (leader o posizione $N-1$) e `curParticipant` il pilota inseguitore.

### 1. Formula: Sempre Tempo (`always_time`)

I distacchi temporali valutano tre scenari:

#### Scenario A: Stesso Numero di Giri Completati
$$\text{Gap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$

#### Scenario B: Nessun Giro Completato
$$\text{Gap} = \text{TotalTime}_{\text{lead}}$$

#### Scenario C: Numero Differente di Giri
$$\text{LapDiff} = \text{AdjustedLaps}_{\text{lead}} - \text{AdjustedLaps}_{\text{cur}}$$
$$\text{AvgLapTime}_{\text{cur}} = \text{AverageLapTime}(\text{curParticipant})$$

La formula di proiezione si adatta al **Metodo di Fine Gara**:
1. **Gare a Tempo**:
   $$\text{Gap} = \text{AvgLapTime}_{\text{cur}} \times \text{LapDiff}$$
2. **Gare a Giri**:
   $$\text{TimeDiff} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
   $$\text{ProjectedGap} = \text{TimeDiff} + (\text{AvgLapTime}_{\text{cur}} \times \text{LapDiff})$$

---

### 2. Formula: Formula 1 (`laps_and_time`)

#### 1. Verifica Doppiaggio
$$\text{LapsDown} = (\text{PhysicalLaps}_{\text{lead}} - \text{PhysicalLaps}_{\text{cur}}) - 1$$
- Se $\text{LapsDown} > 0$: Il pilota è doppiato (`+X Giri`).
- Se $\text{LapsDown} \le 0$: Il pilota è nel giro del leader.

#### 2. Distacco nel Giro del Leader
- **Stesso numero di giri completati**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{TotalTime}_{\text{lead}}$$
- **Il leader ha completato un giro in più**:
  $$\text{TimeGap} = \text{TotalTime}_{\text{cur}} - \text{leadParticipant.getTimeAtLap}(\text{PhysicalLaps}_{\text{cur}})$$

---

### 3. Formula: Sempre Giri (`always_laps`)

Misura il distacco esatto in giri al completamento di ogni giro:

#### 1. Attivazione al Completamento del Giro
Quando un pilota taglia il traguardo, il server registra i suoi giri e individua il pilota di riferimento.

#### 2. Calcolo del Giro Parziale
Per garantire un confronto equo, viene calcolato l'avanzamento parziale del pilota di riferimento in base al tempo trascorso dal suo ultimo giro:
$$\text{TimeSinceLastLap}_{\text{target}} = \text{CurrentElapsedTime} - \text{TimeOfLastLap}_{\text{target}}$$
$$\text{PartialLap}_{\text{target}} = \min\left(0.99, \max\left(0.0, \frac{\text{TimeSinceLastLap}_{\text{target}}}{\text{MedianLapTime}_{\text{target}}}\right)\right)$$

> [!NOTE]
> Se il pilota di riferimento non ha ancora un tempo mediano valido ($\le 0$) o $\text{TimeSinceLastLap} \le 0$, il giro parziale è $0.0$. Il valore è limitato a $0.99$ per evitare incrementi anticipati prima dell'effettivo passaggio sulla linea.

#### 3. Distacco Effettivo in Giri
$$\text{EffectiveLaps}_{\text{target}} = \text{AdjustedLaps}_{\text{target}} + \text{PartialLap}_{\text{target}}$$
$$\text{GapLaps} = \text{EffectiveLaps}_{\text{target}} - \text{AdjustedLaps}_{\text{competitor}}$$

Il pilota mantiene questo valore calcolato fino al completamento del proprio giro successivo.

---

## Confronto delle Modalità di Calcolo

| Caratteristica | Sempre tempo (`always_time`) | Giri e tempo (`laps_and_time`) | Sempre giri (`always_laps`) |
| :--- | :--- | :--- | :--- |
| **Approccio** | Proiezione matematica continua del passo | Confronti esatti al passaggio sulla linea | Distacco in giri con avanzamento parziale |
| **Auto Doppiate** | Secondi stimati (es. `+14.820`) | Testo giri persi (es. `+1 Giro`) | Delta decimale in giri (es. `+2.45`) |
| **Nel Giro del Leader** | Differenza in secondi (`+1.450`) | Distacco esatto sul traguardo (`+1.450`) | Delta decimale in giri (es. `+0.28`) |
| **Base Decimale** | Decimali di tempo (da 1 a 3) | Decimali di tempo (da 1 a 3) | Decimali di giri (da 0 a 3) |
| **Momento Aggiornamento**| Aggiornamenti continui | Passaggio sul traguardo | Passaggio personale a completamento giro |
| **Applicazione Ideale** | Pacing slot car, prove a tempo | Tabelloni TV in stile Formula 1 | Gare di durata a giri |

---

## Utilizzo dei Widget Distacco nell'Editor dell'Interfaccia

### 1. In Griglie e Classifiche
Nell'Editor dell'Interfaccia, selezionare il widget Griglia e aprire la scheda **Colonne**. Sotto **Gaps e Intervalli**, attivare **Distacco Manche** (`gap`) o **Distacco Generale** (`overallGap`):
- Selezionare la colonna per aprire l'**Ispettore Colonne**.
- In **Configurazione distacco**, selezionare l'**Obiettivo** (*Leader* o *Posizione precedente*) e la **Modalità di calcolo** (*Sempre tempo*, *Giri e tempo* o *Sempre giri*).
- È possibile aggiungere contemporaneamente alla stessa griglia più colonne distacco con obiettivi o modalità diverse.

### 2. Schede Corsia Autonome
Trascinare i widget distacco direttamente dalla barra degli strumenti sulla tela e configurare obiettivo e modalità nell'ispettore.

### 3. Riquadri Interni (Insets)
I distacchi possono essere incorporati come badge secondari nelle schede corsia assegnando `gap` o `overallGap` a una delle 8 posizioni di ancoraggio.

---

## Integrazione con Sintesi Vocale (TTS), Audio ed Esportazione

- **Sintesi Vocale (TTS)**: `{driver.gapLeader}` e `{driver.gapPosition}`.
- **Widget personalizzati HTML/JS**: `driver.gap_leader` e `driver.gap_position`.
- **Esportazioni Excel**: `${driver.gapLeader}` e `${driver.gapPosition}`.
