# Editor dei Tracciati

L'**Editor dei Tracciati** è l'interfaccia centrale di configurazione per modellare la tua pista di slot car fisica, personalizzare le dimensioni e i colori delle corsie e stabilire la comunicazione con l'hardware di cronometraggio, i relè di alimentazione, i sensori e i sistemi di illuminazione visiva.

Race Coordinator AI include un'architettura multi-interfaccia avanzata che consente a più controller di cronometraggio e gestione (come Arduino, Trackmate, Phidget o BART) di funzionare contemporaneamente su una singola pista.

---

## Panoramica e Salvataggio Automatico

L'Editor dei Tracciati è suddiviso in due aree di lavoro sincronizzate:

- **Pannello Sinistro (Proprietà Generali e Corsie)**: Configura il nome della pista, il numero di sezioni, la scala fisica e le caratteristiche di ciascuna corsia (dimensioni, ordinamento e colori). Aggiungi nuove interfacce hardware nella parte inferiore di questo pannello.
- **Pannello Destro (Interfacce Hardware e Test Interattivi)**: Configura i controller hardware collegati, assegna pin e canali alle funzioni di pista, imposta le strisce LED RGB indirizzabili e testa sensori e relè in tempo reale.

Tutte le modifiche apportate nell'Editor dei Tracciati vengono **validate e salvate automaticamente in tempo reale**. Se viene rilevata una configurazione non valida (come un nome vuoto o duplicato, o un pin obbligatorio non assegnato), il salvataggio viene temporaneamente sospeso e avvisi visivi evidenziano i campi da correggere.

---

## Configurazione Generale del Tracciato

La sezione superiore definisce le proprietà fondamentali del tracciato:

### Nome del Tracciato (Track Name)
L'identificatore univoco della tua pista nel database di Race Coordinator AI. Ogni tracciato deve avere un nome distinto.

### Numero di Sezioni del Tracciato (Number of Track Sections)
Definisce il numero di segmenti in cui è suddivisa la pista. Svolge due funzioni essenziali:

1. **Punteggio Giri Parziali a Fine Manche**:
   - Il valore predefinito **100** rappresenta una suddivisione percentuale, consentendo ai direttori di gara di assegnare giri parziali con precisione a due cifre decimali (es. $14{,}65$ giri) in base alla posizione in cui si ferma la vettura al termine della manche a tempo.
   - Se utilizzi picchetti o tacche fisiche lungo la pista, imposta questo numero sul conteggio esatto dei riferimenti (es. 20 riferimenti su una pista di 18 metri). Al termine della manche, i commissari annotano l'ultimo riferimento superato da ogni vettura.
2. **Cronometraggio dei Settori / Tempi Intermedi**:
   - Quando vengono configurati sensori di settore, questo valore definisce la ripartizione logica dei settori del tracciato.

### Scala del Tracciato (Track Scale)
Seleziona la scala fisica della pista dal menu a discesa:

- **1:1 (Scala Reale)**
- **Scala 1:24** (Grandi slot car commerciali / carrozzerie rigide)
- **Scala 1:32** (Standard per club e piste casalinghe, Carrera, Scalextric, Policar)
- **Scala 1:43** (Tracciati compatti analogici e digitali)
- **Scala 1:64 (HO)** (Slot car scala HO, AFX, Auto World, Tyco)

!!! info "Telemetria di Velocità in Scala"
    Race Coordinator AI combina la **Scala del Tracciato** con la **Lunghezza di Ciascuna Corsia** per calcolare velocità in scala realistiche (in km/h o mph) visualizzate nelle classifiche, sui monitor dei piloti e nelle esportazioni XLS.

---

## Configurazione delle Corsie (Lane Configuration)

La sezione **Editor delle Corsie (Lane Editor)** consente di personalizzare la geometria, l'ordine di partenza in griglia e l'aspetto visivo di ogni corsia.

```
+---------------+-------------------+--------------------+-------------------+
|  Riordina / X |  Corsia # e Lung. |  Colore di Sfondo  |  Colore del Testo |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Rosso ]     |     [ Bianco ]    |
|  [::]   [X]   |  #2  [ 50.25 ] ft |     [ Bianco ]     |      [ Nero ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |       [ Blu ]      |     [ Bianco ]    |
|  [::]   [X]   |  #4  [ 53.75 ] ft |     [ Giallo ]     |      [ Nero ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Aggiunta ed Eliminazione delle Corsie
- **Aggiungi Corsia (`+`)**: Clicca sul pulsante **`+`** nell'intestazione per inserire una nuova corsia. Vengono assegnati automaticamente colori di contrasto predefiniti.
- **Elimina Corsia (`X`)**: Clicca sul pulsante **`X`** rosso accanto alla corsia per rimuoverla. Le interfacce hardware aggiornano automaticamente le assegnazioni.

### Riordinamento tramite Trascinamento (Drag-and-Drop)
Afferra l'icona di trascinamento (**`::`**) a sinistra di una corsia per spostarla verso l'alto o verso il basso. Il riordinamento aggiorna all'istante le rotazioni delle manche, le postazioni dei piloti e i tabelloni.

### Lunghezza della Corsia (Piedi / Metri)
Inserisci la lunghezza fisica lungo la linea centrale di ciascuna corsia in **piedi (ft)**.

Nei circuiti senza ponti di compensazione, le corsie interne sono più corte di quelle esterne. Inserire lunghezze precise assicura che:
- I calcoli della velocità in scala (km/h) siano corretti per ciascuna corsia.
- Le distanze percorse e il consumo di carburante riflettano la distanza reale.

!!! tip "Riferimento Conversione Metri in Piedi"
    Se hai misurato la pista in metri, converti in piedi moltiplicando:
    
    $$\text{Lunghezza (piedi)} = \text{Lunghezza (metri)} \times 3{,}28084$$
    
    $$(1\text{ piede} = 0{,}3048\text{ metri})$$

### Colori della Corsia (Sfondo e Testo)
Ciascuna corsia dispone di due selettori di colore:

- **Colore di Sfondo**: Colore primario identificativo della corsia (es. Rosso, Bianco, Blu, Giallo, Arancione, Verde, Viola, Nero).
- **Colore del Testo / Primo Piano**: Colore di contrasto per numeri e testi mostrati sulla corsia.

!!! note "Sincronizzazione Colori Hardware"
    La modifica del colore di sfondo di una corsia si sincronizza automaticamente con le strisce LED RGB FastLED configurate su Arduino, aggiornando le luci di stato e gli indicatori di rifornimento ai colori reali della tua pista.

---

## Architettura delle Interfacce Hardware

Race Coordinator AI supporta la connessione simultanea di più sistemi di cronometraggio e controllo.

### Funzionalità Multi-Interfaccia
Puoi combinare diversi controller sulla stessa pista:
- Utilizzare una scheda **Trackmate** per il cronometraggio ottico dei giri e l'interruzione generale dell'alimentazione.
- Collegare contemporaneamente un **Arduino** con lo sketch di Race Coordinator AI per pilotare semafori di partenza FastLED RGB, barre di rifornimento e luci di bandiera gialla.
- Aggiungere un modulo digitale **Phidget** per pulsanti di interruzione di gara (chaos) o sensori di intertempo.

### Schede di Navigazione Rapida
I pulsanti a scheda in alto nel pannello destro consentono di scorrere direttamente alle impostazioni del controller desiderato.

### Indicatori di Connessione in Tempo Reale
Ogni scheda di interfaccia include un badge di stato ben visibile:

| Badge | Significato | Azione |
| :--- | :--- | :--- |
| **Connesso** (Verde) | Comunicazione attiva stabilita; dati trasmessi in entrambe le direzioni. | Pronto per le gare e i test interattivi. |
| **Nessun Dato** (Ambra) | Dispositivo rilevato ma nessun flusso di dati o segnale di heartbeat. | Verificare baud rate, cavo USB o versione dello sketch. |
| **Disconnesso** (Grigio / Rosso) | Hardware non trovato, porta chiusa o alimentazione assente. | Verificare la porta COM, il cavo USB e l'alimentazione. |

---

## Interfacce Hardware Supportate

### 1. Interfaccia Arduino

L'interfaccia **Arduino** è la soluzione più versatile ed espandibile. Con un Arduino Uno, Mega o compatibile, gestisci giri, relè di alimentazione, pulsanti di chiamata, tempi intermedi, telemetria dell'acceleratore e illuminazione LED RGB indirizzabile con FastLED.

#### Modelli di Scheda
- **Arduino Uno**: Ideale per piste da 2 a 4 corsie (14 pin digitali 2–13 e 6 ingressi analogici A0–A5).
- **Arduino Mega 2560**: Consigliato per piste da 6 a 8 corsie, cronometraggio a più settori o impianti di illuminazione LED complessi (54 pin digitali 2–53 e 16 ingressi analogici A0–A15).

#### Connessione e Compatibilità Firmware
- **Porta COM Seriale**: Seleziona la porta USB assegnata dal sistema operativo.
- **Baud Rate**: Trasmissione veloce (consigliato `115200` baud).
- **Compatibilità con gli Sketch**:
    - **Sketch Race Coordinator AI (`v2.1.0.x`)**: Supporta tutte le funzioni moderne, inclusi LED FastLED RGB, partitori di tensione e telemetria in tempo reale.
    - **Sketch Tradizionale Race Coordinator 1.0 (`v1.0.0.x`)**: Pienamente retrocompatibile per giri, relè e pulsanti. Le opzioni LED RGB vengono disabilitate con un avviso informativo.

#### Filtro Antirimbalzo / Debounce ($\mu\text{s}$)
Imposta il tempo di antirimbalzo in **microsecondi** ($1\text{ ms} = 1000\,\mu\text{s}$). Le oscillazioni elettriche transitorie vengono ignorate.
- Sensori ottici a infrarossi o fototransistor: **100 a 500 $\mu\text{s}$**.
- Piste a contatto metallico (dead strip) o ampolle reed: **1000 a 5000 $\mu\text{s}$**.

#### Logica Invertita (Normalmente Chiuso / NC)
- **Sensori di Corsia Normalmente Chiusi (NC)**: Attivare se il sensore fornisce livello alto a riposo e scende a basso al passaggio del modello (tipico per fotocellule e IR). Disattivare per dead strip o reed.
- **Relè Normalmente Chiusi (NC)**: Attivare se il relè si eccita per togliere corrente e rimane a riposo per alimentare la pista. Garantisce che la pista sia alimentata anche a computer spento.

#### Comportamento Box su Pin Giri
Consente al sensore di traguardo di gestire il rifornimento nelle gare con carburante:
- **Nessuno (None)**: Semplice conteggio giri.
- **Ingresso Box (Pit In)**: Il passaggio avvia il rifornimento.
- **Uscita Box (Pit Out)**: Il passaggio conclude il rifornimento.
- **Ingresso / Uscita (Pit In/Out)**: Il passaggio avvia il rifornimento; dopo la sosta, il passaggio successivo conta come giro normale.

#### Assegnazione Pin Digitali e Analogici
- **Conteggio Giri**: Sensore di traguardo per corsia.
- **Controllo Alimentazione**: Relè principale (Master Relay) e relè individuali per corsia (Lane Relays).
- **Controllo Gara**: Pulsante di bandiera gialla generale o per singola postazione pilota.
- **Settori e Box**: Sensori di intertempo e sensori dedicati di ingresso/uscita corsia box.
- **Illuminazione RGB**: Linea dati per strisce LED indirizzabili.

!!! tip "Test Hardware Interattivi"
    Accanto a ogni selettore di pin è presente un **Badge di Stato in Tempo Reale**:
    - **Ingressi (Sensori/Pulsanti)**: L'attivazione di un sensore fa lampeggiare il badge in verde brillante per 500 ms.
    - **Uscite (Relè)**: Facendo clic sul badge si commuta manualmente il relè per verificare l'impianto.

#### Partitori di Tensione e Telemetria Acceleratore
Permette di monitorare la tensione del pulsante ($0\text{--}5\text{V}$) per le gare con carburante digitale:
- **Indicatore dal Vivo**: Mostra il valore analogico grezzo ($0\text{--}1023$).
- **Tensione Massima**: Calibra il valore corrispondente al 100% di acceleratore.
- **«Imposta Max su Indicatore»**: Salva direttamente il picco rilevato a fondo corsa.
- **Collega Corsie**: Applica la calibrazione a tutte le corsie contemporaneamente.

#### Illuminazione LED RGB Indirizzabile (FastLED)
1. **Configurazione Striscia**: Assegna il pin dati, numero di LED, luminosità ($0\text{--}255$), frequenza di lampeggio e ordine dei colori (`GRB`, `RGB`, ecc.).
2. **Funzioni per Singolo LED**:
   - **Semaforo di Partenza**: Sequenza di conto alla rovescia, Verde di via e Rosso per partenza anticipata.
   - **Stato Bandiera**: Verde (gara in corso), Giallo lampeggiante (interruzione), Rosso/A scacchi (fine manche).
   - **Stato Corsia / Corrente**: Si illumina nel colore della corsia quando la pista è alimentata.
   - **Barra di Rifornimento**: Si riempie progressivamente durante il rifornimento ai box.
   - **Leader di Manche**: Si illumina nel colore del pilota attualmente in testa alla manche.
   - **Lampeggio Giro**: Emette un lampo nel colore della corsia al passaggio del traguardo.

---

### 2. Interfaccia Trackmate

Integrazione nativa per schede commerciali Trackmate collegate tramite porta seriale COM (USB o RS-232).

- **Filtro Antirimbalzo (Livelli 1–4)**: Filtraggio hardware contro i doppi passaggi (livello 2 o 3 raccomandato).
- **Logica Normalmente Chiusa**: Inversione per fotocellule a infrarossi e relè.
- **Relè per Singola Corsia**: Da abilitare se si dispone di scheda con interruzione separata per corsia.
- **8 Canali Sensore**: Assegnazione degli 8 canali fisici a corsie o box.
- **Test Relè**: Pulsanti interattivi a video per commutare manualmente il relè generale e i singoli relè.
- **Pulsante di Chiamata**: Canale dedicato con indicatore visivo in tempo reale.

---

### 3. Interfaccia Phidget

Supporto per moduli industriali USB e VINT di Phidgets (es. InterfaceKit 0/16/16, 8/8/8, relè 1014 e hub VINT).

- **Riconoscimento Automatico**: Rilevamento immediato tramite Numero di Serie e Porta Hub.
- **Ingressi Digitali**: Canali optoisolati ad alta velocità per giri, pulsanti e settori con indicatori di impulso.
- **Uscite Digitali / Relè**: Controllo dell'alimentazione generale e delle singole corsie.
- **Ingressi Analogici**: Monitoraggio di tensione per carburante digitale.
- **Inversione Logica**: Impostazione indipendente per sensori e relè.

!!! warning "Driver Phidget22 Richiesti"
    Richiede l'installazione dei driver ufficiali **Phidget22** sul computer host.

---

### 4. Interfaccia BART (Cronometro Bluetooth Policar)

Connessione wireless a ponti di cronometraggio e transponder Policar BART Bluetooth Low Energy (BLE).

- **Ricerca Wireless BLE**: Scansione automatica dei dispositivi Bluetooth senza configurazione di porte COM.
- **Canali Hardware (fino a 32)**: Assegnazione dinamica alle corsie e ai box.
- **Filtro Tempo Giro Minimo (ms)**: Soglia hardware per prevenire letture spurie.
- **Attività Canale in Tempo Reale**: Conferma visiva immediata di ogni rilevamento.

---

### 5. Interfaccia Demo / Simulazione

Ideale per collaudare formati di gara, rotazioni, temi, annunci audio e tabelloni senza collegare alcun hardware fisico.

- **Simulazione Realistica**: Genera tempi sul giro plausibili, distacchi di gara e soste ai box simulate.
- **Pronta all'Uso**: Funziona immediatamente su qualsiasi tracciato.

---

## Strumenti e Barra Superiore dell'Editor

- **Annulla (`Ctrl+Z`) / Ripristina (`Ctrl+Y`)**: Ripristina con facilità qualsiasi modifica a corsie, colori o pin.
- **Salva come Nuovo (Duplica Tracciato)**: Crea una copia identica con un nuovo nome, perfetta per testare configurazioni alternative.
- **Guida Interattiva**: Il pulsante con punto interrogativo (**`?`**) avvia un tour guidato a video su tutti i comandi.

---

## Risoluzione dei Problemi Hardware Comuni

### Alimentazione Invertita (Relè Funziona al Contrario)
- **Sintomo**: La pista ha corrente durante la bandiera gialla ma si interrompe con la bandiera verde.
- **Soluzione**: Modifica lo stato della casella **Relè Normalmente Chiusi (Normally Closed Relays)**.

### Rifornimento Continuo nelle Gare con Carburante
- **Sintomo**: I modelli iniziano a rifornire senza sosta non appena poggiano sulla pista.
- **Soluzione**: Modifica lo stato della casella **Sensori di Corsia Normalmente Chiusi (Normally Closed Lane Sensors)**.

### Doppi Giri o Giri Persi
- **Soluzione**: Aumenta l'antirimbalzo (Debounce) se vengono contati doppi giri; riducilo se i modelli più veloci non vengono rilevati, e verifica l'allineamento delle fotocellule.

### Strisce LED FastLED Non Si Accendono
- **Soluzione**: Assicurati che su Arduino sia installato lo **sketch ufficiale `v2.1.0.x`**, che il modello di LED e l'ordine dei colori siano corretti e che la massa (GND) dell'alimentatore a 5V sia collegata alla massa di Arduino.
