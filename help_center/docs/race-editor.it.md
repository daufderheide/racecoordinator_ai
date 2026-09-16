# Editor Gara

## Impostazioni carburante

Race Coordinator AI supporta una simulazione completa del carburante per piste analogiche e digitali, inclusi capacità del serbatoio, livello iniziale, tempi di sosta ai box, velocità di rifornimento, penalità per carburante esaurito e modelli di consumo.

### Compatibilità della pista e selezione del sistema carburante

L'editor gara fornisce due sezioni dedicate alla configurazione del carburante: **Carburante analogico** e **Carburante digitale**. Il sistema disponibile e attivo viene determinato automaticamente dalla pista selezionata per la gara:

- **Piste analogiche**: Tradizionali piste slot car in cui i modelli sono alimentati direttamente dalle rotaie della corsia, senza decoder digitali né telemetria tra auto e pista. Quando viene selezionata una pista analogica, la sezione **Carburante analogico** è abilitata e la sezione **Carburante digitale** viene automaticamente disattivata.
- **Piste digitali**: Sistemi slot car digitali (quali Carrera Digital, Scalextric Digital, Scorpius o oXigen) in cui l'interfaccia trasmette telemetria digitale (ID vettura, percentuale acceleratore, sensori pit lane). Quando viene selezionata una pista digitale, la sezione **Carburante digitale** è abilitata e la sezione **Carburante analogico** viene automaticamente disattivata.

---

### Simulazione carburante analogico

Il carburante analogico simula il consumo **su base giro**. Poiché le piste analogiche rilevano le vetture al passaggio sulla linea del traguardo, il carburante viene calcolato e detratto al completamento di ogni giro.

#### Opzioni di configurazione

- **Abilita carburante analogico**: Interruttore principale per il monitoraggio analogico. Se deselezionato, la simulazione del carburante è disabilitata e le auto corrono senza restrizioni.
- **Tipo di consumo carburante**: Determina la curva matematica utilizzata per calcolare il consumo in base al ritmo sul giro:
    - **Lineare**: Il consumo scala linearmente con il tempo sul giro. Giri più veloci consumano più carburante, mentre giri due volte più lenti consumano la metà del carburante base.
    - **Quadratico**: Il consumo scala con l'inverso del quadrato del tempo sul giro, penalizzando pesantemente i giri molto veloci.
    - **Cubico**: Il consumo cresce vertiginosamente nei giri veloci, penalizzando drasticamente chi spinge per tempi record.
    - **Curva personalizzata**: Consente di modellare interattivamente la curva punto per punto direttamente sul grafico SVG.
- **Velocità di consumo**: Unità base di carburante consumate per giro quando un pilota eguaglia il **Tempo di riferimento**.
- **Tempo di riferimento (s)**: Il tempo sul giro di riferimento base per la pista e la categoria di vetture (in secondi).
    - Giri più veloci (inferiori al tempo di riferimento) consumano più carburante.
    - Giri più lenti (superiori al tempo di riferimento) consumano meno carburante.
    - L'intervallo di calcolo attivo spazia da $0,5 \times \text{Tempo di riferimento}$ a $1,5 \times \text{Tempo di riferimento}$.
- **Capacità**: Il volume totale del serbatoio in unità arbitrarie (ad es. 100).
- **Livello iniziale (%)**: Percentuale di carburante disponibile nel serbatoio all'inizio di una manche (ad es. 100% per serbatoio pieno, o meno per gare sprint o con handicap).
- **Velocità di rifornimento (%/s)**: Velocità di immissione del carburante durante una sosta ai box, espressa in percentuale della capacità totale ripristinata al secondo.
- **Ritardo sosta ai box (s)**: Tempo di attesa stazionario obbligatorio in secondi prima che inizi il rifornimento una volta entrati nella pit lane.
- **Reimposta carburante all'avvio della manche**:
    - **Selezionato**: Il livello di carburante di ogni pilota viene reimpostato al **Livello iniziale** configurato all'avvio di ogni manche.
    - **Deselezionato**: Il carburante residuo viene trasferito tra le manche lungo le rotazioni, richiedendo una gestione strategica per l'intera gara.
- **Azione carburante esaurito**: Penalità inflitta al pilota che esaurisce il carburante (livello raggiunge 0):
    - **Non contare giri**: L'auto continua a correre alimentata, ma i giri completati con serbatoio vuoto non vengono accreditati finché non entra ai box per rifornire.
    - **Termina manche**: La manche si conclude immediatamente per quella vettura, l'alimentazione della corsia viene staccata e il pilota viene classificato.
    - **Intermittenza potenza (Power Stutter)**: Simula i sussulti del motore senza carburante accendendo e spegnendo rapidamente la corrente sulla corsia.
        - *Richiede relè di corsia*: Selezionabile solo se l'interfaccia della pista dispone di relè dedicati per il controllo dell'alimentazione per singola corsia.
        - **Tempo acceso (s)**: Durata in cui la corsia resta alimentata in ogni impulso.
        - **Tempo spento (s)**: Durata in cui la corrente viene interrotta in ogni impulso.

#### Soste ai box e tempo di gara nel carburante analogico

Per evitare che il tempo trascorso fermi ai box venga interpretato come un giro eccessivamente lento (il che ridurrebbe erroneamente il consumo), Race Coordinator AI traccia il **tempo di rifornimento accumulato**. Il tempo trascorso fermi nella corsia box viene sottratto dalla durata totale del giro prima del calcolo del consumo:

$$\text{Tempo di gara} = \text{Tempo sul giro} - \text{Tempo di rifornimento accumulato}$$

#### Anteprime grafiche (Analogico)

- **Confronto multimodello simultaneo**: Tutti e 3 i modelli matematici predefiniti (**Lineare**, **Quadratico** e **Cubico**) vengono tracciati contemporaneamente su entrambi i grafici. Il modello selezionato è evidenziato in grassetto con un bagliore brillante, mentre gli altri modelli rimangono visibili come linee di riferimento attenuate (~40% di opacità).
- **Consumo carburante per giro**: Mostra le unità esatte consumate nello spettro dei tempi sul giro ($0,5 \times \text{ref}$ a $1,5 \times \text{ref}$). In modalità Curva personalizzata, maniglie trascinabili e pulsanti di ripristino consentono modifiche istantanee mentre i 3 modelli base rimangono visibili per il confronto.
- **Tempo prima della sosta**: Stima il tempo totale di gara (o giri) prima dell'esaurimento del carburante a un ritmo costante su tutti i modelli.
- **Legenda interattiva e visibilità**: Fai clic con il tasto sinistro su qualsiasi curva nella legenda per attivarla o disattivarla. Nascondere una curva ricalcola dinamicamente la scala degli assi per esaminare più da vicino le curve rimanenti.
- **Schede comparative al passaggio del mouse**: Il passaggio del mouse su ciascun grafico mostra la telemetria comparativa di tutte le curve visibili nel punto esaminato, con campioni di colore, valori e l'indicatore `(Attivo)` sul modello selezionato.

---

### Simulazione carburante digitale

Il carburante digitale simula il consumo **continuamente in tempo reale** in base alla telemetria dell'acceleratore trasmessa dai controller e decoder digitali.

#### Consumo continuo guidato dall'acceleratore

A differenza dell'analogico (che calcola il carburante solo sulla linea del traguardo), il digitale ricalcola il consumo a ogni pacchetto di telemetria ricevuto:

$$\text{Carburante consumato} = \text{Consumo al secondo} \times \Delta t$$

I piloti con guida fluida che rilasciano in curva consumano molto meno rispetto a chi tiene sempre premuto a fondo nei rettilinei.

#### Opzioni di configurazione

- **Abilita carburante digitale**: Interruttore principale per il monitoraggio digitale.
- **Tipo di consumo carburante**: Modello matematico applicato alla posizione dell'acceleratore ($0\,\%$ a $100\,\%$):
    - **Lineare**: Il consumo è direttamente proporzionale alla posizione del comando.
    - **Quadratico**: Il consumo cresce moderatamente a metà acceleratore e accelera verso il pieno gas.
    - **Cubico**: Le accelerazioni massime consumano esponenzialmente più rispetto a una guida costante a medio regime.
    - **Curva personalizzata**: Consente di personalizzare la risposta acceleratore-consumo tra lo 0% e il 100% di gas.
- **Velocità di consumo**: Unità massime di carburante consumate al secondo al **100% di acceleratore**.
- **Capacità**, **Livello iniziale (%)**, **Velocità di rifornimento (%/s)**, **Ritardo sosta ai box (s)**, **Reimposta carburante all'avvio della manche**: Funzionamento analogo a quello del carburante analogico.
- **Azione carburante esaurito**:
    - **Non contare giri**: L'auto rimane marciante ma i giri completati a serbatoio vuoto non vengono registrati.
    - **Termina manche**: Il pilota viene ritirato dalla manche non appena esaurisce il carburante.

#### Anteprime grafiche (Digitale)

- **Confronto multimodello simultaneo**: Traccia contemporaneamente le curve di risposta lineare, quadratica e cubica, evidenziando il modello selezionato e mostrando gli altri come riferimento di sfondo.
- **Consumo carburante digitale**: Traccia la percentuale di acceleratore ($0\,\%$ a $100\,\%$) rispetto al consumo al secondo per tutti i modelli.
- **Tempo prima dell'esaurimento**: Traccia la percentuale di acceleratore rispetto ai secondi continui di guida prima che il serbatoio si svuoti completamente.
- **Legenda interattiva e ridimensionamento dinamico**: Attiva o disattiva le curve facendo clic nella legenda, riadattando automaticamente la scala degli assi.
- **Schede comparative al passaggio del mouse**: Lo scorrimento del mouse visualizza i valori in tempo reale per ciascuna curva visibile a quella percentuale di acceleratore.

---

### Modifica interattiva della curva personalizzata

Quando si seleziona **Curva personalizzata** come tipo di utilizzo (in analogico o in digitale), i punti di controllo compaiono direttamente sulla curva SVG:

- **Generazione iniziale della curva**: Al primo passaggio a Curva personalizzata, i 5 punti iniziali vengono campionati direttamente dal profilo attivo (Lineare, Quadratico o Cubico) senza salti visivi.
- **Trascina e rilascia interattivo**: Fai clic e trascina qualsiasi punto in alto, in basso, a sinistra o a destra per rimodellare la curva.
- **Monotonia garantita**:
    - *Carburante analogico*: I tempi sul giro più veloci consumano sempre una quantità di carburante maggiore o uguale rispetto ai tempi più lenti (curva monotona non crescente). Il trascinamento è vincolato per evitare inversioni.
    - *Carburante digitale*: Livelli di acceleratore più alti consumano sempre una quantità di carburante maggiore o uguale rispetto a livelli più bassi (curva monotona non decrescente).
- **Aggiunta di punti**: Fai clic lungo la linea della curva per inserire un nuovo punto di controllo nella posizione interpolata.
- **Eliminazione di punti**: Fai clic con il tasto destro su un punto intermedio per rimuoverlo (i 2 punti terminali restano fissi).
- **Pulsanti di ripristino**: Ripristina rapidamente la curva ai modelli Lineare, Quadratico o Cubico tramite i pulsanti sopra il grafico.
- **Persistenza in background**: Se passi a un profilo predefinito e poi torni a Curva personalizzata, i tuoi punti modificati vengono conservati.
- **Calcoli autorevoli sul server**: Il server valuta il consumo durante le gare utilizzando lo stesso algoritmo di interpolazione lineare a tratti, garantendo un'anteprima identica alla gara.
