# Editor di Interfaccia

## Panoramica

L'Editor di Interfaccia consente di progettare layout personalizzati per il giorno della gara, configurare le colonne della classifica dei piloti, personalizzare gli effetti sonori e la grafica del tema e caricare [Widget personalizzati](custom-widgets.md) modulari.

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
- **Duplica su Corsie / Posizioni**:
  - Invece di creare e allineare manualmente le schede per ciascuna corsia, configura una singola scheda per corsia o posizione e fai clic su **Duplica su Corsie / Posizioni...** nell'ispettore.
  - Seleziona la direzione (**Orizzontale** affiancato o **Verticale** incolonnato), il numero totale di corsie/posizioni di destinazione (da 2 a 8), la modalità di spaziatura (**Adatta allo Schermo** o **Mantieni Spaziatura**) e l'eventuale sostituzione dei widget esistenti.
  - L'editor di layout duplica, riposiziona, rinumera e collega automaticamente le schede per tutte le corsie/posizioni selezionate con un solo clic.

