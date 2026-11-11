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
- **Escludi giri con derapata dai record**: Quando abilitato, i giri completati con derapata sono esclusi dai record di gara, manche e pilota.
- **Regole bandiera gialla**: Sospensioni automatiche o manuali con interruzione della corrente in pista.
- **Opzioni interfaccia personalizzata**: Classifiche e widget di telemetria dedicati.

### Meccanica di Deriva e Cronometraggio del Drift {: #drifting-and-drift-timing }

Nelle gare di slot car, i modelli sono alimentati dalla tensione elettrica erogata tramite le bandelle o rotaie metalliche incorporate nella pista. Quando la corrente viene interrotta – come durante una neutralizzazione con bandiera gialla, alla fine di una manche (**Heat Over**) o al termine della gara (**Race Over**) –, le auto non si arrestano istantaneamente a velocità zero. A causa dell'inerzia fisica, della massa, dell'attrazione magnetica del motore e dell'attrito, le auto continuano a scivolare in avanti per inerzia residua anche dopo il distacco della corrente.

In Race Coordinator AI e nel gergo dello slot racing, questo moto per inerzia a corrente spenta viene definito **"deriva"** o **"drift"**.

!!! note "Definizione di Drift nelle Slot Car"
    Nello slot racing, il termine "drift" o "deriva" **non** indica sbandate laterali in curva, testacoda o acrobazie. Indica rigorosamente l'avanzamento per inerzia in rettilineo di un'auto spinta dal moto residuo dopo lo spegnimento della corrente di pista.

Quando un'auto si avvicina al traguardo o al ponte sensori proprio nel momento in cui salta la corrente, il suo slancio può farle attraversare il sensore prima che si fermi del tutto. Race Coordinator AI include algoritmi hardware ad altissima precisione e regole dedicate per gestire queste circostanze con totale equità sportiva.

#### La Distinzione Fondamentale: "Giro in Deriva" vs "Giro con Deriva Coinvolta"

In Race Coordinator AI esiste una distinzione netta tra un **Giro in Deriva** (`isDrift = true`) e un **Giro con Deriva Coinvolta** (`driftInvolved = true`):

##### 1. Un "Giro in Deriva" (`isDrift = true`)
Un **Giro in Deriva** è un giro registrato fisicamente e conteggiato quando un'auto attraversa la linea del traguardo o il sensore **MENTRE la corrente di pista è SPENTA** (nello specifico durante gli stati `Paused` / bandiera gialla, `HeatOver` o `RaceOver`), entro la finestra di **Tempo di deriva** configurata.

- **Evento Fisico**: L'auto supera il traguardo per sola inerzia a corrente staccata.
- **Indicatore Visivo**: La colonna della corsia sul tabellone principale e la finestra di ispezione dei giri mostrano un contrassegno ben visibile **`DRIFT`** accanto al tempo sul giro.
- **Annuncio Vocale**: Riproduce il **Suono giro in derapata** (`driftLapAudio`) del pilota con priorità urgente (`urgent`) (es. *"Drift lap for {driver.nickname}"*).
- **Accredito del Giro**: Il giro viene conteggiato nel totale dei giri del pilota per la manche e per la classifica generale. Il tempo sul giro memorizzato somma il tempo parziale maturato prima della pausa alla frazione di secondo di scivolamento sul sensore.
- **Statistiche**: Incrementa il contatore dei giri in deriva nelle statistiche di gara (`driftLapCount`). I segmenti parziali automatici vengono azzerati.

##### 2. Un "Giro con Deriva Coinvolta" (`driftInvolved = true`, ma `isDrift = false`)
Un **Giro con Deriva Coinvolta** è un giro completato e registrato in **normali condizioni di BANDIERA VERDE con corrente attiva**, ma la cui durata totale include un intervallo di interruzione o tempo accumulato dovuto a una pausa o al passaggio tra manche.

- **Evento Fisico**: L'auto taglia il traguardo a corrente **ATTIVA** in pieno regime di gara. Tuttavia, nel corso di quel singolo giro, la corrente è stata disattivata e poi riattivata.
- **Scenari Tipici**:
    - **Pausa e Riavvio con Bandiera Gialla a Metà Giro**: Un pilota ha completato 3,2 secondi di un giro da 5,0 secondi quando scatta una bandiera gialla. La corrente viene staccata e l'auto si arresta per inerzia sul rettilineo opposto (senza attraversare il sensore: non è un giro in deriva). Il timer hardware si congela e i 3,2 secondi vengono salvati nel tempo in sospeso del pilota, contrassegnando internamente il tempo di deriva (`markDriftTime()`). Al ritorno della bandiera verde, i timer ripartono da zero. L'auto percorre i restanti 1,8 secondi sotto alimentazione e taglia il traguardo. Il tempo registrato è di 5,0 secondi ($3{,}2\,\text{s} + 1{,}8\,\text{s}$). Poiché il traguardo è stato tagliato sotto bandiera verde, **non è un Giro in Deriva** (nessun badge `DRIFT` e audio standard), ma è un **Giro con Deriva Coinvolta** perché la sua durata è stata spezzata da uno stop.
    - **Gara Continua su Più Manche (`Start at Current`)**: Nei formati a distanza progressiva (`start_at_current = true`), dove le auto si fermano dove si trovano al termine della manche e ripartono da quella posizione esatta nella manche successiva, il tempo parziale incompleto della manche precedente viene ereditato. Al completamento del primo giro della nuova manche sotto bandiera verde, quel giro incorpora il tempo della manche precedente: è un **Giro con Deriva Coinvolta**.

---

#### Le Due Opzioni di Configurazione della Gara

Nella sezione **Impostazioni generali**, Race Coordinator AI fornisce due opzioni dedicate per regolare la deriva e l'ammissibilità ai record:

```
+---------------------------------------------------------------------------------+
| Tempo minimo sul giro (s): [ 2.0 ]   Tempo di deriva (s): [ 0.5 ]               |
|                                                                                 |
| [ ] Modalità prova    [X] Escludi giri con derapata dai record                  |
+---------------------------------------------------------------------------------+
```

##### Opzione 1: Tempo di deriva (`drift_time`)
- **Tipo di Valore**: Numero decimale in secondi (es. `0.0`, `0.5`, `1.0`, `2.0`).
- **Valore Predefinito**: `0.5` secondi.
- **Descrizione**: Definisce la finestra temporale massima immediatamente successiva a un'interruzione di corrente (bandiera gialla, fine manche, fine gara) entro cui il passaggio sul sensore viene accettato come giro valido per inerzia.

!!! warning "Piste senza Relè di Controllo Corrente"
    Se la pista non dispone di relè hardware per interrompere la corrente, la pista rimane alimentata anche durante le pause, a fine manche e a fine gara. Su queste piste, **il Tempo di deriva deve essere impostato su `0` (nessun giro in deriva)**. Altrimenti, i piloti che continuano a premere il pulsante a corsa ferma riceverebbero ingiustamente giri in deriva sotto tensione.

Al distacco della corrente, il sistema memorizza l'esatto timestamp in millisecondi. Se viene rilevato un impulso a pista ferma:

$$\Delta t = \text{Orario di Rilevamento} - \text{Orario di Arresto}$$

$$\begin{aligned}
\text{Se } \Delta t \le \text{Tempo di deriva} &\implies \textbf{Accettato come Giro in Deriva } (\text{isDrift} = \text{true}) \\
\text{Se } \Delta t > \text{Tempo di deriva} &\implies \textbf{Rifiutato e ignorato}
\end{aligned}$$

- **Perché è Indispensabile un Limite di Tempo**:
    - **Equità verso le Auto in Corsa**: Un'auto che si trovava a pochi centimetri dal traguardo al momento dello stop merita il giro se la propria inerzia la porta a tagliare il sensore un istante dopo.
    - **Protezione da Errori dei Commissari**: Senza un limite, un commissario che raccoglie un'auto uscita di pista potrebbe involontariamente farla scorrere sul sensore secondi o minuti dopo la chiamata, attribuendo un giro ingiustificato.
- **Indicazioni di Regolazione**:
    - **Piste senza relè di alimentazione**: Se la pista non include relè per staccare la corrente, **il Tempo di deriva deve essere impostato su `0` (0.0s)** (nessun giro in deriva). La corrente non venendo mai a mancare, i piloti possono continuare a guidare; un valore superiore a zero conterebbe erroneamente questi giri a motore acceso come giri in deriva.
    - **Modelli con Magnete (HO, 1/32 con magnete)**: Il forte freno magnetico contro le bandelle metalliche ferma l'auto in pochissimo spazio. Consigliato: da `0.3` a `0.8` secondi.
    - **Modelli senza Magnete / Categorie Pesanti (1/24, piste in legno)**: L'elevata inerzia e l'assenza di magneti determinano lunghe scivolate. Consigliato: da `1.0` a `2.5` secondi.
    - **Disattivato (`0.0s`)**: Disattiva del tutto i giri in deriva; ogni impulso a corrente spenta viene cestinato.

##### Opzione 2: Escludi giri con derapata dai record (`adjust_drift_laps`)
- **Tipo di Valore**: Casella di spunta (`true` / `false`).
- **Valore Predefinito**: Disattivato (`false`).
- **Descrizione**: Stabilisce se i giri che hanno coinvolto una qualunque forma di deriva siano ammessi a concorrere per record personali, di manche, di gara o di pista.

Al completamento di un giro, il motore di gara valuta:

$$\text{driftInvolved} = \text{isDrift} \lor \text{hasDriftTime}$$

$$\text{countTowardsRecords} = \neg(\text{adjust\_drift\_laps} \land \text{driftInvolved})$$

- **Quando è attivato (`true`)**:
    - Qualsiasi giro con deriva coinvolta – sia un **Giro in Deriva** (`isDrift = true`) O un **Giro con Deriva Coinvolta** (per interruzione o passaggio manche) – viene squalificato dai record (`countTowardsRecords = false`).
    - Il giro viene escluso da:
        1. **Miglior Giro Personale del Pilota (`bestLapTime`)**: Non aggiornerà il record personale.
        2. **Miglior Giro della Manche**: Non figurerà come giro più veloce della manche.
        3. **Miglior Giro della Gara**: Non figurerà come giro più veloce della gara.
        4. **Record di Pista e di Corsia**: Non entrerà nell'albo d'oro storico della pista.
        5. **Annunci Audio di Record**: Gli avvisi celebrativi per record e giri veloci vengono tacitati.
    - **Nota Fondamentale**: Il giro **continua a contare al 100% per i giri percorsi dal pilota, la posizione nella manche e la classifica di gara**. Viene negato solo il riconoscimento statistico di record.
- **Quando è disattivato (`false`)**:
    - Qualsiasi giro che soddisfi il tempo minimo può stabilire record, anche se ha attraversato una pausa o è stato completato a motore spento scivolando per inerzia.
- **Perché i Campionati Ufficiali Attivano Questa Opzione**:
    - I giri interrotti alterano le temperature di motori e gomme; ripartire da fermi altera il ritmo rispetto a un giro lanciato a piena velocità sotto bandiera verde.
    - Anche il passaggio a motore spento sul traguardo riflette una dinamica anomala.
    - Questa impostazione garantisce che i record della pista rappresentino esclusivamente giri perfetti, continui e a pieno regime.

---

#### Tabella Comparativa di Riepilogo

| Caratteristica / Comportamento | Giro Regolare con Bandiera Verde | Giro in Deriva (`isDrift = true`) | Giro con Deriva Coinvolta (`hasDriftTime = true`, `isDrift = false`) |
| :--- | :--- | :--- | :--- |
| **Corrente sulla Pista al Traguardo** | **ACCESA** (Bandiera Verde) | **SPENTA** (Gialla, Fine Manche/Gara) | **ACCESA** (Bandiera Verde) |
| **Condizione di Rilevamento Sensore** | A piena potenza di gara | Per inerzia entro il `drift_time` | A potenza dopo una pausa o cambio manche |
| **Flag nei Dati `isDrift`** | `false` | `true` | `false` |
| **Stato Interno `driftInvolved`** | `false` | `true` | `true` |
| **Contrassegno a Schermo** | Nessuno | Badge **`DRIFT`** nella colonna corsia | Nessuno |
| **Notifica Sonora** | Suono giro / record standard | **Suono giro in derapata** (`urgent`) | Suono giro standard (nessun audio deriva) |
| **Valido per Totale Giri e Classifica** | **Sì** (valore pieno) | **Sì** (valore pieno) | **Sì** (valore pieno) |
| **Valido per Record (`adjust_drift_laps` = DISATTIVATO)** | **Sì** | **Sì** (se più rapido del record) | **Sì** (se più rapido del record) |
| **Valido per Record (`adjust_drift_laps` = ATTIVATO)** | **Sì** | **Escluso / Squalificato** | **Escluso / Squalificato** |

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
- **Metodo di classifica generale**: Classifica generale della gara su tutte le manche completate per **Numero di giri**, **Giro più veloce**, **Tempo totale**, **Media sul giro** o **Punti**, con spareggi personalizzabili (incluso **Numero di giri**) e manche scartate.
- **Avanzamento a gradini (Step-Up)**: Configura la gara a scala progressiva. Il valore predefinito è `0` (disattivato). Con valori $S > 0$, le manche vengono suddivise in gradini progressivi dove i piloti dei gradini superiori attendono i qualificati promossi dai gradini inferiori.

### Gare a Scala (Step-Up)

Quando **Avanzamento a gradini (Step-Up)** è configurato con un valore intero positivo ($S > 0$), Race Coordinator AI riorganizza manche e classifiche secondo una scala progressiva:

- **Gradini della scala**: I piloti vengono inseriti nei gradini in base alla loro testa di serie. I piloti con testa di serie inferiore gareggiano nel Gradino 1 (il gradino più basso).
- **Distribuzione dei piloti**:
  - Il gradino più basso contiene tra 2 e il numero di corsie della pista ($2 \le N_{bottom} \le L$) piloti.
  - Ciascun gradino superiore successivo contiene $L - S$ piloti assegnati e $S$ posizioni di avanzamento riservate ai qualificati del gradino precedente.
  - Il gradino superiore rappresenta la Finale, dove i migliori piloti attendono i qualificati promossi.
- **Rotazioni complete per gradino**: Ogni gradino esegue l'intera rotazione di manche configurata per la gara (es. Round Robin o rotazione personalizzata).
- **Promozione e azzeramento punteggio**: Al termine di un gradino (segnato dalla manche limite di gradino), i migliori $S$ piloti salgono al gradino successivo. Le statistiche generali dei piloti promossi vengono azzerate: solo le manche del gradino più alto raggiunto contano per la classifica generale finale.
- **Classifica generale a livelli**: I piloti dei gradini inferiori non possono mai superare i piloti dei gradini superiori nella classifica generale finale, a prescindere da giri o tempi individuali. Il vincitore del gradino finale vince la gara.
- **Gare a gruppi**: Nelle gare a gruppi con avanzamento attivo, ogni gruppo scala la propria scala in modo indipendente.
- **Supporto in Modifica manche**: Nella schermata Modifica manche, i piloti promossi sono contraddistinti da appositi badge e le manche limite possono essere esaminate e modificate.

---

## Punteggio a punti {: #points-scoring }

La sezione Punteggio a punti configura la classifica generale basata sui punti. Quando il metodo di classifica generale è impostato su **Punti**, i piloti guadagnano punti in ogni manche in base alle loro posizioni di arrivo e ai criteri di bonus, e la classifica generale viene ordinata in base ai punti totali.

> [!NOTE]
> Questa sezione è abilitata solo quando il **Metodo di classifica generale** è impostato su **Punti**. Quando viene selezionato un altro metodo, la sezione viene disabilitata con l'indicazione "Non è una gara a punti".

- **Punti posizione manche**: Assegna i punti attribuiti per le posizioni di arrivo (o per corsia) in ciascuna singola manche (ad es. 3 punti per il 1°, 2 per il 2°, 1 per il 3°, 0 per il 4°).
- **Bonus generali**:
    - *Giro più veloce*: Punti bonus assegnati al pilota che registra il giro singolo più veloce dell'intera gara.
    - *Giro più veloce per corsia*: Punti bonus assegnati al pilota più veloce su ciascuna singola corsia.
    - *Giro in testa*: Punti bonus assegnati per aver condotto almeno un giro nel corso della gara.
    - *Maggior numero di giri in testa*: Punti bonus assegnati al pilota che ha condotto più giri in totale.
    - *Limite di un solo bonus*: Limita ciascun pilota a un massimo di un bonus generale (il valore più alto).
- **Bonus manche**:
    - *% di riporto*: Percentuale dei giri della manche aggiunta al punteggio della manche.
    - *Giro più veloce*: Punti bonus per il giro più veloce in una manche.
    - *Giro in testa*: Punti bonus per aver condotto un giro in una manche.
    - *Maggior numero di giri in testa*: Punti bonus per aver condotto più giri in una manche.
    - *Limite di un solo bonus*: Limita ciascun pilota a un massimo di un bonus per manche.
- **Criteri di spareggio**: In caso di parità di punti totali, la classifica viene decisa mediante criteri configurabili, tra cui **Numero di giri**, **Tempo del giro più veloce**, **Tempo mediano sul giro**, **Tempo medio sul giro** e **Tempo totale**.

---

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
