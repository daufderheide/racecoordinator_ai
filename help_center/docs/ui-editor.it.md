# Editor di Interfaccia

## Panoramica

L'Editor di Interfaccia consente di progettare layout personalizzati per il giorno della gara, configurare le colonne della classifica dei piloti, personalizzare gli effetti sonori e la grafica del tema e caricare [Widget personalizzati](custom-widgets.md) modulari.

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
  - **Mai**: Limita il cronometro esclusivamente ai secondi interi.
- **Anteprima dal vivo**: L'ispettore include un'anteprima istantanea che dimostra come le opzioni selezionate vengono visualizzate a vari intervalli di gara (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).

## Widget Codice QR fotocamera

Il widget **Codice QR fotocamera** (disponibile nel gruppo **Media & Chrome**) visualizza un codice QR di associazione direttamente sulla schermata di gara:

- **Associazione mobile immediata**: Consente a commissari e piloti di collegare la fotocamera dello smartphone per il rilevamento ottico dei giri senza dover aprire l'Editor tracciato.
- **Dettagli interattivi**: Facendo clic sul widget nella schermata di gara attiva viene aperta una finestra modale con il codice QR ingrandito, l'URL completo, il pulsante di copia e il test locale.
- **Risoluzione di rete dinamica**: Fornisce automaticamente un URL sicuro tramite tunnel HTTPS Cloudflare o l'IP e la porta della rete locale in base alla configurazione.

