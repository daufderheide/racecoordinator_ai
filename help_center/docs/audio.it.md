# Sistema Audio

Race Coordinator AI include un motore audio avanzato a doppio canale, progettato per offrire effetti sonori coinvolgenti, commenti vocali dinamici e annunci di direzione gara essenziali, senza sovrapposizioni caotiche né segnali persi.

---

## Architettura Audio a Doppio Canale

Il motore audio suddivide i suoni in due canali distinti:

```
                      ┌────────────────────────────────────────┐
                      │          Dispatcher Audio              │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Effetti Sonori (SFX) │                      │     Annunci Vocali     │
     │     (Toni Brevi)       │                      │   (TTS e Commenti)     │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
         Riproduzione Polifonica                       Voce Singola Prioritaria
       (Suoni simultanei permessi)                   ("Riproduci, Sostituisci,
                  │                                         Scarta")          
                  │◄────────── Attenuazione Automatica (Ducking) ─┤
                  │ (I suoni SFX scendono automaticamente al 20%  │
                  │   del volume mentre la voce sta parlando)     │
```

### 1. Effetti Sonori (SFX)
- **Cosa comprende:** Segnali acustici non verbali come bip di passaggio traguardo (`default_beep`), effetti sfrecciata (`default_driveby`) o rintocchi.
- **Riproduzione Polifonica:** Vengono riprodotti all'istante tramite elementi audio HTML5. Se più veicoli tagliano il traguardo nello stesso momento, ciascun tono suona contemporaneamente senza interruzioni.
- **Attenuazione Automatica (Audio Ducking):** Durante la riproduzione di un messaggio vocale, il volume degli effetti sonori simultanei viene automaticamente abbassato al **20%**. Al termine del messaggio, gli effetti tornano subito al 100% del volume.

### 2. Annunci Vocali Parlati
- **Cosa comprende:** Sintesi vocale (TTS) e registrazioni vocali (commenti, sirene di bandiera gialla, avvisi di ingresso ai box e conti alla rovescia).
- **Motore a Voce Singola:** Gestito tramite la regola **"Riproduci, Sostituisci o Scarta"**, impedendo che più voci parlino contemporaneamente.

---

## Il Sistema di Priorità

Per gestire i numerosi eventi di gara simultanei, Race Coordinator AI adotta una scala di 4 livelli di priorità:

### Livelli di Priorità

| Livello | Peso | Eventi Tipici | Comportamento in Caso di Conflitto |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Urgente) | 4 | Bandiera gialla, manche terminata, gara conclusa, falsa partenza, tempo minimo sul giro, giro di drift, sosta ai box, avvisi carburante (avviso, critico, esaurito). | **Interrompe** subito qualsiasi voce di priorità inferiore. Se un altro messaggio urgente è già attivo, i nuovi annunci urgenti vengono messi nella **Coda Urgente**. Ignora la pausa di cadenza. |
| **`high`** (Alta) | 3 | Record assoluto della pista, record assoluto di corsia, nuovo leader di gara, miglior giro di gara. | **Interrompe** annunci di priorità `normal` o `low`. Viene **scartato** se è attivo un messaggio `urgent` o di priorità pari/superiore. |
| **`normal`** (Normale) | 2 | Annunci di tempo (es. "30 secondi rimanenti"), metà manche, miglior giro di manche, miglior giro di corsia di gara, nuovo leader di manche, record personale del pilota (se configurato come TTS). | **Interrompe** annunci `low`. Viene **scartato** se è attivo un messaggio `urgent`, `high` o un altro annuncio `normal`. |
| **`low`** (Bassa) | 1 | Suono di passaggio giro standard del pilota (se configurato come TTS). | Viene riprodotto solo se il canale vocale è completamente libero. Viene **scartato** se un altro annuncio è in corso. |

### Regole sui Conflitti

1. **Sostituzione (Preemption):** Se arriva un evento con priorità più alta del messaggio in corso, la voce attuale si interrompe all'istante per far parlare la nuova priorità.
2. **Scarto (Dropping):** Se un evento in arrivo ha priorità pari o inferiore a quello attuale, viene ignorato per non sovrapporre le voci.
3. **Coda Urgente (Urgent Queueing):** Gli avvisi urgenti riguardano la sicurezza di gara. Se un avviso urgente arriva mentre un altro sta parlando, viene accodato e riprodotto non appena il precedente finisce.
4. **Pausa di Cadenza (Callout Spacing):** Al termine di ogni annuncio vocale, viene rispettato un breve intervallo di silenzio prima di avviare il messaggio successivo, evitando discorsi concitati.

### Priorità dei Traguardi e Ripristino di Riserva (Milestone Priority & Fallback)

Quando un pilota completa un giro che attiva uno o più traguardi (record di pista, miglior giro di manche o cambio leader):

1. **Cascata di priorità per eventi simultanei:** I suoni dei traguardi candidati vengono valutati in stretto ordine di priorità (Record assoluto -> Record assoluto di corsia -> Nuovo leader di gara -> Nuovo leader di manche -> Miglior giro di gara -> Miglior giro di corsia di gara -> Miglior giro di manche -> Record personale). Se il suono a priorità più alta è impostato su `none` (o non configurato), il sistema passa al suono successivo a priorità più alta attivato in quel giro e lo riproduce se configurato.
2. **Annunci scartati per canale occupato:** Se un annuncio vocale selezionato viene **scartato** perché un annuncio a priorità più alta sta parlando (o durante una pausa di cadenza), non verrà tentato nessun altro annuncio vocale per quel giro. Il sistema passa direttamente al suono di **record personale** (se giro PB) o al **suono di giro standard**.
3. **Ripristino polifonico SFX:** Se il suono di riserva è un effetto sonoro (SFX), viene riprodotto in modalità polifonica, garantendo al pilota una risposta acustica immediata a ogni passaggio sul traguardo.

---

## Impostazioni di Configurazione Audio

Le opzioni globali sono accessibili nell'**Editor dell'Interfaccia**, sezione **Impostazioni Audio**:

### Volume Principale (Master Volume)
- **Intervallo:** Da 0% a 100% (Predefinito: `100%`)
- **Descrizione:** Regola il limite di volume generale per l'intera applicazione, applicato sia agli effetti sonori che alla sintesi vocale.

### Timeout Coda Urgente (TTL)
- **Opzioni:** `3 secondi`, `5 secondi (Predefinito)`, `10 secondi`
- **Descrizione:** Durata massima di permanenza di un messaggio nella coda urgente. I messaggi scaduti vengono scartati per non segnalare situazioni ormai superate.

### Spaziatura Annunci (Pausa di Cadenza)
- **Opzioni:** `Nessuno (0s)`, `Breve (500ms - Predefinito)`, `Normale (1000ms)`, `Rilassata (1500ms)`
- **Descrizione:** Silenzio minimo tra due annunci vocali consecutivi. Gli avvisi urgenti ignorano all'istante questa pausa.

---

## Configurazione Sintesi Vocale (TTS)

Race Coordinator AI si appoggia all'API Web Speech nativa del browser web, garantendo sintesi vocale istantanea senza dipendere da servizi cloud esterni né da una connessione internet attiva.

### Parametri Vocali TTS

| Impostazione | Opzioni / Intervallo | Valore Predefinito | Descrizione |
| :--- | :--- | :---: | :--- |
| **Voce TTS** | Voci del browser / SO | `-- Predefinito di sistema --` | Seleziona la voce desiderata (con codice lingua come `it-IT`, `en-US`). |
| **Velocità (Rate)** | Da `0.1x` a `2.0x` | `1.0x` | Velocità della voce. Valori più rapidi (`1.1x`–`1.3x`) sono ideali per tracciati con tempi sul giro molto brevi. |
| **Tonalità (Pitch)** | Da `0.0x` a `2.0x` | `1.0x` | Modifica l'intonazione vocale. |
| **Volume TTS** | Da `0%` a `100%` | `100%` | Volume della voce prima della moltiplicazione con il Volume Principale (`masterVolume * ttsVolume`). |
| **Pulsante Prova Voce** | Pulsante | — | Riproduce una frase dimostrativa con le impostazioni correnti. |

### Variabili Dinamiche TTS

I testi TTS consentono l'inserimento di variabili tra parentesi graffe `{...}` o `${...}`:
- `{driver.name}`, `{driver.nickname}`: Nome e soprannome del pilota.
- `{driver.lastLapTime}`, `{driver.bestLapTime}`: Tempi sul giro (arrotondati in automatico a 3 decimali).
- `{driver.totalLaps}` / `{driver.lapCount}`: Giri completati.
- `{driver.gapLeader}`, `{driver.gapPosition}`: Distacchi dal leader o dal pilota che precede.
- `{race.name}`, `{track.name}`, `{heat.number}`: Dettagli della gara.

Consultare la [Guida Text-to-Speech (TTS)](tts.md) per l'elenco completo.

---

## Rilevanza Audio e Filtraggio Multischermo

Nelle configurazioni con più monitor (schermo principale, postazioni pilota, monitor box), la **Rilevanza Audio** garantisce che ciascun monitor riproduca solo i suoni attinenti a ciò che vi è visualizzato.

### 1. Associazioni Audio (Audio Associations)
Ogni suono include metadati identificativi:
- **`widgetType`**: Area funzionale (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: Indice della corsia (partendo da 0).
- **`driverId`**: ID univoco del pilota.

### 2. Filtraggio in Base al Layout sullo Schermo Principale
- **Corsie (`lane-view`):** Se il layout non contiene alcun riquadro di corsia, i suoni di giro dei piloti vengono silenziati.
- **Conto alla Rovescia (`countdown`):** In assenza del widget del conto alla rovescia, i bip di partenza vengono disattivati.
- **Cronometro (`timer`):** Senza widget del timer, non vengono annunciati i tempi intermedi o finali.
- **Bandiere (`flag`):** Senza widget bandiera, i suoni di bandiera gialla o fine gara vengono disattivati.

### 3. Postazioni Pilota Isolate (`scoped`)
Sullo schermo di una postazione pilota (`/driver-station/:lane`):
- Il filtro lavora in modalità delimitata (**`scoped`**).
- Vengono riprodotti solo i suoni, record e allarmi carburante del **pilota di quella specifica corsia**.
- I suoni degli altri piloti vengono scartati per non deconcentrare chi guida.
- Gli avvisi globali (partenza, bandiera gialla, fine manche) rimangono regolarmente attivi.

### 4. Motori Audio Indipendenti per Finestra
Ciascuna schermata esegue un'istanza separata di `AudioService` (`providers: [AudioService]`). I suoni di una postazione pilota non ostacolano mai la postazione del direttore di gara.

---

---

## Catalogo Completo delle Risorse Audio

Le seguenti tabelle descrivono in dettaglio tutti gli eventi audio in Race Coordinator AI, il rispettivo tipo di suono (SFX non verbale vs. annuncio vocale verbale), il livello di priorità e la portata di rilevanza a schermo.

### Eventi Audio del Pilota (Configurati nell'Editor Piloti)

| Evento Audio del Pilota | Quando viene riprodotto | File / Risorsa Predefinita | Tipo di Suono | Livello di Priorità | Rilevanza e Schermata |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Suono Giro** | Riprodotto a ogni giro standard completato (o come fallback se l'annuncio di record viene scartato o non è configurato). | `default_beep` | **SFX** (Predefinito) / **Annuncio Vocale** (TTS) | `low` (Peso 1 con TTS; Polifonico con SFX) | `lane-view`: Ripreso su Schermata Principale (se presente widget corsia) e su Postazione Pilota di quella corsia/pilota. |
| **Suono Miglior Giro Personale** | Riprodotto quando il pilota ottiene il proprio miglior tempo sul giro della manche o sessione corrente. | `default_driveby` | **SFX** (Predefinito) / **Annuncio Vocale** (TTS) | `normal` (Peso 2 con TTS; Polifonico con SFX) | `lane-view`: Ripreso su Schermata Principale (se presente widget corsia) e su Postazione Pilota di quella corsia/pilota. |
| **Suono Miglior Giro della Gara** | Riprodotto quando si registra il giro più veloce dell'intera gara tra tutte le manche e corsie. | `default_best_race_lap` | **Annuncio Vocale** | `high` (Peso 3) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono Miglior Giro di Corsia della Gara** | Riprodotto quando si ottiene il miglior tempo su quella specifica corsia durante la gara in corso. | `default_best_race_lane_lap` | **Annuncio Vocale** | `normal` (Peso 2) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono Miglior Giro della Manche** | Riprodotto quando si ottiene il giro più veloce tra tutti i piloti nella manche attiva. | `default_best_heat_lap` | **Annuncio Vocale** | `normal` (Peso 2) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono nuovo leader della gara** | Riprodotto quando un pilota conquista il primo posto nella classifica generale della gara. | `default_new_race_leader` | **Annuncio Vocale** | `high` (Peso 3) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono nuovo leader di manche** | Riprodotto quando un pilota passa in testa alla classifica della manche attiva. | `default_new_heat_leader` | **Annuncio Vocale** | `normal` (Peso 2) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono Record Assoluto del Giro** | Riprodotto quando viene battuto il record storico assoluto della pista su qualsiasi corsia. | `default_record_lap` | **Annuncio Vocale** | `high` (Peso 3) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono Record di Corsia Assoluto del Giro** | Riprodotto quando viene battuto il record storico della pista su quella specifica corsia. | `default_record_lane_lap` | **Annuncio Vocale** | `high` (Peso 3) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono Entrata ai Box** | Riprodotto quando l'auto entra nella corsia dei box o nell'area di rifornimento. | `default_pit_in` | **Annuncio Vocale** | `urgent` (Peso 4) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suoni Livello Carburante** | Riprodotti quando il livello di carburante scende alle soglie di avviso, critico o riserva/vuoto. | `default_fuel_level` (Set Audio) | **Annuncio Vocale** | `urgent` (Peso 4) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Suono di Falsa Partenza** | Riprodotto quando viene rilevata una falsa partenza o infrazione al via. | `default_penalty` | **Annuncio Vocale** | `urgent` (Peso 4) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |

### Eventi Audio dei Temi (Configurati nell'Editor Temi)

| Slot Audio | Chiave Predefinita | Tipo di Suono | Livello di Priorità | Rilevanza e Schermata |
| :--- | :--- | :--- | :---: | :--- |
| **Conto alla Rovescia di Partenza** | `audio.countdown` | **Annuncio Vocale** / Set Audio | `urgent` | `countdown`: Ripreso su Schermata Principale (se presente widget conto alla rovescia) e su tutte le Postazioni Pilota. |
| **Luce Verde / VIA** | `audio.countdown.green` | **Annuncio Vocale** / Tono Predefinito | `urgent` | `countdown`: Ripreso su Schermata Principale (se presente widget conto alla rovescia) e su tutte le Postazioni Pilota. |
| **Bandiera Gialla** | `audio.yellowflag` | **Annuncio Vocale** (Sirena di Avviso) | `urgent` (Peso 4) | `flag`: Ripreso su Schermata Principale (se presente widget bandiera) e su tutte le Postazioni Pilota. |
| **Secondi Rimanenti Avvio Automatico** | `audio.auto_start` | **Annuncio Vocale** / Set Audio (Predefinito: TTS) | `normal` (Peso 2) | `timer`: Ripreso su Schermata Principale (se presente widget timer) e su tutte le Postazioni Pilota. |
| **Secondi Rimanenti** | `audio.seconds_left` | **Annuncio Vocale** | `normal` (Peso 2) | `timer`: Ripreso su Schermata Principale (se presente widget timer) e su tutte le Postazioni Pilota. |
| **Giri Rimanenti** | `audio.laps_left` | **Annuncio Vocale** / Set Audio | `normal` (Peso 2) | `timer`: Ripreso su Schermata Principale (se presente widget timer) e su tutte le Postazioni Pilota. Annuncia i giri rimanenti per il leader; un valore pari a 0 annuncia quando il leader raggiunge il numero di giri previsti (es. "Leader al traguardo" nelle gare con consenti arrivo). |
| **Metà Manche** | `audio.seconds_left.halfway` | **Annuncio Vocale** | `normal` (Peso 2) | `timer`: Ripreso su Schermata Principale (se presente widget timer) e su tutte le Postazioni Pilota al raggiungimento della metà manche (per tempo o quando il leader completa la metà dei giri). |
| **Manche Terminata** | `audio.heat_over` | **Annuncio Vocale** | `urgent` (Peso 4) | `flag`: Ripreso su Schermata Principale (se presente widget bandiera) e su tutte le Postazioni Pilota. |
| **Secondi Rimanenti Avanzamento Automatico** | `audio.auto_advance` | **Annuncio Vocale** / Set Audio (Predefinito: TTS) | `normal` (Peso 2) | `timer`: Ripreso su Schermata Principale (se presente widget timer) e su tutte le Postazioni Pilota. |
| **Gara Conclusa** | `audio.race_over` | **Annuncio Vocale** | `urgent` (Peso 4) | `flag`: Ripreso su Schermata Principale (se presente widget bandiera) e su tutte le Postazioni Pilota. |
| **Tempo Minimo sul Giro** | `audio.min_lap_time` | **Annuncio Vocale** | `urgent` (Peso 4) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |
| **Giro Drift** | `audio.drift_lap` | **Annuncio Vocale** | `urgent` (Peso 4) | `lane-view`: Ripreso su Schermata Principale e su Postazione Pilota di quella corsia/pilota. |

---

## Riepilogo Configurazione Audio

| Sezione | Cosa è possibile configurare |
| :--- | :--- |
| **Editor Interfaccia -> Impostazioni Audio** | Volume principale, tempo di attesa coda urgente, spaziatura annunci, voce TTS, velocità, tonalità, volume voce e test audio. |
| **Editor Temi** | Suoni di sistema: conto alla rovescia, luce verde, sirena bandiera gialla, tempo residuo, metà manche, fine manche, fine gara, tempo minimo e giro drift. |
| **Editor Piloti** | Suoni specifici del pilota: Suono Giro, Suono Miglior Giro Personale, Suono Miglior Giro della Gara, Suono Miglior Giro di Corsia della Gara, Suono Miglior Giro della Manche, Suono nuovo leader della gara, Suono nuovo leader di manche, Suono Record Assoluto del Giro, Suono Record di Corsia Assoluto del Giro, Suono Entrata ai Box, Suoni Livello Carburante e Suono di Falsa Partenza. |
| **Gestore Asset** | Caricamento e gestione dei file WAV, MP3 e OGG con ascolto rapido dell'anteprima. |
