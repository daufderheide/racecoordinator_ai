# Operazioni il Giorno di Gara

## Avvio e Sospensione della Gara

Durante la giornata di gara, le operazioni in pista passano attraverso stati automatizzati controllati dal direttore di gara tramite tasti di scelta rapida, pulsanti della barra degli strumenti o pulsanti di emergenza esterni:

### Avvio delle Manche
- **Schieramento e Conto alla Rovescia**: Quando viene avviata una manche, Race Coordinator AI fa partire un conto alla rovescia automatico (configurabile nell'editor di gara). Toni acustici e semafori visivi preparano i concorrenti.
- **Bandiera Verde**: Raggiunto lo zero, la corrente in pista si attiva e la gara entra nello stato `Racing`.
- **Tempo di Reazione**: Se "Inizia dietro al sensore" è abilitato, il primo passaggio sul traguardo registra il tempo di reazione allo scatto invece di un giro completo.

### Sospensioni e Bandiere Gialle
- **Attivazione di una Pausa**: Premendo la barra spaziatrice, cliccando sull'icona di **Pausa** o azionando un pulsante esterno, viene immediatamente esposta la bandiera gialla (`Paused`).
- **Distacco Immediato della Corrente**: I relè tolgono istantaneamente l'alimentazione per fermare i modelli.
- **Rilevamento Tempi Parziali**: Nello stesso millisecondo, l'interfaccia hardware congela il tempo parziale percorso da ciascuna auto e lo memorizza nel tempo in sospeso.
- **Passaggio del Traguardo per Inerzia (Giri in Deriva)**: Se un'auto era prossima al traguardo quando è saltata la corrente, la sua inerzia può portarla oltre il sensore.
    - Se il sensore scatta entro la finestra di **Tempo di deriva** configurata, il passaggio è convalidato come **Giro in Deriva** (`isDrift: true`). Appare il contrassegno **`DRIFT`** sulla corsia, suona l'annuncio audio urgente e il giro viene accreditato al pilota.
    - Se scatta a tempo scaduto, l'impulso viene cestinato per evitare giri involontari causati dai commissari di pista.
    - Per tutti i dettagli, consultare [Editor di Gara: Meccanica di Deriva e Cronometraggio del Drift](race-editor.it.md#drifting-and-drift-timing).

### Riavvio della Corsa
- **Ripartenza con Bandiera Verde**: Togliendo la pausa riparte il conto alla rovescia. Con la bandiera verde, la corrente torna e i cronometri ripartono da zero.
- **Chiusura del Giro (Giri con Deriva Coinvolta)**: Quando un'auto fermata sul circuito riprende la corsa e taglia il traguardo sotto alimentazione, il tempo finale somma il parziale pre-pausa e il tempo post-pausa. Questo è un **Giro con Deriva Coinvolta**. Se è attivo "Escludi giri con derapata dai record", il giro vale per la manche ma viene escluso dai record.

## Regolazioni dei Giri e del Tempo

I direttori di gara possono regolare manualmente il conteggio dei giri e i tempi di manche dei piloti direttamente dalla schermata di gara per risolvere problemi sul tracciato, mancate letture dei sensori o penalità:

### Apertura della Finestra di Regolazione
- **Clic sulla cella**: Fare clic sinistro su qualsiasi cella o scheda di **Conteggio Giri** (`lapCount`, `physicalLapCount`) o **Tempo Totale** (`totalTime`, `overallTotalTime`) per quella corsia.
- **Menu Direttore di Gara**: Aprire il **Menu Direttore di Gara** e selezionare **Regola sezioni di giro/tempo** per modificare qualsiasi pilota in una manche corrente, passata o non ancora iniziata in blocco.
- **Schermate dei Risultati**: Accessibile anche dalle schermate **Risultati Manche** e **Risultati Gara** per modificare le manche registrate a fine gara.

### Scorciatoie Rapide (Giri)
Facendo clic su una cella del conteggio giri interattiva:
- **`Shift + Clic Sinistro`**: Aggiunge immediatamente +0,25 giri (+1/4 di giro) senza aprire la finestra.
- **`Alt + Clic Sinistro`**: Rimuove immediatamente -0,25 giri (-1/4 di giro) senza aprire la finestra.

### Controlli nella Finestra
1. **Settori di Giro**: Inserire i settori di pista (ad es. su 100 settori per giro) per regolare il conteggio dei giri. Un'anteprima mostra la frazione di giro corrispondente (es. 25 settori = 0,25 giri).
2. **Regolazione del Tempo**: Inserire secondi positivi (penalità di tempo, es. `+5.000`) o negativi (compensazione, es. `-2.500`) con precisione al millisecondo (`0.001s`).
3. **Anteprima Tempo Totale in Tempo Reale**: La finestra calcola e mostra il tempo totale regolato del pilota prima dell'applicazione delle modifiche.

### Effetti su Classifiche e Metriche
- **Giri Regolati**: Modifica direttamente la posizione nelle classifiche per **Maggior Numero di Giri** e aggiorna i distacchi in giri (`gapLeader`, `gapPosition`). Non modifica i giri fisici effettivi, il miglior giro, il giro mediano o il passo medio fisico.
- **Tempo Totale Regolato**: Modifica la posizione nelle classifiche per **Tempo Totale Più Veloce**, agisce da spareggio per i piloti a pari giri, e aggiorna il **Tempo Medio sul Giro** ($\text{Tempo Totale Regolato} / \text{Giri Fisici}$) e i distacchi cronometrici.
- **Metriche Protette**: Il **Miglior Giro** e il **Giro Mediano** sono rigorosamente preservati dai rilevamenti fisici dei sensori e non sono mai modificati dalle regolazioni del tempo.

---

## Operazioni Crash and Learn {: #crash-and-learn-operations }

Quando una gara si svolge con **Crash and Learn (CNL)** abilitato, Race Coordinator AI tiene traccia delle uscite di pista (crash) in tempo reale, impone limiti di uscite, assegna penalità automatiche e gestisce le squalifiche.

### Rilevamento Uscite di Pista & Pulsanti di Chiamata
- **Rilevamento Automatico dei Crash**: Se configurato e il tempo sul giro supera la soglia di **Tempo di Crash Automatico**, il sistema rileva un'uscita di pista e assegna un crash al pilota.
- **Bandiere Gialle Automatiche**: Se **Pausa manche dopo crash** è abilitato, un crash automatico scatena immediatamente una bandiera gialla e toglie corrente alla pista.
- **Crash Multipli per Giro**: Se **Consenti crash multipli per giro** è abilitato, un veicolo fermo fuori pista accumulerà un crash aggiuntivo ogni volta che trascorre la soglia temporale senza tagliare il traguardo.
- **Pulsanti di Chiamata per Corsia**: Sulle piste con pulsanti per corsia, la pressione del pulsante mette in pausa la manche e assegna un crash a quella corsia. Premere altri pulsanti durante la pausa non assegna crash aggiuntivi.

### Meccanica di Squalifica (DQ)
Quando un pilota supera il limite di **Numero Massimo di Crash** (ad esempio 4 crash con limite a 3):
- **Bandiera Nera**: Lo stato della corsia passa immediatamente a bandiera nera (`flag.disqualified`).
- **Interruzione Corrente della Corsia**: Se sono installati relè per singola corsia, l'alimentazione di quella corsia viene interrotta istantaneamente.
- **Giri Bloccati**: I rilevamenti dei sensori e i giri non vengono conteggiati per il pilota squalificato per il resto della manche.
- **Calcolo Immediato Frazioni di Giro**: Nelle gare con calcolo delle frazioni di giro (`NoneAutoSegments` o `SingleLapAutoSegments`), i segmenti del pilota squalificato vengono calcolati al momento esatto della squalifica con il metodo "non consentire di finire" ($\text{timeSinceLastLap} / \text{medianLapTime}$, con limite massimo di $0.99$).
- **Posizione in Classifica**: Un pilota squalificato non può essere classificato davanti a piloti non squalificati nella manche. In presenza di più piloti squalificati, l'ordine è stabilito dal punteggio ridimensionato in base alla **Percentuale di Punteggio Manche per Squalifica**.

### Revisione e Regolazione di Crash e Penalità
I direttori di gara hanno pieno controllo manuale:
- **Widget Contatore Crash**: Le colonne delle corsie mostrano il conteggio dei crash della manche corrente.
- **Regolazioni Manuali**: Tramite i comandi o la finestra **Regola Settori di Giro / Tempo**, è possibile aggiungere o togliere crash.
- **Revoca della Squalifica**: Riducendo il numero di crash a o sotto il limite, la squalifica viene revocata all'istante: la bandiera torna verde, la corrente viene ripristinata e le penalità vengono ricalcolate.
- **Trasparenza delle Penalità**: I giri e i tempi di penalità accumulati vengono mostrati nella finestra di regolazione a fianco dei campi di modifica.
