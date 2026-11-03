# Editor di Gara

L'**Editor gare** ti consente di creare, personalizzare e gestire le configurazioni di gara. Qui puoi configurare regole di punteggio, rotazioni delle manche, simulazioni di carburante e opzioni di gara.

---

## Panoramica e Salvataggio Automatico

L'Editor di Gara offre un'interfaccia unificata per selezionare, visualizzare, configurare e testare i formati di gara:

- **Selettore di Gara**: Situato nell'intestazione superiore accanto al titolo della pagina, questo menu a discesa elenca tutte le gare configurate e consente di passare rapidamente da una all'altra.
- **Modalità di Sola Lettura**: Per impostazione predefinita, all'apertura dell'editor vengono visualizzate le proprietà della gara, le regole di punteggio e le impostazioni in modalità di sola lettura. I campi modulo sono bloccati per prevenire modifiche accidentali, mentre le sezioni a soffietto e le anteprime delle manche rimangono interattive.
- **Modalità di Modifica**: Facendo clic sull'icona **Modifica** (matita) sulla barra degli strumenti si sbloccano tutti i controlli. Durante la modifica, il selettore di gara è bloccato.
- **Salvataggio Automatico Continuo**: Tutte le modifiche vengono salvate automaticamente in background sul server senza uscire dalla modalità di modifica.
- **Uscita dalla Modalità di Modifica**: Facendo clic sull'icona **Fine** (segno di spunta) vengono convalidate le modifiche e si torna alla modalità di sola lettura.
- **Annullamento Modifiche**: Facendo clic su Annulla vengono ripristinate tutte le modifiche all'ultima versione salvata e si esce dalla modalità di modifica.

Lo spazio di lavoro è suddiviso in due pannelli sincronizzati:

- **Pannello Sinistro (Configurazione Gara)**: Proprietà generali, formato di gara, metodi di punteggio, tipo di rotazione, opzioni di gruppo e simulazione carburante analogico/digitale.
- **Pannello Destro (Anteprima Manche dal Vivo)**: Genera dinamicamente l'elenco completo delle manche in base al tipo di rotazione attivo e al numero di piloti.

---

---

## Configurazione gara {: #race-setup }

Il pannello sinistro configura il formato base e la pista associata per la tua gara:

- **Nome gara**: Nome univoco che identifica il formato della gara nel giorno della corsa e nelle statistiche.
- **Pista**: La pista fisica associata a questa gara. Determina la disponibilità della simulazione di carburante analogico o digitale.
- **Tema**: Tema visivo applicato alla schermata di gara durante l'evento.
- **Formato rotazione manche**: Scegli tra rotazioni standard (**Round Robin**, **Scala**, **Torneo**) o sequenze personalizzate.
- **Passaggi manche**: Quante volte ogni pilota completa l'intera rotazione delle manche.
- **Manche invertite**: Inverte l'ordine delle manche per far gareggiare i piloti in sequenza inversa.
- **Anteprima numero piloti**: Mostra in tempo reale l'elenco delle manche generate in base al numero di piloti.

Il pannello destro mostra l'**Anteprima manche in tempo reale**, aggiornando l'elenco completo delle manche, le rotazioni dei piloti e le corsie mentre modifichi le impostazioni.

---

## Schede di navigazione {: #navigation-tabs }

La barra delle schede superiore offre scorciatoie con un clic per passare direttamente a ciascuna sezione di configurazione:

- **Generale**: Temi, annunci vocali, filtri sui tempi sul giro e preferenze dell'interfaccia.
- **Manche**: Tempi di avvio e avanzamento automatico, ripetizioni delle manche e ordine inverso.
- **Punteggio**: Metodi di classifica manche e generale, condizioni di arrivo, spareggi e manche scartate.
- **Gruppi**: Separazione dei piloti in gruppi, rotazioni indipendenti e avanzamento in classifica.
- **Metodo di partenza**: Partenze automatiche/manuali, partenze scaglionate e regole per falsa partenza.
- **Opzioni a squadre**: Gare endurance a squadre, cambi pilota e limiti di guida.
- **Carburante analogico**: Consumo per giro, capacità serbatoio e velocità di rifornimento.
- **Carburante digitale**: Consumo continuo basato sull'acceleratore e curve personalizzate.
- **Punti stagione**: Tabella punti campionato, punti manche e punti bonus.

Facendo clic su una scheda, l'interfaccia scorre immediatamente ed espande quella sezione della fisarmonica.

---

## Impostazioni generali {: #general-settings }

La sezione Impostazioni generali gestisce presentazione, filtri di cronometraggio e comportamento del direttore di gara:

- **Selezione tema**: Schemi di colori personalizzati e layout del tabellone.
- **Annunci vocali**: Avvisi vocali automatici per cambi al vertice, giri veloci, pit stop e arrivi.
- **Tempo minimo sul giro (s)**: Tempo minimo consentito per filtrare disturbi elettrici o letture errate.
- **Tempo di scivolamento (s)**: Finestra di rilevamento per gestire le auto in derapata sul traguardo.
- **Regole bandiera gialla**: Sospensioni automatiche o manuali con interruzione della corrente in pista.
- **Opzioni interfaccia personalizzata**: Classifiche e widget di telemetria dedicati.

---

## Opzioni manche {: #heat-options }

La sezione Opzioni manche definisce la gestione automatica dei tempi, i cicli e la sequenza delle manche:

- **Tempo di avanzamento automatico (s)**: Secondi di attesa al termine di una manche prima di passare automaticamente alla successiva.
- **Tempo di riscaldamento per avanzamento (s)**: Intervallo di preparazione prima dell'avanzamento automatico.
- **Tempo di avvio automatico (s)**: Ritardo del conto alla rovescia prima di avviare automaticamente la manche successiva.
- **Tempo di riscaldamento per avvio (s)**: Durata del riscaldamento prima dell'avvio automatico.
- **Passaggi manche**: Quante volte ogni pilota completa l'intera rotazione delle manche.
- **Manche invertite**: Inverte la sequenza delle manche per gareggiare in ordine inverso.
---

## Regole di punteggio {: #scoring-rules }

#### Regolazioni dei Giri e del Tempo (Impatto su Classifiche e Metriche)

- **Metodo di classifica manche**: Classifica i piloti in ogni manche per **Maggior numero di giri**, **Giro più veloce** o **Tempo totale più rapido**, con spareggi configurabili.
- **Metodo di arrivo**: Stabilisce come viene determinata la fine di una manche (per **Numero di giri** o **Tempo** trascorso in secondi).
- **Consenti arrivo**: Stabilisce come le auto completano i giri quando il leader taglia il traguardo o scade il tempo (es. fine immediata, consenti a tutti di finire, giro singolo o accredito segmenti automatici).
- **Metodo di classifica generale**: Classifica generale della gara su tutte le manche completate con spareggi e manche scartate personalizzabili.

## Gruppi e fasi {: #groups-and-stages }

La sezione Gruppi e fasi separa i piloti in gruppi distinti che non gareggiano direttamente insieme sulla pista:

- **Separazione dei gruppi**: I piloti vengono organizzati in gruppi isolati e disputano le loro manche in modo autonomo secondo la rotazione configurata.
- **Gruppi massimi**: Imposta il numero massimo di gruppi consentiti per la gara.
- **Bilancia gruppi**: Distribuisce automaticamente i piloti in modo uniforme tra tutti i gruppi.
- **Consenti corsie vuote**: Consente di disputare manche con corsie libere quando i gruppi non coprono tutte le corsie.
- **Forza multiplo del massimo**: Garantisce che il totale delle manche sia un multiplo della capacità massima del gruppo.
- **Alterna manche di gruppo**: Alterna le manche tra i diversi gruppi anziché completare un intero gruppo prima di passare al successivo.
- **Avanzamento minimo**: Posiziona automaticamente i migliori piloti di ogni gruppo ai vertici della classifica generale.
- **Nomi dei gruppi**: Assegna nomi personalizzati a ciascun gruppo (es. Pro, Semi-Pro, Gruppo A/B/C).
---

## Metodi di partenza {: #start-methods }

La sezione Metodi di partenza imposta l'avvio delle manche, il posizionamento in pista e le penalità di partenza:

- **Tempo di partenza / ripartenza (s)**: Durata del conto alla rovescia prima di avviare o riprendere una manche.
- **Ritardo casuale (s)**: Ritardo casuale applicato al conto alla rovescia per impedire partenze anticipate.
- **Partenza dietro il sensore**: Richiede che le auto siano posizionate dietro il traguardo al giro zero.
- **Partenza da posizione attuale**: Consente alle auto di ripartire dalla loro posizione fisica in pista dopo una pausa.
- **Partenze lanciate**: Mantiene la corrente attiva all'avvio per consentire un'accelerazione immediata.
- **Riavvia su falsa partenza**: Arresta e riavvia automaticamente il conto alla rovescia se viene rilevata una falsa partenza.
- **Penalità falsa partenza**: Deduzioni di giri o penalità di tempo per chi anticipa il semaforo verde.
---

## Opzioni gara a squadre {: #team-racing }

La sezione Opzioni gara a squadre abilita formati endurance con più piloti per squadra:

- **Modalità gara a squadre**: Abilita il punteggio a squadre in cui i piloti condividono le manche.
- **Strategia di rotazione piloti**: Alterna automaticamente i piloti a rotazione nel corso delle manche.
- **Cambi pilota a metà manche**: Consente ai piloti di darsi il cambio durante i pit stop o a determinati giri.
- **Limiti di turno (stint)**: Durata minima e massima di guida per pilota.
- **Cambi obbligatori**: Numero minimo di soste e cambi pilota per manche o gara.

---

## Editor gare - Simulazione carburante analogico {: #analog-fuel-simulation }

Il carburante analogico simula il consumo **su base giro**. Poiché le piste analogiche rilevano le vetture al passaggio sulla linea del traguardo, il carburante viene calcolato e detratto al completamento di ogni giro.

#### Opzioni di configurazione

- **Abilita carburante analogico**: Interruttore principale per il monitoraggio analogico. Se deselezionato, la simulazione del carburante è disabilitata e le auto corrono senza restrizioni.
- **Tipo di consumo carburante**: Determina la curva matematica utilizzata per calcolare il consumo in base al ritmo sul giro:
    - **Lineare**: Il consumo scala linearmente con il tempo sul giro. Giri più veloci consumano più carburante, mentre giri due volte più lenti consumano la metà del carburante base.
    - **Quadratico**: Il consumo scala con l'inverso del quadrato del tempo sul giro, penalizzando pesantemente i giri molto veloci.
    - **Cubico**: Il consumo cresce vertiginosamente nei giri veloci, penalizzando drasticamente chi spinge per tempi record.
    - **Curva personalizzata**: Consente di modellare interattivamente la curva punto per punto direttamente sul grafico SVG.
- **Tempo più rapido (s)**: Il tempo sul giro più rapido previsto per la pista e la categoria di vetture (in secondi).
- **Tempo più lento (s)**: Il tempo sul giro più lento (in secondi) per il consumo minimo di carburante.
- **Consumo max di carburante per giro più rapido**: Unità di carburante consumate per giro quando si guida al **Tempo più rapido** o più veloce.
- **Consumo min di carburante per giro più lento**: Unità di carburante consumate per giro quando si guida al **Tempo più lento** o più lento.
    - Per tempi sul giro compresi tra il tempo più rapido e quello più lento, il consumo varia gradualmente in base al **Tipo di consumo** selezionato (Lineare, Quadratico, Cubico o Curva personalizzata).
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
- **Consumo carburante per giro**: Mostra le unità esatte consumate nello spettro dei tempi sul giro (dal Tempo più rapido al Tempo più lento). In modalità Curva personalizzata, maniglie trascinabili e pulsanti di ripristino consentono modifiche istantanee mentre i 3 modelli base rimangono visibili per il confronto.
- **Tempo prima della sosta**: Stima il tempo totale di gara (o giri) prima dell'esaurimento del carburante a un ritmo costante su tutti i modelli.
- **Legenda interattiva e visibilità**: Fai clic con il tasto sinistro su qualsiasi curva nella legenda per attivarla o disattivarla. Nascondere una curva ricalcola dinamicamente la scala degli assi per esaminare più da vicino le curve rimanenti.
- **Schede comparative al passaggio del mouse**: Il passaggio del mouse su ciascun grafico mostra la telemetria comparativa di tutte le curve visibili nel punto esaminato, con campioni di colore, valori e l'indicatore `(Attivo)` sul modello selezionato.

---

---

## Editor gare - Simulazione carburante digitale {: #digital-fuel-simulation }

Il carburante digitale simula il consumo **continuamente in tempo reale** in base alla telemetria dell'acceleratore trasmessa dai controller e decoder digitali.

#### Consumo continuo guidato dall'acceleratore

A differen

---

## Punteggio di stagione {: #season-scoring }

La sezione Punteggio di stagione stabilisce la distribuzione dei punti per i campionati:

- **Tabella punti per posizione**: Punti assegnati per ciascuna posizione di arrivo (es. 25 al 1°, 18 al 2°, ecc.).
- **Punti manche**: Punti opzionali assegnati per i singoli risultati di manche oltre alla classifica generale.
- **Punti bonus**:
    - *Giro più veloce*: Punti extra al pilota con il giro più veloce della gara.
    - *Pole position*: Punti bonus per il miglior tempo in qualifica.
    - *Più giri in testa*: Punti bonus per chi ha condotto il maggior numero di giri.
    - **Classifica campionato**: Somma automatica dei punti stagionali con supporto per le gare scartate.
