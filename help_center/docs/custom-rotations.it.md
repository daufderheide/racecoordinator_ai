# Set di Rotazioni Personalizzate

## Panoramica {: #overview }

L'**Editor dei Set di Rotazioni Personalizzate** consente di progettare, modificare e organizzare schemi di rotazione delle manche su misura per la propria pista. Mentre Race Coordinator AI fornisce rotazioni algoritmiche standard come **Round Robin**, **Round Robin Europeo**, **Manche Singola** e **Gare Step Up**, i set di rotazioni personalizzate offrono ai direttori di gara un controllo manuale completo, corsia per corsia, sulla pianificazione dei piloti, sull'ordine delle manche e sull'assegnazione delle corsie.

Un'**Entità Set di Rotazioni Personalizzate** rappresenta una raccolta (o insieme) di singole configurazioni di rotazione specificamente adattate al numero di corsie fisiche di una pista (ad esempio 2, 4, 6 o 8 corsie). All'interno di una singola entità di set di rotazioni personalizzate, è possibile definire molteplici modelli di rotazione ottimizzati per differenti numeri di partecipanti.

I set di rotazioni personalizzate sono ideali per:

- **Configurazioni di Pista Particolari:** Piste con caratteristiche di corsia specifiche, configurazioni con handicap o requisiti di corsia box.
- **Formati di Club e Regole Interne:** Programmi di rotazione tradizionali di club in cui determinati abbinamenti di piloti o sequenze di corsie devono essere rigorosamente mantenuti.
- **Sequenze di Fasi e Turni Fissi:** Gare speciali di esibizione, derby o formati a squadre in cui le sequenze algoritmiche Round Robin non rispecchiano il regolamento della manifestazione.

---

## Come Funzionano i Set di Rotazioni Personalizzate {: #how-custom-rotations-work }

### Capacità Massima di Piloti per Rotazione {: #maximum-driver-capacity }

Un'entità di set di rotazioni personalizzate non definisce unicamente un singolo programma statico; contiene un **insieme di rotazioni**, in cui **ciascuna rotazione specifica una rotazione per un numero massimo di piloti** (`numDrivers`).

All'interno di ciascuna rotazione:

- **Teste di Serie Virtuali:** I piloti sono identificati da numeri di testa di serie: `Pilota 1`, `Pilota 2`, ... fino a `Pilota N` (dove `N` è la capacità massima di piloti della rotazione).
- **Assegnazioni di Corsia:** Per ciascuna manche, a ciascuna corsia fisica viene assegnata una testa di serie virtuale specifica (ad es. Corsia 1: Pilota 1, Corsia 2: Pilota 2), oppure viene lasciata vuota/non assegnata.
- **Piazzamento dei Partecipanti:** All'inizio di una gara, i piloti registrati vengono assegnati alle teste di serie da 1 a $M$ secondo il loro ordine di qualificazione (o sorteggio).

Ad esempio, un'entità "Sprint di Club a 4 Corsie" può contenere:

- Una **Rotazione per 4 Piloti:** Un programma di 4 manche in cui 4 piloti gareggiano una volta su ciascuna delle 4 corsie.
- Una **Rotazione per 5 Piloti:** Un programma di 5 manche in cui 5 piloti ruotano sulle 4 corsie, con un pilota a riposo in ciascuna manche.
- Una **Rotazione per 6 Piloti:** Un programma di 6 manche che garantisce un tempo di pista equilibrato.
- Una **Rotazione per 8 Piloti:** Un programma di 8 manche adatto a griglie di partenza più numerose.

---

### Algoritmo di Selezione della Rotazione {: #rotation-selection-algorithm }

Quando inizia una gara configurata con un formato di rotazione personalizzata (o durante la generazione dell'anteprima in tempo reale delle manche nell'editor di gara), Race Coordinator AI determina automaticamente quale rotazione dell'insieme utilizzare.

Il sistema conta il numero di piloti attivi partecipanti (`driverCount`) e seleziona la rotazione ottimale adottando una rigorosa **strategia di priorità a tre livelli**:

#### 1. Livello 1: Corrispondenza Esatta {: #selection-tier-1 }
Il sistema cerca innanzitutto una rotazione il cui numero massimo di piloti configurato (`numDrivers`) **corrisponda esattamente** al numero di piloti attivi (`numDrivers == driverCount`).

- **Risultato:** Viene selezionata la rotazione con corrispondenza esatta.
- **Mappatura delle Corsie:** Ciascun pilota partecipante corrisponde 1:1 alla rispettiva testa di serie virtuale (il Pilota 1 corre come Testa di serie 1, il Pilota 2 come Testa di serie 2, ecc.). Non vi sono corsie vuote a meno che la rotazione non sia stata esplicitamente progettata con corsie libere.

#### 2. Livello 2: La Più Vicina Superiore (Rotazione Minore Maggiore del Numero di Piloti) {: #selection-tier-2 }
Qualora nessuna rotazione corrisponda al numero esatto, il sistema cerca tutte le rotazioni dell'insieme la cui capacità massima di piloti sia **maggiore** del numero di piloti attivi (`numDrivers > driverCount`). Tra queste, seleziona la rotazione con la **differenza minore**:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Risultato:** Viene selezionata la rotazione superiore più vicina per garantire a tutti i piloti presenti di gareggiare.
- **Gestione delle Corsie Vuote:** Poiché i piloti presenti sono meno rispetto a quelli per cui la rotazione è stata progettata, qualsiasi posizione assegnata a una testa di serie virtuale superiore al numero di piloti attivi (`Testa di serie > driverCount`) viene automaticamente occupata da una **posizione pilota vuota** (`Driver.EMPTY_DRIVER`). Tale corsia resterà vuota per quella manche, mentre tutti i partecipanti gareggeranno nelle posizioni programmate.

#### 3. Livello 3: La Più Vicina Inferiore (Rotazione Maggiore Minore del Numero di Piloti) {: #selection-tier-3 }
Se il numero di piloti attivi supera la capacità massima di **qualsiasi** rotazione definita nell'insieme (ad esempio se partecipano 9 piloti, ma la rotazione più grande ne supporta solo 8), il sistema ripiega sulla rotazione con la **capacità maggiore inferiore al numero di piloti attivi**:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Risultato:** Viene selezionata la rotazione inferiore più vicina.
- **Limitazione della Capacità:** Solo i piloti la cui testa di serie rientra nella capacità della rotazione selezionata (Piloti da 1 a `numDrivers`) saranno inseriti nelle manche. I piloti con indice di testa di serie superiore a `numDrivers` non riceveranno assegnazioni di manche.

!!! tip "Consiglio di Progettazione: Coprire Tutte le Dimensioni della Griglia"
    Per garantire che tutti i piloti gareggino senza partecipanti esclusi né corsie vuote impreviste, create una rotazione per ciascuna dimensione della griglia prevista (ad es. 4, 5, 6, 7 e 8 piloti) all'interno della stessa entità di set di rotazioni personalizzate.

---

### Esempi Pratici di Selezione {: #selection-examples }

Ipotizzando un'entità di set di rotazioni personalizzate con tre rotazioni definite: **4 Piloti**, **6 Piloti** e **8 Piloti**. La tabella seguente mostra la rotazione selezionata da Race Coordinator AI in base al numero di partecipanti:

| Piloti Registrati | Disponibili nell'Insieme | Rotazione Selezionata | Regola di Selezione | Comportamento in Pista e Corsie Vuote |
| :---: | :---: | :---: | :---: | :--- |
| **4 Piloti** | 4, 6, 8 | **Rotazione per 4 Piloti** | **Livello 1 (Corrispondenza Esatta)** | Perfetta aderenza. Tutte le corsie occupate; gareggiano tutti i 4 piloti. |
| **5 Pilotos** | 4, 6, 8 | **Rotazione per 6 Piloti** | **Livello 2 (Più Vicina Superiore)** | I posti di testa di serie 6 sono vuoti. Gareggiano i piloti 1–5. |
| **6 Piloti** | 4, 6, 8 | **Rotazione per 6 Piloti** | **Livello 1 (Corrispondenza Esatta)** | Perfetta aderenza. Tutte le corsie occupate; gareggiano tutti i 6 piloti. |
| **7 Piloti** | 4, 6, 8 | **Rotazione per 8 Piloti** | **Livello 2 (Più Vicina Superiore)** | I posti di testa di serie 8 sono vuoti. Gareggiano i piloti 1–7. |
| **8 Piloti** | 4, 6, 8 | **Rotazione per 8 Piloti** | **Livello 1 (Corrispondenza Esatta)** | Perfetta aderenza. Tutte le corsie occupate; gareggiano tutti gli 8 piloti. |
| **9 Piloti** | 4, 6, 8 | **Rotazione per 8 Piloti** | **Livello 3 (Più Vicina Inferiore)** | Gareggiano i piloti 1–8. Il pilota 9 non viene programmato. |

---

## Creazione di un Set di Rotazioni Personalizzate {: #creating-custom-rotations }

Per creare una nuova entità di set di rotazioni personalizzate:

1. Aprire il **Gestore Risorse** dal menu principale o dalla schermata di configurazione.
2. Nel pannello di sinistra, fare clic sul pulsante **Nuovo Set di Rotazioni Personalizzate** (o filtrare per **Set di Rotazioni Personalizzate** e selezionare una scheda esistente per modificarla).
3. Si aprirà l'**Editor delle Rotazioni**:
   - Durante la creazione di un nuovo set di rotazioni, l'editor mostra inizialmente una scheda di stato vuoto con istruzioni e il collegamento **Ulteriori informazioni sui set di rotazioni personalizzate** che rinvia a questa guida.
   - Digitare un **Nome Risorsa** univoco nel pannello di configurazione.
   - Selezionare la **Pista** di destinazione. La pista configura automaticamente il numero di corsie per tutte le rotazioni dell'insieme.

---

## Progettazione delle Manche e delle Corsie {: #designing-heats }

### Aggiunta di Rotazioni all'Insieme {: #adding-rotations }

1. Fare clic sul pulsante **Aggiungi Rotazione** (`+`) nella barra degli strumenti in alto per creare la prima scheda di rotazione.
2. Impostare il campo **Numero di Piloti** nell'intestazione della scheda. Questo valore stabilisce la capacità massima di piloti per quella specifica rotazione.
3. È possibile inserire facoltativamente una **Descrizione** (etichetta) nell'intestazione per identificare la rotazione (es. `EURO D18 G3-666 X>1`, `Formato Sprint` o `Esibizione`). Quando si crea una nuova rotazione, questo campo è vuoto; quando si importa un file, assume automaticamente come valore predefinito il nome del file importato.
4. La scheda conterrà automaticamente una prima manche con le corsie previste per la vostra pista.

### Aggiunta e Riordino delle Manche {: #adding-heats }

- **Aggiungi Manche:** Fare clic sull'icona `+` nell'intestazione della rotazione per inserire ulteriori manche.
- **Riordina Manche:** Trascinare e rilasciare le schede delle manche nella griglia per modificare la sequenza di gara.
- **Elimina Manche:** Fare clic sull'icona del cestino di una manche per rimuoverla.

### Assegnazione dei Piloti alle Corsie {: #assigning-drivers }

- **Gruppo Piloti Virtuali:** Il pannello di sinistra mette a disposizione un gruppo di piloti virtuali (`Pilota 1`, `Pilota 2`, ecc.). È possibile regolare il numero di piloti nel gruppo per generare tutte le teste di serie necessarie.
- **Trascina e Rilascia:** Trascinare le pedine dei piloti dal gruppo direttamente nelle caselle delle corsie di qualsiasi manche.
- **Scambio di Corsia:** Trascinare la pedina di un pilota da una corsia all'altra per scambiarne le posizioni.
- **Svuota Corsia:** Trascinare un pilota fuori da una corsia per lasciarla libera.

### Assegnazione dei Gruppi {: #group-assignments }

Ciascuna scheda della manche presenta una casella di testo per il **Gruppo**:

- Assegnare manche a numeri di gruppo differenti (ad es. Gruppo 1, Gruppo 2) quando si disputano gare a gironi o per categorie.
- I piloti di gruppi distinti gareggiano separatamente e le classifiche possono essere suddivise per gruppo nelle impostazioni di gara.

### Verifica dell'Equità delle Corsie {: #lane-equality-validation }

L'equità è essenziale nello slot car racing. Race Coordinator AI verifica continuamente la distribuzione delle corsie in ciascuna rotazione:

- **Contrassegno Verde:** Indica che ciascun pilota gareggia lo stesso numero di volte su ciascuna corsia nell'arco della rotazione.
- **Contrassegno Arancione:** Indica uno squilibrio nell'assegnazione delle corsie (ad esempio, il Pilota 1 corre due volte sulla Corsia 1, ma mai sulla Corsia 4).
- **Rapporto di Equità:** Fare clic sul contrassegno di equità per visualizzare il **Rapporto Dettagliato di Equità delle Corsie**, che illustra una matrice con il numero esatto di passaggi di ciascun pilota su ciascuna corsia.

### Ordinamento delle Rotazioni {: #sorting-rotations }

Fare clic sul pulsante **Ordina Rotazioni** (`swap_vert`) nella barra del titolo per disporre automaticamente tutte le schede di rotazione in ordine crescente secondo il numero massimo di piloti.

---

## Importazione ed Esportazione delle Rotazioni {: #importing-exporting }

È possibile condividere rotazioni tra postazioni o archiviarle:

- **Esporta Intera Risorsa:** Fare clic su **Esporta** nella barra degli strumenti superiore per scaricare l'intera entità di set di rotazioni personalizzate in formato `.json`.
- **Esporta Singola Rotazione:** Fare clic sull'icona di esportazione (`upload`) nella scheda di una rotazione per esportare soltanto quella configurazione.
- **Importa Rotazioni:** Fare clic su **Importa** per caricare file `.json` o file cronologici di Race Coordinator (`.txt` in formato RC1) nella propria risorsa. La descrizione della rotazione assume automaticamente per impostazione predefinita il nome del file importato.

---

## Utilizzo dei Set di Rotazioni Personalizzate nelle Gare {: #using-in-races }

Dopo aver salvato la risorsa di set di rotazioni personalizzate:

1. Aprire l'[Editor di Gara](race-editor.md).
2. Nella sezione **Configurazione Gara** del pannello di sinistra, impostare **Formato di Rotazione Manche** su **Set di rotazioni personalizzate**.
3. Selezionare l'entità di set di rotazioni personalizzate dal menu a discesa **Set di rotazioni personalizzate**.
4. Regolare i parametri di gara:
   - **Giri Completi di Manche:** Ripete l'intera sequenza di rotazione personalizzata $N$ volte.
   - **Inverti Manche:** Inverte l'ordine delle manche per disputare la sequenza al contrario.
5. Utilizzare il dispositivo di scorrimento **Anteprima Numero Piloti** ed esaminare l'**Anteprima Manche in Tempo Reale** nel pannello di destra per verificare le assegnazioni prima dell'evento.
