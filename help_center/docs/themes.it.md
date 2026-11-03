# Temi

## Panoramica {: #overview }

I temi definiscono la presentazione audiovisiva completa e l'atmosfera estetica dei tuoi eventi di gara in Race Coordinator AI. Invece di configurare le risorse grafiche, le luci di partenza e gli avvisi audio singolarmente per ogni gara, i temi raggruppano questi elementi visivi e audio in profili riutilizzabili.

Quando un tema è attivo, coordina:
- Il layout di visualizzazione associato sullo schermo principale.
- Grafiche visive sincronizzate per bandiere, luci di partenza e indicatori di carburante.
- Effetti sonori di sistema, segnali di conto alla rovescia e annunci vocali.
- Sostituzioni audio centralizzate per gli effetti sonori dei singoli piloti.

---

## Impostazioni del tema {: #top-selectors }

Situate nella barra dei controlli superiore dell'Editor temi, queste impostazioni definiscono le proprietà fondamentali e i layout collegati per il tema:

- **Nome tema:** L'identificatore univoco del tema. I temi di sistema predefiniti (*RC AI*, *Formula*, *Endurance*) sono protetti e non possono essere eliminati o rinominati.
- **Layout interfaccia collegato:** Seleziona il layout di visualizzazione creato nell'[Editor layout](layout-editor.md) che viene caricato automaticamente sullo schermo di gara principale quando questo tema è selezionato per una gara.
- **Tema postazione pilota:** Specifica il tema utilizzato quando si apre una schermata postazione pilota a corsia singola o quando un pilota si collega tramite un dispositivo mobile o tablet.
- **Tema visualizzazione pilota:** Specifica il tema utilizzato per gli schermi del programma di gara a più corsie e i monitor per gli spettatori.

---

## Immagini delle bandiere {: #flags }

La sezione Immagini delle bandiere consente di personalizzare le grafiche visualizzate sul canvas di gara, sui widget delle bandiere e sulle postazioni pilota per ogni condizione di gara:

- **In gara (`flag.racing`):** Visualizzata durante la gara attiva quando la pista è verde e le auto girano liberamente.
- **Manche in pausa (`flag.heat_paused`):** Bandiera gialla di cautela visualizzata durante un'interruzione di gara o una pausa della pista.
- **Manche terminata (`flag.heat_over`):** Bandiera a scacchi visualizzata quando la durata della manche o i giri target sono terminati.
- **Gara terminata (`flag.race_over`):** Bandiera a scacchi finale che segnala la conclusione dell'intero evento di gara.
- **Non iniziata (`flag.not_started`):** Bandiera visualizzata prima dell'inizio di una manche o gara.
- **In partenza (`flag.starting`):** Bandiera rossa visualizzata durante la sequenza del conto alla rovescia iniziale prima che si accendano le luci verdi.
- **In ripartenza (`flag.restarting`):** Bandiera visualizzata durante il conto alla rovescia di ripartenza dopo una bandiera gialla o un'interruzione.
- **Ultimo giro (`flag.one_lap_to_go`):** Tradizionale bandiera bianca che segnala che il leader della corsa è nel suo ultimo giro.
- **Manche in arrivo (`flag.heat_finishing`):** Bandiera visualizzata quando il leader ha tagliato il traguardo e le altre auto stanno completando il loro giro corrente.
- **Riscaldamento (`flag.warmup`):** Visualizzata durante le prove e le sessioni di riscaldamento dei piloti pre-gara.
- **Pilota arrivato (`flag.driver_finished`):** Indicatore per corsia o individuale visualizzato per i piloti che hanno completato i giri richiesti.
- **Penalità (`flag.penalty`):** Indicatore a bandiera nera visualizzato quando un pilota compie una falsa partenza o un'infrazione sul giro.

Per ogni bandiera, puoi selezionare tra i preset integrati o caricare risorse immagine personalizzate in formato SVG, PNG, WebP o JPG dalla tua libreria tramite la [Gestione risorse](asset-manager.md).

---

## Luci del conto alla rovescia {: #countdown }

La sezione Luci del conto alla rovescia configura le risorse grafiche delle lampade utilizzate dal widget del conto alla rovescia e dalle luci di partenza su schermo:

- **Luce rossa spenta (`lamp.red.dim`):** La grafica della lampada rossa spenta o attenuata mostrata quando le luci sono inattive o prima dell'inizio del conto alla rovescia.
- **Luce rossa accesa (`lamp.red.on`):** La grafica della lampada rossa illuminata visualizzata durante ogni fase della sequenza del conto alla rovescia di partenza.
- **Luce verde (`lamp.green`):** La grafica della lampada verde brillante visualizzata al momento della partenza o della ripartenza quando viene data alimentazione alla pista.

Queste grafiche si ridimensionano automaticamente per adattarsi ai widget di partenza orizzontali e verticali configurati nei tuoi layout.

---

## Indicatore carburante {: #fuel-gauge }

La sezione Indicatore carburante configura gli indicatori visivi a più fotogrammi utilizzati durante le simulazioni di gara con carburante analogiche e digitali:

- **Set indicatore carburante (`gauge.fuel`):** Un set di immagini contenente più fotogrammi sequenziali che rappresentano i livelli di carburante dal pieno (100%) fino al vuoto (0%).

Durante una gara con simulazione del carburante abilitata, Race Coordinator AI calcola continuamente il consumo in base all'acceleratore o ai giri e aggiorna il fotogramma dell'indicatore in tempo reale. Quando il carburante scende al di sotto della soglia di riserva, l'indicatore attiva animazioni lampeggianti e segnali di avviso per indicare ai piloti di entrare nella corsia dei box.

---

## Effetti sonori {: #audio }

I temi consentono di personalizzare gli effetti sonori di sistema, l'audio del conto alla rovescia, gli annunci periodici del tempo e i messaggi vocali:

- **Conto alla rovescia di partenza (`audio.countdown`):** Effetti sonori riprodotti durante la sequenza del conto alla rovescia prima dell'inizio della manche.
- **Luce verde / VIA (`audio.countdown.green`):** Tono o clacson riprodotto nel momento in cui le luci di partenza diventano verdi e inizia la gara.
- **Bandiera gialla (`audio.yellowflag`):** Sirene o avvisi acustici riprodotti quando si verifica una fase di cautela o un'interruzione di gara.
- **Secondi rimanenti avvio automatico (`audio.auto_start`):** Annunci vocali periodici del conto alla rovescia prima dell'avvio automatico della manche.
- **Tempo manche (Secondi rimanenti) (`audio.seconds_left`):** Annunci vocali periodici che indicano il tempo rimanente della manche.
- **Metà manche (`audio.seconds_left.halfway`):** Notifica al raggiungimento della metà della manche (metà durata trascorsa o leader che completa la metà dei giri previsti).
- **Conteggio giri leader (`audio.laps_left`):** Annunci vocali per i giri rimanenti del leader della manche.
- **Manche conclusa (`audio.heat_over`):** Segnale acustico che indica la conclusione della manche attiva.
- **Gara conclusa (`audio.race_over`):** Fanfara o segnale sonoro finale che indica la conclusione dell'intero evento di gara.
- **Secondi rimanenti avanzamento automatico (`audio.auto_advance`):** Annunci periodici del conto alla rovescia prima dell'avanzamento automatico alla manche successiva.
- **Infrazione tempo minimo sul giro (`audio.min_lap_time`):** Tono di avviso riprodotto quando un'auto attiva un sensore al di sotto della soglia minima del tempo sul giro.

Ogni slot audio può essere configurato come:
1. **Suono predefinito:** Scegli dalla libreria degli effetti sonori integrata di Race Coordinator AI.
2. **File audio personalizzato:** Carica file WAV, MP3 o OGG personalizzati tramite la Gestione risorse.
3. **Sintesi vocale (TTS):** Frasi vocali dinamiche con interpolazione delle variabili a runtime (come `{time}` e `{laps}`).

Per dettagli completi sull'attenuazione automatica dell'audio, i livelli di priorità e l'uscita multischermo, consultare la documentazione del [Sistema audio](audio.md).

---

## Sostituzioni audio del pilota {: #driver-audio-overrides }

Nelle gare standard, ogni pilota può avere toni sul giro e annunci vocali personalizzati configurati nell'[Editor piloti](driver-editor.md). Tuttavia, per eventi di club, piste commerciali o campionati a tema, gli organizzatori di gara desiderano spesso un'esperienza audio uniforme per tutti i concorrenti.

La sezione **Sostituzioni audio del pilota** consente al tema di sostituire a livello centrale qualsiasi o tutti i richiami audio dei piloti per tutti i partecipanti alla gara.

### Sostituzioni audio pilota disponibili

Il tema può sostituire ciascuno dei 13 eventi audio individuali del pilota:

#### Suoni personali sul giro
- **Giro completato (`lapAudio`):** Suono riprodotto ogni volta che un pilota completa un giro valido standard.
- **Miglior giro personale (`bestLapAudio`):** Suono riprodotto quando un pilota supera il proprio precedente miglior tempo sul giro nella sessione di gara corrente.

#### Suoni di gara sul giro
- **Miglior giro di gara (`raceBestLapAudio`):** Suono riprodotto quando un pilota registra il giro più veloce registrato su tutte le corsie e tra tutti i piloti nella gara corrente.
- **Miglior giro su corsia di gara (`raceLaneBestLapAudio`):** Suono riprodotto quando un pilota registra il giro più veloce sulla sua corsia specifica nella gara corrente.
- **Miglior giro di manche (`heatBestLapAudio`):** Suono riprodotto quando un pilota stabilisce il miglior tempo sul giro della manche attiva.
- **Nuovo leader di gara (`newRaceLeaderAudio`):** Richiamo vocale o suono celebrativo riprodotto quando un pilota assume il comando generale della gara.
- **Nuovo leader di manche (`newHeatLeaderAudio`):** Suono riprodotto quando un pilota passa al 1º posto nella manche attiva.

#### Suoni del miglior giro generale
- **Miglior giro generale (`overallBestLapAudio`):** Suono ad alta priorità riprodotto quando un pilota stabilisce un record assoluto della pista su tutte le corsie.
- **Miglior giro su corsia generale (`overallLaneBestLapAudio`):** Suono riprodotto quando un pilota stabilisce un record assoluto per quella specifica corsia della pista.

#### Suoni degli eventi
- **Ingresso ai box (`pitInAudio`):** Suono riprodotto quando un'auto entra nella corsia dei box o attiva i sensori di ingresso ai box sulle piste digitali.
- **Avviso carburante (`fuelAudio`):** Tono di avvertimento o annuncio vocale quando si raggiunge il livello di riserva o si esaurisce il carburante.
- **Falsa partenza / Penalità (`penaltyAudio`):** Cicalino o avvisatore acustico riprodotto quando un'auto commette una falsa partenza o incorre in una penalità sul giro.
- **Giro in derapata (`driftLapAudio`):** Effetto sonoro per manovre acrobatiche riprodotto quando un'auto supera le soglie del sensore di derapata.

### Priorità e modalità di sostituzione

Ciascun evento audio del pilota nell'elenco può essere configurato in modo indipendente:

- **Disabilitato (Casella deselezionata):** Il tema lascia lo slot inalterato. Race Coordinator AI riproduce il suono personalizzato del singolo pilota (o il valore predefinito di sistema se non configurato).
- **Abilitato (Casella selezionata):** Il tema sostituisce l'evento sonoro per **ogni pilota** che partecipa alle gare che utilizzano questo tema, indipendentemente da quanto configurato nel loro profilo individuale.

Quando abilitato, scegli tra quattro modalità di output:
1. **Suono predefinito:** Seleziona un effetto sonoro standard dal catalogo integrato.
2. **File audio caricato:** Seleziona un file audio personalizzato dalla tua libreria della Gestione risorse.
3. **Sintesi vocale (TTS):** Inserisci una frase personalizzata con interpolazione di variabili specifiche del pilota:
   - `{driver}` — Il nome visualizzato o il soprannome del pilota.
   - `{time}` — Il tempo sul giro formattato con tre decimali (es. `3.142`).
   - `{lane}` — Il numero della corsia attiva (es. `2`).
   - `{lap}` — Il conteggio dei giri completati corrente.
   - `{gap}` — Il distacco di tempo dal leader o dall'auto più vicina.
4. **Nessuno (Disattiva audio):** Silenzia completamente l'evento a livello di tema, impedendo la riproduzione di qualsiasi suono o annuncio.

### Ripristina tutte le sostituzioni

Fai clic sul pulsante **Ripristina tutte le sostituzioni** nell'intestazione della sezione Sostituzioni audio del pilota per cancellare tutte le sostituzioni del tema contemporaneamente. Tutti i 13 slot torneranno al loro stato predefinito non selezionato, restituendo interamente il controllo audio al profilo individuale di ciascun pilota.
