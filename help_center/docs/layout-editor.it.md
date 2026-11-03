# Editor di Layout

L'**Editor di Layout** offre un'interfaccia canvas dedicata a schermo intero per personalizzare, organizzare e progettare layout visivi per Race Coordinator AI. Condivide la stessa barra degli strumenti unificata, selezione degli oggetti, protezione in sola lettura e ciclo di vita della modalità di modifica utilizzati negli editor Piloti, Tracciati e Gare.

---

## Panoramica e Navigazione

L'Editor di Layout è accessibile da diverse posizioni all'interno dell'applicazione:

- **Barra degli strumenti Configurazione Giorno di Gara**: Selezionare **Config > Editor di Layout** (`/layout-editor` o `/layout-manager`).
- **Menu Gestisci Giorno di Gara**: Selezionare **Gestisci > Editor di Layout** (`/layout-editor`). La navigazione durante una gara attiva mantiene la connessione e lo stato della gara.
- **Editor UI**: Fare clic su **Apri Editor di Layout** dalla sezione Layout UI nell'Editor UI (`/ui-editor`).

### Ciclo di Vita Modalità Sola Lettura e Modifica

- **Modalità Sola Lettura (Predefinita)**: Le proprietà del layout, i widget del canvas, le dimensioni e i campi dell'ispettore sono protetti da modifiche accidentali.
- **Modalità Modifica**: Facendo clic sull'icona a forma di matita (**Modifica**) nella barra degli strumenti si sbloccano il canvas di layout, i controlli di zoom, il riposizionamento/ridimensionamento dei widget e la modifica nell'ispettore.
- **Salvataggio Automatico e Convalida**: Quando si esce dalla modalità di modifica, le modifiche vengono convalidate (ad es. garantendo un nome layout univoco e non vuoto) e salvate. Le configurazioni non valide generano un avviso e mantengono l'editor in modalità di modifica.
- **Annulla Modifiche**: Uscire o navigare verso un'altra schermata con modifiche non salvate mostra il consueto modale di conferma per l'annullamento, proteggendo dalla perdita di dati.
- **Annulla / Ripeti**: Pienamente integrato con le scorciatoie da tastiera standard (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> e <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Azioni della Barra degli Strumenti

La barra degli strumenti superiore fornisce azioni di gestione standardizzate:

- **Selettore Layout**: Menu a discesa per selezionare qualsiasi layout di sistema o personalizzato, ordinato naturalmente con i nomi predefiniti localizzati (*UI Predefinita Giorno di Gara*, *UI Predefinita Prove*, *UI Predefinita Postazione Pilota*).
- **Modifica / Fine Modifica**: Alterna tra la modalità sola lettura e la modalità di modifica.
- **Aggiungi Layout (<span class="material-icons">add</span>)**: Apre una finestra di dialogo per la selezione del modello che consente di creare un nuovo layout partendo da qualsiasi layout predefinito di Race Coordinator AI (*RC AI*, *Prove*, *Carburante*, *Postazione Pilota*) o da un layout completamente vuoto.
- **Copia Layout (<span class="material-icons">content_copy</span>)**: Duplica il layout attualmente selezionato con un nome univoco (ad es. *Nome Layout (Copia)*).
- **Elimina Layout (<span class="material-icons">delete</span>)**: Elimina il layout personalizzato corrente previa conferma. I layout di sistema predefiniti sono protetti e non possono essere eliminati.
- **Guida Interattiva (<span class="material-icons">help_outline</span>)**: Avvia un tour guidato interattivo che evidenzia il selettore layout, le azioni di testata, il canvas, la libreria dei widget e l'ispettore dei widget.

---

## Controlli Canvas e Risoluzione {: #layout-controls }

Posizionati nella barra dei controlli sotto la barra degli strumenti:

### Preimpostazioni Formato e Risoluzione
Selezionare un formato preimpostato (**16:9**, **16:10**, **4:3**, **21:9**, **Personalizzato**) per ridimensionare automaticamente le dimensioni base del canvas (ad es. 1920×1080, 1920×1200, 1440×1080).

### Modalità di Ridimensionamento
- **Adattamento Automatico (Scala Uniforme)**: Preserva le proporzioni dei widget adattandoli allo schermo di destinazione.
- **Allunga per Adattare**: Allunga i widget indipendentemente in larghezza e altezza.
- **Fisso / Mappatura Pixel 1:1**: Mantiene le dimensioni esatte delle coordinate senza ridimensionamento.

### Controles Zoom
- Regolare lo zoom in modo continuo dal **25%** al **400%** utilizzando i pulsanti **-** e **+** o digitando direttamente una percentuale.
- Fare clic su **Reimposta Zoom** per ripristinare il 100%.
- Le impostazioni di zoom vengono memorizzate nel browser per ogni layout.

### Anteprima Semaforo di Partenza
- Fare clic su **Anteprima Luci** (<span class="material-icons">timer</span>) per visualizzare in anteprima la sequenza delle luci del conto alla rovescia sul canvas senza avviare una gara reale.

### Libreria dei widget e controlli di configurazione {: #widget-panels }
- **Libreria dei widget (<span class="material-icons">widgets</span>)**: Attiva/disattiva la visibilità della casella degli strumenti mobile. Un clic ripristina la casella se è ridotta a icona o posizionata fuori dallo schermo visibile.
- **Configurazione Widget (<span class="material-icons">tune</span>)**: Attiva/disattiva la visibilità del pannello laterale Configurazione Widget. Quando è nascosto, il canvas può estendersi sull'intera larghezza della pagina se le proporzioni del layout lo consentono (proprio come in modalità di sola lettura).
- **Ripristina posizione (<span class="material-icons">restart_alt</span>)**: Situato nell'intestazione della casella mobile per riportarla istantaneamente all'origine `(0, 0)` in alto a sinistra.
- **Riduci (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Comprime la casella degli strumenti in una barra del titolo compatta per liberare spazio sul canvas.

---

## Canvas dei Widget e Ispettore {: #canvas-and-widgets }

Il canvas funge da anteprima dal vivo autentica del layout, esattamente come piloti e spettatori lo vedranno durante un evento di gara. In **Modalità Modifica**, è possibile aggiungere, rimuovere, riposizionare, ridimensionare e configurare i widget che compongono il layout.

### Interazioni sul Canvas
- **Posizionamento e Selezione**: Fare clic su qualsiasi widget direttamente nel canvas o selezionarlo dal menu a discesa **Seleziona Widget** nella barra degli strumenti dei controlli superiori.
- **Riposizionamento e Dimensionamento**: Trascinare liberamente i widget entro i limiti del canvas. Utilizzare il pannello laterale Configurazione Widget per inserire coordinate numeriche precise di **X**, **Y**, **Larghezza** e **Altezza**.
- **Spostamento da Tastiera**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Sposta il widget selezionato di 1px.
  - <kbd>Shift</kbd> + <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Sposta il widget selezionato di 10px.
  - <kbd>Canc</kbd> o <kbd>Backspace</kbd>: Rimuove il widget selezionato.
- **Replica Corsie**: Replica una scheda di colonna corsia selezionata su tutte le corsie attive, posizioni della manche, classifiche generali o teste di serie dei piloti.
- **Rilevamento e Riparazione Colonne Sovrapposte**: L'editor rileva automaticamente colonne duplicate o sovrapposte nelle griglie di corsia. Un banner di avviso fornisce una **Correzione Rapida** in un clic o l'opzione **Esamina Problemi** in una finestra di dialogo interattiva.

### Widget Disponibili e Opzioni di Configurazione

Race Coordinator AI include una collezione completa di widget integrati:

1. **Tabellone / Griglia (Leaderboard)**:
   - **Scopo**: Mostra una classifica tabellare in tempo reale di piloti, posizioni, giri, metriche telemetriche e distacchi.
   - **Opzioni di Configurazione**: Origine dati (**Dati Manche** vs. **Dati Gara Generale**), ordine e visibilità delle colonne personalizzati, altezza delle righe, regole di ordinamento, impaginazione automatica e tipografia.
2. **Colonna Corsia (Schede Modulari)**:
   - **Scopo**: Visualizza i dati telemetrici per una singola corsia, posizione di arrivo o classifica generale come scheda modulare indipendente.
   - **Opzioni di Configurazione**: Associazione bersaglio (**Corsia 1–8**, **Posizione Manche**, **Classifica Generale** o **Testa di Serie Pilota**), fino a 8 **Slot Interni** perimetrali (per avatar, metriche secondarie o badge), allineamento del testo e ridimensionamento caratteri.
3. **Timer e Tempo Totale**:
   - **Scopo**: Mostra il tempo rimanente della manche, il tempo trascorso o la durata complessiva dell'evento.
   - **Opzioni di Configurazione**: Preimpostazioni di visualizzazione (**Dinamico**, **Minuti e Secondi**, **Orologio Completo**, **Secondi Totali**), soglie di precisione al decimo/centesimo di secondo e anteprima del formato.
4. **Widget Conto alla Rovescia (Luci di Partenza)**:
   - **Scopo**: Sequenza visiva delle luci di partenza con audio sincronizzato.
   - **Opzioni di Configurazione**: Numero di luci (da 1 a 10), orientamento orizzontale o verticale, animazione di dissolvenza, sfocatura di sfondo ed effetti di bagliore.
5. **Pulsanti Azione**:
   - **Scopo**: Pulsanti interattivi touch e clic per il controllo della gara.
   - **Opzioni di Configurazione**: Azioni di attivazione (**Avvia/Pausa**, **Bandiera Gialla / Chiamata Pista**, **Chiamata Audio**, **Ripristina**, **Cambio Layout**), testo personalizzato del pulsante, icone vettoriali Material Icons e stili di colore.
6. **Widget Record**:
   - **Scopo**: Mostra i record della pista e della sessione (giro più veloce di sempre, giro più veloce su corsia, record giri totali) e i risultati dei piloti.
   - **Opzioni di Configurazione**: Tipi di metriche dei record, formattazione del titolo, tipografia e stile dello sfondo.
7. **Widget Immagine**:
   - **Scopo**: Mostra tracciati del circuito, banner degli sponsor, loghi del club e risorse grafiche.
   - **Opzioni di Configurazione**: URL o percorso immagine dal gestore risorse, modalità di adattamento (**Adatta**, **Riempi**, **Allunga**), opacità e raggio del bordo.
8. **Widget Testo Informativo**:
   - **Scopo**: Mostra titoli statici, annunci o tag dinamici dei metadati di gara (Nome Gara, Manche Attuale, Nome Pista).
   - **Opzioni di Configurazione**: Modello di testo con interpolazione di variabili (`{race_name}`, `{heat_number}`), dimensione del carattere, allineamento e colori.
9. **Widget Menu**:
   - **Scopo**: Menu compatto sovrapposto in gara per un rapido accesso ai controlli audio, cambio di layout e controlli di gara.
   - **Opzioni di Configurazione**: Stile delle icone, visibilità delle voci di menu e posizionamento di ancoraggio.
10. **Prossime Manche (On Deck)**:
    - **Scopo**: Informa i piloti sul programma delle prossime manche e sulle rotazioni delle corsie pianificate.
    - **Opzioni di Configurazione**: Numero di manche imminenti in anteprima, formattazione del nome pilota e spaziatura del layout.
11. **Widget Personalizzati**:
    - **Scopo**: Carica dinamicamente componenti web esterni e indicatori telemetrici dalla cartella dei widget personalizzati.
    - **Opzioni di Configurazione**: Campi di proprietà personalizzati (colori, soglie, selettori, etichette di testo) definiti nel manifest del widget.

Per informazioni dettagliate sullo stile dei widget, formule e sviluppo di widget personalizzati, consultare la [Guida all'Editor UI](ui-editor.it.md) e la [Guida ai Widget Personalizzati](custom-widgets.it.md).

---

## Importazione, Esportazione e Migrazione

- **Importa Layout**: Importare un file JSON di layout esistente tramite selezione file.
- **Esporta Layout**: Scaricare il layout attivo come file JSON autonomo.
- **Backup Pre-Migrazione**: Per i layout aggiornati da versioni precedenti, ripristinare snapshot di backup pre-migrazione o esportare la diagnostica di migrazione per la risoluzione dei problemi.
