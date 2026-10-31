# Editor di Layout

L'**Editor di Layout** offre un'interfaccia canvas dedicata a schermo intero per personalizzare, organizzare e progettare layout visivi per Race Coordinator AI. Condivide la stessa barra degli strumenti unificata, selezione degli oggetti, protezione in sola lettura e ciclo di vita della modalità di modifica utilizzati negli editor Piloti, Tracciati e Gare.

---

## Panoramica e Navigazione

L'Editor di Layout è accessibile da diverse posizioni all'interno dell'applicazione:

- **Barra degli strumenti Configurazione Giorno di Gara**: Selezionare **Config > Editor di Layout** (`/layout-editor` o `/layout-manager`).
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
- **Aggiungi Layout (<span class="material-icons">add</span>)**: Apre una finestra di dialogo per la selezione del modello che consente di creare un nuovo layout partendo da qualsiasi layout predefinito di Race Coordinator AI (*RaceCoordinator AI*, *Prove*, *Carburante*, *Postazione Pilota*) o da un layout completamente vuoto.
- **Copia Layout (<span class="material-icons">content_copy</span>)**: Duplica il layout attualmente selezionato con un nome univoco (ad es. *Nome Layout (Copia)*).
- **Elimina Layout (<span class="material-icons">delete</span>)**: Elimina il layout personalizzato corrente previa conferma. I layout di sistema predefiniti sono protetti e non possono essere eliminati.
- **Guida Interattiva (<span class="material-icons">help_outline</span>)**: Avvia un tour guidato interattivo che evidenzia il selettore layout, le azioni di testata, il canvas, la libreria dei widget e l'ispettore dei widget.

---

## Controlli Canvas e Risoluzione

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

### Libreria dei widget e casella degli strumenti
- **Libreria dei widget (<span class="material-icons">widgets</span>)**: Attiva/disattiva la visibilità della casella degli strumenti mobile. Un clic ripristina la casella se è ridotta a icona o posizionata fuori dallo schermo visibile.
- **Ripristina posizione (<span class="material-icons">restart_alt</span>)**: Situato nell'intestazione della casella mobile per riportarla istantaneamente all'origine `(0, 0)` in alto a sinistra.
- **Riduci (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Comprime la casella degli strumenti in una barra del titolo compatta per liberare spazio sul canvas.

---

## Canvas dei Widget e Ispettore

- **Posizionamento e Selezione**: Fare clic su qualsiasi widget nel canvas o selezionarlo dal menu a discesa dei widget.
- **Riposizionamento e Dimensionamento**: Trascinare liberamente i widget entro i limiti del canvas. Utilizzare la barra laterale dell'Ispettore per inserire valori numerici precisi di **X**, **Y**, **Larghezza** e **Altezza**.
- **Spostamento da Tastiera**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Sposta il widget selezionato di 1px.
  - <kbd>Shift</kbd> + Tasti freccia: Sposta il widget selezionato di 10px.
  - <kbd>Canc</kbd> o <kbd>Backspace</kbd>: Rimuove il widget selezionato.
- **Replica Corsie**: Replica una scheda di colonna corsia selezionata su tutte le corsie attive, posizioni, classifiche generali o teste di serie dei piloti.
- **Rilevamento e Riparazione Colonne Sovrapposte**:
  - L'editor rileva automaticamente colonne duplicate o sovrapposte nelle griglie di corsia.
  - Un banner di avviso fornisce una **Correzione Rapida** in un clic o l'opzione **Esamina Problemi** in una finestra di dialogo interattiva.

---

## Importazione, Esportazione e Migrazione

- **Importa Layout**: Importare un file JSON di layout esistente tramite selezione file.
- **Esporta Layout**: Scaricare il layout attivo come file JSON autonomo.
- **Backup Pre-Migrazione**: Per i layout aggiornati da versioni precedenti, ripristinare snapshot di backup pre-migrazione o esportare la diagnostica di migrazione per la risoluzione dei problemi.
