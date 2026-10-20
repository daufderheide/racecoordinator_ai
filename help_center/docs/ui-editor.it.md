# Editor di Interfaccia

## Panoramica

L'Editor di Interfaccia consente di progettare layout personalizzati per il giorno della gara, configurare le colonne della classifica dei piloti, personalizzare gli effetti sonori e la grafica del tema e caricare [Widget personalizzati](custom-widgets.md) modulari.

## Widget personalizzati e cartella dei widget

È possibile aggiungere widget personalizzati ai layout di interfaccia personalizzati:
- **Cartella dei widget personalizzati**: Imposta la cartella locale dei widget nella sezione **Interfaccia personalizzata** in fondo all'editor.
- **Aggiorna widget di esempio**: Fai clic su **Aggiorna widget di esempio** per generare o aggiornare widget di esempio pronti all'uso in una cartella `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Gruppi della libreria dei widget**: La libreria dei widget organizza i widget in gruppi (**Race Coordinator AI**, **Radice personalizzata** e cartelle personalizzate come **sample**) con sottogruppi nidificati (come **Azioni** e **Dati della manche** con sottocartelle categorizzate) e un filtro di ricerca istantaneo.
- **Configurazione dinamica**: Quando un widget personalizzato viene selezionato nell'area di disegno, le sue proprietà personalizzate (colori, soglie, levette, campi di testo) appaiono dinamicamente nella Configurazione widget.

Per tutti i dettagli sullo sviluppo dei widget, consulta la [Guida ai widget personalizzati](custom-widgets.md).

## Configurazione layout e colonne

- Trascina e rilascia i widget dalla tavolozza sull'area di lavoro.
- Ridimensiona, riposiziona e allinea i widget in base alla risoluzione dello schermo. Tutti i widget rimangono delimitati all'interno dell'area di lavoro.
- **Controlli della Configurazione Widget**:
  - **Posizione e dimensioni**: Posiziona e dimensiona con precisione il widget selezionato tramite i campi numerici **X**, **Y**, **Larghezza** e **Altezza**.
  - **Elimina widget**: Fai clic sull'icona del cestino nell'intestazione di configurazione.
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
- **Anteprima dal vivo**: Il pannello di configurazione include un'anteprima istantanea che dimostra come le opzioni selezionate vengono visualizzate a vari intervalli di gara (`> 1 hr`, `> 1 min`, `< 1 min` e `< 10s`).

> [!NOTE]
> Queste stesse opzioni di formattazione del tempo (preimpostazioni del formato di visualizzazione, modalità frazioni di secondo, soglia e cursore decimali con anteprima in tempo reale) sono supportate anche per i widget **Tempo Totale** (Tempo Totale Manche e Tempo Totale Gara/Generale) e per le colonne di **Tempo Totale** nella Vista Corsie. Nell'elenco delle colonne della Vista Corsie, fare clic sull'icona delle opzioni di tempo (<span class="material-icons">more_time</span>) accanto a qualsiasi colonna Tempo Totale per personalizzarne il formato.

## Configurazione del widget di conto alla rovescia

Il widget **Conto alla rovescia** mostra il semaforo visivo di partenza ed emette i suoni corrispondenti durante la sequenza di avvio:

- **Lampade massime**: Imposta il numero massimo di luci da visualizzare (predefinito 5, intervallo da 1 a 10). Quando la durata della partenza supera tale valore (ad esempio, una partenza di 6 secondi con un massimo di 5 lampade), tutte le luci rimangono spente/attenuate per la differenza iniziale (1 secondo) prima di accendersi in sequenza.
- **Animazione dissolvenza in entrata**: Controlla se la schermata delle luci e la sfocatura dello sfondo appaiono con una transizione fluida. Se disattivata, le luci e lo sfondo compaiono istantaneamente.
- **Orientamento**: Alterna tra disposizione **Orizzontale** e **Verticale**.
- **Effetti bagliore e sfocatura**: Personalizza l'alone luminoso delle lampade, l'ingrandimento delle luci rosse/verdi e l'intensità o l'area di sfocatura dello sfondo.

## Widget Colonna Corsia e Duplicazione

Il widget **Colonna Corsia** consente di posizionare le singole colonne di dati della vista corsia (come informazioni pilota, tempo dell'ultimo giro, miglior giro / record personale, livello carburante %, storico dei giri, velocità di settore, posizione, ecc.) in qualsiasi punto dell'area di lavoro sotto forma di schede modulari indipendenti.

- **Pilota di Riferimento e Schede Singole**:
  - Le singole schede posizionate fuori da una griglia scelgono quale pilota mostrare: per **Corsia Pista** (Corsia 1 fino a Corsia 8), per **Posizione Manche** (1°, 2°, ecc.), per posizione nella **Classifica Generale** o per **Testa di Serie**.

### Origini Dati Griglia: Dati Manche vs. Dati Generali di Gara

Ogni griglia di dati nell'Editor UI dispone di un'impostazione **Origine dati** nella scheda Griglia, che determina quali piloti popolano le righe:

- **Dati Manche (`heat`)**:
  - **Ambito Piloti**: Vincolato esclusivamente ai partecipanti che gareggiano attivamente nella manche corrente sulla pista (`heatDrivers`).
  - **Visualizzazione**: Vengono mostrati solo i piloti attualmente in pista nella manche attiva. I piloti a riposo o assegnati ad altre manche vengono omessi.
  - **Paginazione e Scorrimento**: Il conteggio delle righe è limitato ai piloti della manche attiva e alle corsie fisiche. La griglia non scorre mai oltre i partecipanti attivi su righe vuote.
- **Dati Generali di Gara (`overall`)**:
  - **Ambito Piloti**: Vincolato a **tutti i partecipanti iscritti** all'intero torneo o evento (`participants`).
  - **Visualizzazione**: Qualsiasi pilota iscritto all'evento può essere visualizzato nella griglia, sia che stia gareggiando nella manche corrente o sia in pausa ai box.
  - **Paginazione e Scorrimento**: Il conteggio delle righe riflette l'intero schieramento dell'evento (es. 16, 24 o 32 piloti su più manche). Se la griglia ha meno righe visibili rispetto ai partecipanti totali, supporta lo scorrimento automatico multipagina per mostrare l'intera classifica generale.
  - **Piloti Fuori Pista**: Per i piloti che non sono attualmente in pista, vengono fornite automaticamente le statistiche complessive accumulate.

### Widget: Widget Dati Manche vs. Widget Dati Generali

La Casella degli strumenti suddivide le colonne e le schede dati nei gruppi **Dati Manche** e **Dati Generali**. La scelta del widget determina quali statistiche vengono calcolate e visualizzate per ciascuna riga:

- **Widget Dati Manche** (es. *Conteggio Giri, Tempo Ultimo Giro, Miglior Giro Manche, Tempo Settore, Tempo Reazione, Posizione Manche / Piazzamento, Distacchi Manche, Carburante / Telemetria, Ritmo Fantasma*):
  - Calcolano le metriche prestazionali riferite esclusivamente alla **manche attiva**.
  - **In una Griglia Dati Manche**: Ciascuna riga mostra la telemetria in tempo reale e i tempi sul giro delle vetture attualmente in pista.
  - **In una Griglia Dati Generali**: I piloti in pista mostrano la loro telemetria in tempo reale; i piloti a riposo o inattivi mostrano trattini (`--`) o zeri per le metriche di manche, in quanto non producono dati nella manche in corso.
- **Widget Dati Generali di Gara** (es. *Piazzamento Generale, Giri Totali, Giri Fisici Totali, Tempo Totale Generale, Miglior Giro Assoluto, Media Generale, Mediana Generale, Regolarità Generale, Distacchi Generali, Probabilità di Vittoria / Previsioni*):
  - Calcolano le metriche prestazionali complessive su **tutte le manche disputate** nel torneo.
  - **In una Griglia Dati Generali**: Ogni riga di pilota (in pista o ai box tra una manche e l'altra) mostra le statistiche complete dell'evento, i giri totali del torneo, il miglior giro assoluto e la posizione generale.
  - **In una Griglia Dati Manche**: I piloti attivi mostrano la loro posizione generale e le statistiche complessive dell'evento accanto ai giri della manche in corso (es. seguire la posizione in classifica generale mentre si corre la manche).

#### Widget Distacchi (Gaps e Intervalli)

Race Coordinator AI supporta **4 widget distacco specifici** sia per i Dati Manche che per i Dati Generali:

1. **Distacco dal Leader (`gapLeader` / `overallGapLeader`)**: Proiezione matematica continua del tempo di ritardo stimato rispetto al leader (P1).
2. **Distacco dal Pilota che Precede (`gapPosition` / `overallGapPosition`)**: Proiezione matematica continua del tempo di ritardo rispetto all'auto immediatamente avanti.
3. **Distacco Formula 1 dal Leader (`gapLeaderF1` / `overallGapLeaderF1`)**: Distacco esatto sul traguardo nello stesso giro o giri di ritardo (`+1 Giro`, `+N Giri`) in caso di doppiaggio.
4. **Distacco Formula 1 dal Pilota che Precede (`gapPositionF1` / `overallGapPositionF1`)**: Distacco esatto sul traguardo rispetto all'auto precedente nello stesso giro o giri di ritardo (`+1 Giro`, `+N Giri`).

Per consultare le formule matematiche complete e le specifiche di cronometraggio, consultare la [Guida ai Calcoli dei Distacchi](gap-calculations.md).

### Ordinamento Griglia e Matrice di Interazione

Il menu a discesa **Ordinamento Griglia** nella scheda Griglia controlla l'ordine delle righe. Il suo comportamento dipende direttamente dall'impostazione dell'**Origine dati** (**Dati Manche** o **Dati Generali**):

| Opzione Ordinamento | In Griglia Dati Manche (`gridType: heat`) | In Griglia Dati Generali (`gridType: overall`) |
| :--- | :--- | :--- |
| **Corsia Pista** | Ordinamento statico per corsia fisica (Corsia 1, Corsia 2, ...). Ciascuna riga è legata a una specifica corsia e al suo pilota assegnato. | I piloti attivi in pista appaiono per primi in ordine di corsia (Corsia 1, Corsia 2, ...), seguiti da tutti i partecipanti inattivi ordinati per posizione nella classifica generale. |
| **Posizione Manche** | Riordinamento dinamico in tempo reale in base alla posizione nella manche attiva (1°, 2°, 3° nella manche). Le righe si scambiano in tempo reale ai passaggi sul traguardo e durante i sorpassi. | I piloti attivi appaiono in cima ordinati per posizione nella manche (1°, 2°, ...), seguiti da tutti i partecipanti inattivi ordinati per classifica generale. |
| **Classifica Generale** | Ordina **esclusivamente i piloti della manche attiva** in base alla loro posizione nella classifica generale del torneo. (Ad esempio, se nella manche corrono il 2°, 5°, 8° e 14° della generale, le 4 righe li ordinano #2, #5, #8, #14). Non mostra piloti estranei né genera righe vuote. | Ordina l'**intero schieramento dei partecipanti** in base alla classifica generale dell'evento (1° generale, 2° generale, 3° generale, ...). L'intera tabella si riordina in tempo reale con l'aggiornamento di punti e giri. |
| **Testa di Serie** | Ordina i piloti della manche attiva in base al loro numero di qualificazione/seeding iniziale (numero più basso per primo). | Ordina tutti i partecipanti dell'evento in base alla loro testa di serie iniziale (1, 2, 3, ...) sull'intero schieramento. |
- **Orientamento**: Supporta layout **Verticale** (intestazione sopra il valore) e **Orizzontale** (intestazione e valore affiancati).
- **Stile e Personalizzazione della Barra del Titolo**:
  - La barra del titolo segue per impostazione predefinita lo stesso stile dell'intestazione della colonna nella vista corsia (sfondo scuro semitrasparente `rgba(68, 68, 68, 0.7)`, testo bianco in grassetto, angoli superiori arrotondati e bordo divisore).
  - **Mostra Intestazione**: Attiva o disattiva la barra del titolo. Se disattivata, la barra del titolo viene rimossa completamente dalla scheda, massimizzando lo spazio per i valori principali e gli inserti.
  - **Etichetta Personalizzata**: Sostituisce il nome predefinito del dato con un titolo personalizzato.
  - **Tipografia e Allineamento**: Configura famiglia di caratteri, dimensione del testo e allineamento (Sinistra, Centro, Destra).
  - **Colore del Testo e di Sfondo**: Personalizza il colore di sfondo e del testo dell'intestazione tramite selettori colore dedicati, con pulsante per ripristinare i valori predefiniti in un clic.
- **Ereditarietà Colori e Personalizzazioni**: Le schede ereditano in modo predefinito i colori di sfondo e testo della corsia assegnata (`Usa Colori Corsia`), oppure possono essere personalizzate con colori di sfondo, testo e bordi dedicati.
- **Duplica su Corsie / Posizioni**:
  - Invece di creare e allineare manualmente le schede per ciascuna corsia, configura una singola scheda per corsia o posizione e fai clic su **Duplica su Corsie / Posizioni...** nel pannello di configurazione.
  - Seleziona la direzione (**Orizzontale** affiancato o **Verticale** incolonnato), il numero totale di corsie/posizioni di destinazione (predefinito al numero massimo di corsie su tutte le piste nel database), la modalità di spaziatura (**Adatta allo Schermo** o **Mantieni Spaziatura**) e l'eventuale sostituzione dei widget esistenti.
  - **Modalità di Duplicazione in Tempo Reale**: All'avvio della duplicazione, l'editor entra in una modalità modello interattiva con guide visive di corsia e allineamento magnetico. In questa modalità posizioni, ridimensioni e modifichi i widget direttamente sulla Corsia 1 (Master), e le modifiche vengono riflesse immediatamente in tempo reale su tutte le restanti corsie. I widget duplicati sulle corsie 2..N sono anteprime in sola lettura; facendo clic su qualsiasi widget speculare, la selezione si sposta automaticamente sul master della Corsia 1.
  - **Area Intelligente e Ridimensionamento**: Lo spazio di duplicazione si estende automaticamente in tutte e quattro le direzioni per riempire lo spazio disponibile sulla tela fino a toccare il bordo di qualsiasi widget esterno alla griglia. È possibile regolare l'area complessiva utilizzando le 8 maniglie perimetrali di ridimensionamento sulla sovrapposizione.
  - Fai clic su **Fine** per convertire la griglia in widget indipendenti.
  - **Modifica Modello e Scollega**: Selezionando successivamente qualsiasi widget della griglia, la Configurazione widget visualizza una scheda per **Modifica Modello Griglia** (per rientrare in qualsiasi momento nella modalità in tempo reale) o **Scollega dalla Griglia** (per rimuovere definitivamente il collegamento).

### Sincronizzazione Griglia: Collega colonne vs. Rifletti righe

Una griglia in Race Coordinator AI è una matrice bidimensionale strutturata in:

- **Righe (Postazioni Concorrenti)**: Rappresentano ciascuna corsia fisica della pista (**Corsia 1, Corsia 2, ...**) o posizione di gara (**Posizione 1, Posizione 2, ...**). Se la griglia è orientata orizzontalmente, queste postazioni appaiono come colonne verticali.
- **Colonne (Campi Dati)**: Rappresentano le singole metriche di dati all'interno di ciascuna postazione (ad esempio *Nome Pilota, Giri Manche, Ultimo Giro, Giro Migliore, Distacco, Immagine Auto*).

L'Ispettore widget offre due controlli fondamentali nella sezione **Struttura e layout della griglia**: **Collega colonne** e **Rifletti righe** (denominato **Rifletti colonne** con layout orizzontale).

#### Collega colonne

**Collega colonne** controlla la sincronizzazione dello stile grafico tra tutte le colonne di dati della griglia.

- **Selezionato (Predefinito)**:
  - Tutte le colonne di dati condividono un aspetto visivo identico.
  - Qualsiasi modifica alle proprietà grafiche apportata su una colonna viene sincronizzata istantaneamente e in automatico su tutte le colonne della griglia.
  - **Proprietà Sincronizzate**:
    - **Stile Intestazione**: Famiglia di caratteri, dimensione testo, colore testo, colore di sfondo, allineamento testo e altezza intestazione.
    - **Stile Cella Dati**: Famiglia di caratteri, dimensione testo, colore testo, colore di sfondo, commutazione dei colori corsia (`useLaneColors`) e allineamento valori.
    - **Stile Bordo**: Visibilità del bordo, colore bordo, spessore bordo e raggio angoli.
    - **Formato Tempo**: Cifre decimali, formato di visualizzazione e soglie di precisione sub-secondo.
    - **Evidenziazione Telemetria**: Evidenziazione della riga al passaggio del giro.
  - **Interazione con le righe non replicate**: Quando **Replica righe** è deselezionato, le righe sono disaccoppiate tra loro. Se **Collega colonne** è abilitato, la modifica degli stili visivi (come colore di sfondo, colore del testo o font) su una colonna propaga tale modifica a tutte le colonne *all'interno di quella specifica riga*, senza alterare le altre righe.
- **Deselezionato**:
  - Scollega lo stile delle colonne. Ciascuna colonna può avere dimensioni testo, colori, bordi e allineamenti del tutto indipendenti (ad esempio un testo grande e in grassetto con bordo per il *Nome Pilota*, mentre i *Giri* mantengono un testo piccolo con sfondo trasparente).
  - Quando deselezionato, nell'ispettore compaiono pulsanti dedicati (**Applica stile intestazione / valore / bordo / formato a tutte le colonne**) per propagare manualmente e a comando una categoria di stili su tutte le colonne.
- **Comportamento alla Deselezione**:
  - Viene salvato immediatamente nella configurazione.
  - **Stato Grafico della Griglia**: Gli stili attuali delle colonne **non** cambiano immediatamente; la griglia conserva l'aspetto corrente.
  - **Azione Richiesta dall'Utente**: Per visualizzare differenze grafiche, l'utente deve selezionare una colonna e modificarne lo stile. Solo la colonna modificata adotterà le nuove impostazioni.
- **Comportamento alla Nuova Selezione**:
  - Riattiva la sincronizzazione automatica per le future modifiche.
  - **Stato Grafico della Griglia**: La semplice riselezione della casella **non** sovrascrive subito le altre colonne con lo stile di quella selezionata; gli stili esistenti restano inalterati.
  - **Azione Richiesta dall'Utente**: L'utente deve modificare una proprietà di stile (ad es. variare la dimensione del testo di 1px, cambiare colore o attivare/disattivare un bordo) su una colonna qualsiasi. Non appena viene effettuata la modifica, la proprietà si propaga istantaneamente a tutte le colonne della griglia. In alternativa, è possibile fare clic su uno dei pulsanti espliciti «Applica a tutte le colonne».

#### Rifletti righe (o Rifletti colonne)

**Rifletti righe** gestisce la duplicazione e la geometria riga per riga a partire dalla **Riga Master (Corsia 1 / Posizione 1)** verso tutte le altre righe (**Corsie 2..N**).

- **Selezionato (Predefinito)**:
  - Tutte le righe non master rispecchiano fedelmente la riga master.
  - Qualsiasi spostamento, ridimensionamento, regolazione di layout o modifica impostata sulla cella master si replica istantaneamente in tempo reale su tutte le altre corsie o posizioni.
  - I widget non master nella griglia sono vincolati al master e mostrano il badge **Speculare** (ad es. `Corsia 2 (Speculare)`).
- **Deselezionato**:
  - Scollega le righe non master dal modello master.
  - I widget non master mostrano il badge **Indipendente** (ad es. `Corsia 2 (Indipendente)`).
  - L'utente può fare clic su qualsiasi riga individuale (ad es. Corsia 2 o Posizione 3) e personalizzarne proprietà, colori del testo, colori di sfondo o associazioni dati in modo autonomo, senza modificare il master o le altre corsie.
  - Sotto la casella di controllo nell'ispettore compare il pulsante **Rifletti su tutte le righe**.
- **Comportamento alla Deselezione**:
  - Ha effetto immediato nella configurazione.
  - **Stato Grafico della Griglia**: Il layout e le posizioni delle celle **non** si muovono né cambiano subito; posizioni e stili attuali vengono mantenuti.
  - **Azione Richiesta dall'Utente**: L'utente deve selezionare una cella non master e modificarne le proprietà per personalizzare la singola corsia.
- **Comportamento alla Nuova Selezione**:
  - Riabilita la replicazione master nella griglia.
  - **Aggiornamento Immediato**:
    - Se l'utente riseleziona la casella **Rifletti righe** mentre è selezionato un **widget master**, il layout e le impostazioni del master vengono immediatamente applicati a tutte le corsie speculari, sovrascrivendo le modifiche indipendenti.
    - Se l'utente fa clic sul pulsante **Rifletti su tutte le righe**, l'editor risincronizza immediatamente tutte le colonne master su tutte le righe della griglia (`syncAllMasterWidgetsToLanes`), fissa la griglia e aggiorna la tela dell'Editor UI e l'anteprima di gara all'istante senza ulteriori azioni.

#### Schema Riassuntivo

| Controllo | Direzione / Ambito | Cosa Sincronizza | Comportamento quando Deselezionato | Comportamento alla Riselezione | Immediato vs. Azione Richiesta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Collega colonne** | Orizzontale (Tra Colonne) | Stile visivo: caratteri, dimensioni, colori testo/sfondo, bordi, intestazioni, formati orari, evidenziazioni | Le colonne diventano indipendenti; gli stili attuali vengono mantenuti; compaiono i pulsanti «Applica a tutte» | Riattiva l'auto-sync per modifiche future; non sovrascrive subito le altre colonne | **Azione Richiesta**: Modificare la casella non altera gli stili correnti. L'utente deve modificare una proprietà grafica affinché il collegamento abbia effetto tra le colonne. |
| **Rifletti righe** | Verticale (Tra Righe / Corsie) | Geometria e impostazioni: larghezza/altezza cella, scostamenti, associazioni duplicate dalla Corsia 1 Master alle Corsie 2..N | Le righe si rendono indipendenti; l'ispettore mostra lo stato `Indipendente`; corsie personalizzabili singolarmente; compare il pulsante `Rifletti su tutte le righe` | Ripristina la replicazione master; il modello master sovrascrive le personalizzazioni delle singole corsie | **Immediato se il Master è selezionato o al clic sul pulsante**: Facendo clic su `Rifletti su tutte le righe` o riselezionando sul Master si allineano immediatamente tutte le righe. La deselezione mantiene il layout fino alla modifica. |

