# Personalizza interfaccia

La pagina **Personalizza interfaccia** consente di configurare le impostazioni di sistema dell'interfaccia, le directory per i file di interfaccia e i widget modulari personalizzati, i modelli di esportazione delle gare in Excel, le animazioni di transizione delle schermate e i parametri del volume principale e della sintesi vocale (TTS).

> [!NOTE]
> Per progettare visivamente schermate personalizzate per il giorno della gara e classifiche, visita l'[Editor di layout](layout-editor.it.md). Per configurare set di immagini per bandiere, conti alla rovescia e indicatori di carburante o effetti sonori, visita l'[Editor dei temi](theme-editor.it.md).

---

## Panoramica {: #overview }

La pagina di personalizzazione dell'interfaccia offre un controllo centralizzato sulle impostazioni globali dell'interfaccia e sui parametri audio a livello di applicazione:

- **Ambito globale**: Le modifiche apportate in questa pagina si applicano all'intera applicazione e a tutte le sessioni di gara.
- **Salvataggio automatico continuo**: Le modifiche a volume, tonalità della voce, tempi di attesa della coda, percorsi delle cartelle e transizioni hanno effetto immediato e vengono salvate automaticamente.
- **Sezioni espandibili dedicate**: Le impostazioni sono suddivise in sezioni comprimibili per **Impostazioni interfaccia utente** e **Impostazioni audio**.
- **Supporto Annulla / Ripeti**: Le modifiche apportate durante la sessione corrente possono essere rapidamente annullate o riapplicate tramite i comandi della barra degli strumenti.

---

## Azioni della barra degli strumenti {: #toolbar-actions }

La barra degli strumenti superiore fornisce azioni essenziali di navigazione e gestione della sessione:

- **Indietro**: Ritorna alla schermata o al menu di navigazione precedente.
- **Annulla / Ripeti**: Annulla o ripristina le modifiche recenti apportate durante la sessione di modifica corrente.
- **Guida (?)**: Avvia il tour guidato interattivo che evidenzia ciascuna sezione e pannello della pagina.

---

## Impostazioni interfaccia utente {: #customize-ui-settings }

La sezione **Impostazioni interfaccia utente** configura le cartelle del file system locale, i modelli di esportazione in Excel e le animazioni delle schermate:

### Directory dell'interfaccia personalizzata

Specifica una cartella locale utilizzata per ignorare i modelli predefiniti dell'applicazione e salvare i registri del client quando necessario:

- **Percorso directory**: Mostra il nome della cartella attiva e il percorso assoluto del file. Se non impostato, l'applicazione utilizza le posizioni interne predefinite.
- **Seleziona directory**: Apre una finestra di dialogo nativa per sfogliare e selezionare una directory locale.
- **Inserisci percorso**: Apre una finestra modale per digitare o incollare manualmente un percorso assoluto del file system.
- **Ripristina impostazioni predefinite**: Cancella il percorso personalizzato e ripristina i valori predefiniti.

> [!WARNING]
> L'impostazione di una directory di interfaccia personalizzata sostituisce i modelli principali dell'applicazione ed è riservata solo agli utenti esperti che sviluppano interfacce personalizzate o analizzano i log.

### Directory dei widget personalizzati

Configura la directory principale in cui Race Coordinator AI cerca i [widget personalizzati](custom-widgets.it.md) modulari:

- **Percorso directory**: Mostra il nome e il percorso della cartella dei widget personalizzati selezionata.
- **Seleziona directory**: Apre un selettore di cartelle per scegliere una directory locale contenente i pacchetti di widget.
- **Inserisci percorso**: Inserisci manualmente un percorso di cartella assoluto.
- **Esporta widget iniziali**: Copia pacchetti di widget iniziali pronti all'uso in una sottocartella `sample/` all'interno della directory selezionata (inclusi `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` e `sample-detailed-leaderboard`). Questo pulsante si attiva non appena viene selezionata una directory valida.
- **Ripristina impostazioni predefinite**: Cancella il percorso della directory dei widget personalizzati.

Per i dettagli tecnici completi sulla creazione di widget personalizzati, consulta la [Guida ai widget personalizzati](custom-widgets.it.md).

### Modello di esportazione personalizzato

Gestisce il modello Microsoft Excel personalizzato (`.xlsx`) utilizzato durante l'esportazione dei risultati e delle statistiche di gara:

- **Stato del modello**: Mostra il nome file del modello di cartella di lavoro Excel attualmente attivo o indica se è in uso il modello predefinito del sistema.
- **Seleziona modello**: Carica una cartella di lavoro `.xlsx` personalizzata dal computer per incorporarla come modello di esportazione.
- **Scarica modello**: Scarica il file di modello attualmente attivo sul computer per visualizzarlo o modificarlo in Microsoft Excel.
- **Esportazione di prova**: Genera e scarica un file `.xlsx` di esempio compilato con dati fittizi per verificare layout, formule e grafici.
- **Variabili del modello**: Apre una finestra modale con l'elenco di tutti i tag di sostituzione supportati (come `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, ecc.) da inserire nelle celle di Excel per iniettare dinamicamente i dati di gara.
- **Ripristina impostazioni predefinite**: Ripristina il modello di esportazione Excel standard predefinito.

> [!TIP]
> Se modifichi il file del modello esternamente in Microsoft Excel o in un altro programma, ricordati di caricarlo nuovamente con **Seleziona modello** per salvare la versione aggiornata in Race Coordinator AI. Per tutti i dettagli sui token, consulta la [Guida all'esportazione XLS personalizzata](custom-xls-export.it.md).

### Transizioni di pagina

Controlla lo stile dell'animazione visiva utilizzata durante il passaggio da una schermata all'altra nell'applicazione:

- **Scorri (Slide)** (Predefinito): Transizione di scorrimento orizzontale fluido tra le pagine.
- **Dissolvenza (Fade)**: Dissolvenza di opacità fluida tra le visualizzazioni.
- **Zoom**: Transizione moderna con effetto di ingrandimento.
- **Capovolgi (Flip)**: Effetto di capovolgimento 3D stile scheda.
- **Nessuna (None)**: Cambio di pagina istantaneo senza animazione (consigliato per dispositivi con prestazioni ridotte o chioschi).

---

## Impostazioni audio {: #audio-settings }

La sezione **Impostazioni audio** gestisce i livelli di volume principale del sistema, i comportamenti della coda del gestore audio e la sintesi vocale (TTS):

### Volume principale

Controlla il volume principale complessivo (da 0% a 100%) per tutte le uscite audio in Race Coordinator AI. La regolazione di questo dispositivo di scorrimento ridimensiona contemporaneamente tutti gli effetti sonori, i segnali acustici del conto alla rovescia, gli avvisatori acustici e gli annunci vocali.

### Timeout coda urgente

Imposta per quanto tempo gli avvisi urgenti ad alta priorità (come *Bandiera Gialla*, *Manche Terminata* o *Falsa Partenza*) rimarranno nella coda audio se è già in corso un altro messaggio urgente:

- **3 Secondi**: Timeout breve; scarta rapidamente gli avvisi in coda per garantire che le notifiche vocali rimangano sincronizzate con l'azione in pista.
- **5 Secondi** (Predefinito): Durata bilanciata che garantisce l'ascolto degli avvisi urgenti senza accumulare ritardi sugli eventi dal vivo.
- **10 Secondi**: Timeout esteso; consente il completamento di annunci più lunghi prima di ignorare le notifiche urgenti successive.

Gli avvisi scaduti che superano il limite di tempo vengono scartati automaticamente.

### Spaziatura annunci vocali

Configura l'intervallo minimo di silenzio tra annunci vocali consecutivi per evitare sovrapposizioni o tagli dell'audio:

- **Nessuno (0 ms)**: Gli annunci consecutivi vengono riprodotti immediatamente uno dopo l'altro.
- **Breve (500 ms)** (Predefinito): Breve pausa di mezzo secondo tra gli annunci per un ritmo naturale.
- **Normale (1000 ms)**: Pausa di 1 secondo tra gli annunci per una separazione più chiara.
- **Rilassato (1500 ms)**: Pausa di 1,5 secondi tra gli annunci per un ritmo di commento calmo.

### Voce di sintesi vocale (TTS)

Seleziona la voce sintetizzata utilizzata per tempi sul giro, posizioni, annunci del leader e avvisi sul livello di carburante:

- **Predefinita del sistema**: Utilizza la voce sintetizzata predefinita del sistema operativo o del browser.
- **Voci installate**: Elenca tutte le voci rilevate sul sistema operativo o nel browser, con nome visualizzato e codice lingua (ad es. `it-IT`, `en-US`).

### Velocità di pronuncia

Controlla la velocità di riproduzione degli annunci TTS tramite un cursore che varia da **0,1x** (molto lento) a **2,0x** (doppia velocità) con incrementi di 0,05. La velocità predefinita è **1,0x**.

### Tonalità della voce (Pitch)

Controlla l'intonazione/frequenza della voce TTS tramite un cursore che varia da **0,0x** (tono grave) a **2,0x** (tono acuto) con incrementi di 0,05. L'intonazione predefinita è **1,0x**.

### Volume della voce

Cursore del volume indipendente (da 0% a 100%) dedicato esclusivamente agli annunci vocali TTS. Consente di regolare il livello dei commenti vocali rispetto agli effetti sonori di gara.

### Prova voce

Fai clic sul pulsante **Prova voce** per ascoltare una frase di esempio pronunciata con le impostazioni correnti di voce, velocità, tono e volume.
