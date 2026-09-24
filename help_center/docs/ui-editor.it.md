# Editor di Interfaccia

## Panoramica

L'Editor di Interfaccia consente di progettare layout personalizzati per il giorno della gara, configurare le colonne della classifica dei piloti, personalizzare gli effetti sonori e la grafica del tema e caricare [Widget personalizzati](custom-widgets.md) modulari.

## Widget personalizzati e cartella dei widget

È possibile aggiungere widget personalizzati ai layout di interfaccia personalizzati:
- **Cartella dei widget personalizzati**: Imposta la cartella locale dei widget nella sezione **Interfaccia personalizzata** in fondo all'editor.
- **Aggiorna widget di esempio**: Fai clic su **Aggiorna widget di esempio** per generare o aggiornare widget di esempio pronti all'uso in una cartella `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Gruppi della casella degli strumenti dei widget**: La casella degli strumenti organizza i widget in gruppi (**Race Coordinator AI**, **Radice personalizzata** e cartelle personalizzate come **sample**) con sottogruppi nidificati (come **Azioni** e **Dati della manche** con sottocartelle categorizzate) e un filtro di ricerca istantaneo.
- **Ispettore dinamico**: Quando un widget personalizzato viene selezionato nell'area di disegno, le sue proprietà personalizzate (colori, soglie, levette, campi di testo) appaiono dinamicamente nell'Ispettore widget.

Per tutti i dettagli sullo sviluppo dei widget, consulta la [Guida ai widget personalizzati](custom-widgets.md).

## Configurazione layout e colonne

- Trascina e rilascia i widget dalla tavolozza sull'area di lavoro.
- Ridimensiona, riposiziona e allinea i widget in base alla risoluzione dello schermo. Tutti i widget rimangono delimitati all'interno dell'area di lavoro.
- **Controlli dell'Ispettore Widget**:
  - **Posizione e dimensioni**: Posiziona e dimensiona con precisione il widget selezionato tramite i campi numerici **X**, **Y**, **Larghezza** e **Altezza**.
  - **Elimina widget**: Fai clic sull'icona del cestino nell'intestazione dell'ispettore o sul pulsante **Elimina widget** nella barra laterale.
- **Scorciatoie da tastiera**:
  - <kbd>Canc</kbd> o <kbd>Backspace</kbd>: Rimuove il widget selezionato dal layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Sposta il widget selezionato di 1px (o 10px tenendo premuto <kbd>Maiusc</kbd>).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Annulla l'azione precedente.
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Maiusc</kbd>+<kbd>Z</kbd>: Ripristina.
- Configura l'ordine delle colonne, la visibilità, gli ancoraggi e le preferenze di larghezza.

## Configurazione del Widget Cronometro

Il widget **Cronometro** mostra il tempo trascorso o rimanente della manche/gara con stili di visualizzazione configurabili:

- **Formato di visualizzazione**:
  - **Dinamico (1:23 / 45s)**: Visualizzazione compatta che omette gli zeri iniziali e nasconde i minuti quando il tempo è inferiore a un minuto.
  - **Minuti e secondi (01:23 / 00:45)**: Due cifre fisse per minuti e secondi, evitando salti di lunghezza e bruschi cambi di dimensione del font in modalità di adattamento automatico.
  - **Minuti e secondi (1:23 / 0:45)**: Mantiene i minuti sotto il minuto (`0:45`), utilizzando una sola cifra per i minuti sopra il minuto (`1:23`).
  - **Orologio completo (00:01:23 / 00:00:45)**: Orologio digitale a otto caratteri (`HH:MM:SS`), ideale per gare di durata.
  - **Secondi totali (83s / 45s)**: Mostra i secondi totali trascorsi o rimanenti senza suddivisione in minuti o ore.
- **Frazioni di secondo (Subsecondi)**:
  - **Sotto la soglia**: Mostra le frazioni di secondo (da 1 a 3 cifre decimali) quando il tempo scende sotto la soglia configurata (ad es. ultimi 10 secondi).
  - **Sempre**: Mostra le frazioni di secondo costantemente per l'intera manche.
- **Anteprima dal vivo**: L'ispettore include un'anteprima istantanea che dimostra come le opzioni selezionate vengono visualizzate a vari intervalli di gara (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).

## Widget Colonna Corsia e Duplicazione

Il widget **Colonna Corsia** consente di posizionare le singole colonne di dati della vista corsia (come informazioni pilota, tempo dell'ultimo giro, miglior giro / record personale, livello carburante %, storico dei giri, velocità di settore, posizione, ecc.) in qualsiasi punto dell'area di lavoro sotto forma di schede modulari indipendenti.

- **Modalità di Associazione**:
  - **Corsia Fisica**: Associa la scheda a una corsia specifica della pista (Corsia 1 fino a Corsia 8). La scheda mantiene i dati di tale corsia durante l'intera gara.
  - **Posizione in Classifica**: Associa la scheda a una posizione attuale della classifica (1° posto, 2° posto, ecc.). La scheda segue dinamicamente cambi di posizione e sorpassi, adattando i colori di sfondo e testo alla corsia del pilota che occupa quella posizione.
- **Orientamento**: Supporta layout **Verticale** (intestazione sopra il valore) e **Orizzontale** (intestazione e valore affiancati).
- **Ereditarietà Colori e Personalizzazioni**: Le schede ereditano in modo predefinito i colori di sfondo e testo della corsia assegnata (`Usa Colori Corsia`), oppure possono essere personalizzate con colori di sfondo, testo e bordi dedicati.
- **Duplica su Corsie / Posiciones**:
  - Invece di creare e allineare manualmente le schede per ciascuna corsia, configura una singola scheda per corsia o posizione e fai clic su **Duplica su Corsie / Posizioni...** nell'ispettore.
  - Seleziona la direzione (**Orizzontale** affiancato o **Verticale** incolonnato), il numero totale di corsie/posizioni di destinazione (predefinito al numero massimo di corsie su tutte le piste nel database), la modalità di spaziatura (**Adatta allo Schermo** o **Mantieni Spaziatura**) e l'eventuale sostituzione dei widget esistenti.
  - **Modalità di Duplicazione in Tempo Reale**: All'avvio della duplicazione, l'editor entra in una modalità modello interattiva con guide visive di corsia e allineamento magnetico. In questa modalità posizioni, ridimensioni e modifichi i widget direttamente sulla Corsia 1 (Master), e le modifiche vengono riflesse immediatamente in tempo reale su tutte le restanti corsie. I widget duplicati sulle corsie 2..N sono anteprime in sola lettura; facendo clic su qualsiasi widget speculare, la selezione si sposta automaticamente sul master della Corsia 1.
  - **Area Intelligente e Ridimensionamento**: Lo spazio di duplicazione si estende automaticamente in tutte e quattro le direzioni per riempire lo spazio disponibile sulla tela fino a toccare il bordo di qualsiasi widget esterno alla griglia. È possibile regolare l'area complessiva utilizzando le 8 maniglie perimetrali di ridimensionamento sulla sovrapposizione.
  - Fai clic su **Fine** per convertire la griglia in widget indipendenti.
  - **Modifica Modello e Scollega**: Selezionando successivamente qualsiasi widget della griglia, l'ispettore visualizza una scheda per **Modifica Modello Griglia** (per rientrare in qualsiasi momento nella modalità in tempo reale) o **Scollega dalla Griglia** (per rimuovere definitivamente il collegamento).

