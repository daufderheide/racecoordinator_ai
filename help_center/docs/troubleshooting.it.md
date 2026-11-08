# Risoluzione dei Problemi

## Problemi di Connessione

### Sospensione dell'Interfaccia USB e Disconnessioni tra le Manche (Sospensione Selettiva e Risparmio Energetico) {: #usb-sleep-prevention }
- **Sintomo**: Durante le pause tra le manche, nei cambi di corsia o dopo diversi minuti di inattività, l'interfaccia (Phidget, Arduino, Trackmate o adattatore USB-Seriale) perde la connessione. Quando riparte la manche successiva o un'auto attraversa i sensori, l'interfaccia si riconnette e viene visualizzata la notifica: *"Interfaccia Connessa: La connessione all'interfaccia è stata ripristinata."*
- **Causa**: I sistemi operativi moderni (Windows, macOS e Linux) applicano criteri aggressivi di risparmio energetico su controller USB e dispositivi di interfaccia umana (HID). Sebbene Race Coordinator AI impedisca la sospensione dell'intero sistema, il sistema operativo disattiva autonomamente le porte USB, gli hub radice USB e i controller HID inattivi (Sospensione selettiva USB) in assenza di passaggi sui sensori per un breve lasso di tempo.
- **Perché non può essere disattivato automaticamente dal software**: La gestione energetica a livello hardware è controllata direttamente dal kernel del sistema operativo. In Windows, modificare le impostazioni di risparmio energetico dei dispositivi richiede privilegi di Amministratore (UAC) e alterazioni delle chiavi protette del Registro di sistema (`HKLM`), operazione che un'applicazione standard non può né deve compiere per evitare instabilità su altre periferiche (tastiere, mouse o ricevitori Bluetooth).
- **Risoluzione per Sistema Operativo**:

#### Windows 10 e Windows 11 (Soluzione Permanente Consigliata)

##### 1. Disattivare il Risparmio Energetico su Dispositivi USB e HID in Gestione Dispositivi
1. Fare clic con il pulsante destro del mouse sul pulsante **Start** (o premere `Win + X`) e scegliere **Gestione dispositivi**.
2. Espandere **Human Interface Device (HID)**:
    - Individuare le voci **Dispositivo di input USB** associate all'interfaccia.
    - Fare clic con il pulsante destro del mouse su ciascuna, scegliere **Proprietà** e andare alla scheda **Risparmio energia**.
    - **Deselezionare** l'opzione *"Consenti al computer di spegnere il dispositivo per risparmiare energia"*, quindi fare clic su **OK**.
3. Espandere **Controller USB (Universal Serial Bus controllers)**:
    - Fare clic con il pulsante destro del mouse su ciascun **Hub radice USB** e **Hub USB generico**, scegliere **Proprietà** e andare su **Risparmio energia**.
    - **Deselezionare** *"Consenti al computer di spegnere il dispositivo per risparmiare energia"*, quindi fare clic su **OK**.
4. (Per Arduino / Seriale): Espandere **Porte (COM e LPT)**:
    - Fare clic con il pulsante destro del mouse sulla porta seriale USB (es. *Arduino Uno*, *Porta seriale USB*), scegliere **Proprietà** e, se presente la scheda **Risparmio energia**, **deselezionare** *"Consenti al computer di spegnere il dispositivo per risparmiare energia"*.

##### 2. Disattivare la Sospensione Selettiva USB nelle Opzioni Risparmio Energia
1. Aprire il **Pannello di controllo** di Windows e accedere a **Opzioni risparmio energia** (o premere `Win + R`, digitare `powercfg.cpl` e premere Invio).
2. Fare clic su **Modifica impostazioni combinazione** accanto al piano attivo.
3. Fare clic su **Cambia impostazioni avanzate risparmio energia**.
4. Espandere **Impostazioni USB** -> **Impostazione sospensione selettiva USB**.
5. Impostare sia **A batteria** che **Collegata alla rete elettrica** su **Disabilitato**.
6. Fare clic su **Applica** e poi su **OK**.

---

#### Linux e Raspberry Pi OS

##### 1. Disattivare l'Autosospensione USB nel Kernel
Per impostazione predefinita, il kernel Linux sospende i dispositivi USB inattivi dopo 2 secondi:
- **Su Ubuntu, Debian o Linux Mint (GRUB)**:
    1. Modificare la configurazione di GRUB: `sudo nano /etc/default/grub`.
    2. Aggiungere `usbcore.autosuspend=-1` a `GRUB_CMDLINE_LINUX_DEFAULT`.
    3. Aggiornare GRUB e riavviare: `sudo update-grub && sudo reboot`.
- **Su Raspberry Pi OS**:
    1. Aprire il file dei comandi di avvio: `sudo nano /boot/firmware/cmdline.txt` (o `/boot/cmdline.txt`).
    2. Aggiungere `usbcore.autosuspend=-1` alla fine della riga (tutti gli argomenti devono rimanere su una singola riga).
    3. Salvare e riavviare: `sudo reboot`.

##### 2. Disattivare l'Autosospensione tramite Regola Udev (Alternativa)
1. Creare un file di regole: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Aggiungere la seguente regola:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Ricaricare le regole: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Impostazioni Risparmio Energia / Schermi**: Aprire **Impostazioni di Sistema** -> **Schermi** -> **Avanzate...** (o **Risparmio Energia**) e abilitare **"Impedisci la sospensione automatica quando il display è spento"**.
- **Utilizzare Hub USB con Alimentazione Dedicata**: macOS può disattivare le porte degli hub USB passivi in caso di fluttuazioni di corrente. Collegare sempre l'interfaccia a un hub USB alimentato da presa di corrente.

### Riavvii e Cali di Tensione del Microcontrollore {: #microcontroller-brownout-resets }

- **Sintomo**: Durante una gara o una sessione di prove libere, appare un banner di avviso sulla schermata del giorno di gara: *"Riavvio del microcontrollore rilevato: Il microcontrollore dell'interfaccia si è riavviato inaspettatamente durante il funzionamento."* Cliccando su **Dettagli** si apre una finestra di dialogo che mostra il nome dell'interfaccia, il conteggio dei riavvii e il timestamp dell'ultimo riavvio. Se si verificano più riavvii nella stessa sessione, una nota avverte che si stanno verificando riavvii frequenti.
- **Cosa viene segnalato**: L'interfaccia di cronometraggio (come Arduino Uno, Nano, Mega o microcontrollore USB compatibile) ha subito un riavvio hardware imprevisto o un calo di tensione (brownout) mentre era collegata a Race Coordinator AI. Ciò indica che il processore integrato ha subito un calo momentaneo di tensione o un picco di disturbo elettrico che ha fatto scattare la linea di ripristino hardware o il circuito di rilevamento della sottotensione (BOD).

#### Cosa accade in Race Coordinator AI (RMS)
Quando un microcontrollore si riavvia inaspettatamente durante la gara:
1. **Sequenza di bootloader e handshake**: Il microcontrollore si riavvia e invia una notifica di identificazione iniziale e ping di stato a Race Coordinator AI.
2. **Ripristino automatico dello stato**: Race Coordinator AI rileva che la scheda era già connessa e attiva. Invece di interrompere la gara, l'RMS riconfigura immediatamente il microcontrollore: riapplica l'assegnazione dei pin di ingresso, le polarità (attivo alto/attivo basso), i tempi di antirimbalzo e ripristina lo stato dei relè in base allo stato attuale della manche (ad esempio, alimentazione corsie ATTIVA).
3. **Finestra dello scudo di protezione (250 ms)**: All'avvio di un Arduino, gli ingressi digitali possono fluttuare momentaneamente o riportare stati di pull-up predefiniti prima di stabilizzarsi. Race Coordinator AI attiva uno scudo di protezione di 250 ms subito dopo un riavvio imprevisto. Durante questo intervallo, i messaggi statici dei pin vengono filtrati per prevenire falsi conteggi dei giri, tempi sul giro fantasma o chiamate pista accidentali causati dal rumore elettrico di avvio.
4. **Impatto sulla gara — Possibilità di giri persi**:
    - Sebbene Race Coordinator AI ripristini automaticamente la connessione e l'alimentazione della pista senza interrompere la manche, il microcontrollore è **completamente cieco agli ingressi dei sensori** durante il riavvio hardware, la sequenza di bootloader e la negoziazione (in genere tra 200 e 500 millisecondi).
    - **Qualsiasi slot car che attraversi un sensore ottico, un tratto morto (dead strip) o un interruttore reed durante questa finestra di ripristino NON verrà registrata, causando giri persi.**
    - Se i riavvii si ripetono frequentemente, il conteggio dei giri e le classifiche della manche risulteranno falsati e i piloti potrebbero notare brevi interruzioni di corrente.

#### Cause Comuni
*Nota: Sebbene le cause descritte di seguito rappresentino la maggior parte dei problemi riscontrati sulle piste slot car, ogni installazione è unica e potrebbero intervenire altri fattori elettrici o meccanici.*

1. **Ritorno Induttivo dei Relè (Picchi di Forza Controelettromotrice - Back-EMF)**:
    - **La causa principale dei cali di tensione del microcontrollore nello slot racing.**
    - I relè di potenza della pista contengono bobine elettromagnetiche. Quando un relè si diseccita (durante un'interruzione di gara o a fine manche), il rapido collasso del campo magnetico nella bobina genera un picco di tensione inversa elevatissimo (centinaia di volt di contro-EMF).
    - Se la scheda relè non dispone di diodi di ricircolo adeguati o condivide massa/alimentazione direttamente con Arduino, questo picco ad alta tensione penetra nel microcontrollore, attivando il circuito di protezione BOD o bloccando la CPU.
2. **Cablaggio dei Pulsanti di Interruzione e Cavi Lunghi che Fungono da Antenne**:
    - I pulsanti di chiamata distribuiti lungo la pista utilizzano spesso cavi lunghi non schermati (da 3 a oltre 15 metri).
    - Questi cavi lunghi fungono da antenne che captano forti interferenze elettromagnetiche (EMI) dai motori dei modelli, scintille delle spazzole e giunzioni delle rotaie.
    - Premere o rilasciare pulsanti meccanici senza resistenze di pull-up esterne o filtri RC antirimbalzo può indurre transitori di tensione direttamente sui pin di ingresso.
3. **Calo di Tensione sul Bus USB a 5V**:
    - I microcontrollori necessitano di un'alimentazione stabile compresa tra 4,5 V e 5,2 V per funzionare in modo affidabile.
    - Se Arduino è collegato a un hub USB passivo, a una porta frontale del PC con cavo interno lungo o a una porta USB sovraccarica da altre periferiche, la tensione può scendere momentaneamente al di sotto della soglia BOD (in genere 2,7 V o 4,3 V), provocando un riavvio forzato immediato.
4. **Interferenze Elettromagnetiche (EMI) dell'Alimentazione di Pista**:
    - I motori delle slot car assorbono correnti elevate e producono archi elettrici continui tra spazzole e rotaie.
    - Se i cavi dei sensori, dei pulsanti o lo stesso microcontrollore corrono parallelamente e molto vicini ai conduttori di potenza della pista o agli alimentatori DC, gli accoppiamenti induttivi inducono picchi di tensione nell'elettronica di cronometraggio.
5. **Circuiti di Rete AC Condivisi & Mancanza di Isolamento**:
    - Collegare il computer, l'alimentatore DC della pista, torni gomme o utensili alla stessa ciabatta senza filtri di rete può trasmettere disturbi attraverso l'alimentatore del PC fino al bus USB.
6. **Scarica Elettrostatica (ESD)**:
    - Negli ambienti asciutti, il passaggio continuo dei modelli sulla pista in plastica accumula elettricità statica. Quando un commissario o un pilota tocca un pulsante o una rotaia metallica, la scarica elettrostatica può riavviare la scheda.

#### Possibili Soluzioni al Problema

- **Installare Diodi di Ricircolo (Flyback) su Tutte le Bobine dei Relè**:
    - Saldare un diodo raddrizzatore standard (come **1N4001**, **1N4004** o **1N4007**) in polarizzazione inversa direttamente sui morsetti DC di ciascuna bobina dei relè (catodo/striscia sul +DC, anodo sulla massa/-DC). Questo assorbe in modo sicuro l'energia di contro-EMF allo spegnimento del relè.
- **Utilizzare Schede Relè Optoisolate con Alimentazione Indipendente**:
    - Molti moduli relè a 5V dispongono di un ponticello di isolamento contrassegnato come **JD-VCC / VCC / GND**.
    - Rimuovere il ponticello `JD-VCC`. Collegare i 5V e i pin di segnale di Arduino alla morsettiera di controllo, ma alimentare le bobine dei relè separatamente collegando un alimentatore a parete da 5V DC tra `JD-VCC` e `GND` della scheda relè. Questo separa completamente il circuito induttivo disturbato dal bus di alimentazione di Arduino.
- **Aggiungere Resistenze di Pull-Up Esterne e Condensatori sui Pulsanti**:
    - Non fare affidamento solo sulle deboli resistenze di pull-up interne di Arduino (~20 kΩ–50 kΩ) su cavi lunghi. Installare **resistenze di pull-up esterne da 1 kΩ a 4,7 kΩ** tra ciascun pin di ingresso e il +5V sulla morsettiera di Arduino.
    - Aggiungere un piccolo **condensatore ceramico da 0,1 µF (100 nF)** tra ciascun pin del pulsante e la massa per filtrare i disturbi ad alta frequenza e i rimbalzi dei contatti.
- **Utilizzare un Hub USB Dedicato con Alimentatore da Presa**:
    - Collegare il microcontrollore a un hub USB dotato di proprio alimentatore di rete, anziché direttamente a una porta del PC o laptop. Un hub alimentato garantisce un'erogazione costante di corrente a 5V indipendentemente dal carico del computer.
- **Separare Fisicamente i Cavi di Segnale dall'Alimentazione di Pista**:
    - Posizionare i cavi dei sensori (infrarossi, fotocellule, reed) e dei pulsanti ad almeno 15-30 cm di distanza dalle rotaie di alimentazione della pista e dai cavi di alimentazione.
    - Se i cavi di segnale devono incrociare cavi di potenza, farli incrociare ad **angolo retto (90 gradi)** e mai in parallelo.
- **Utilizzare Cavi Schermati a Coppie Intrecciate (Twisted-Pair)**:
    - Per tratte lunghe, utilizzare cavo di rete schermato (Cat5e/Cat6 STP) o cavo schermato per strumentazione. Collegare la schermatura a massa solo sul lato di Arduino.
- **Linee di Alimentazione AC Dedicate**:
    - Collegare l'alimentatore della pista e il computer a prese a muro separate o utilizzare una presa filtrata con protezione da sovratensioni.

## Problemi di Visualizzazione


### Compatibilità del Browser e Schermo Vuoto su Dispositivi Datati (Android < 9, Sistemi Windows Precedenti e Tablet) {: #browser-compatibility }
- **Sintomo**: Aprendo Race Coordinator AI su un tablet precedente (come Android 4.4 KitKat fino ad Android 8 Oreo), un PC datato o un browser obsoleto, lo schermo rimane completamente vuoto oppure mostra il banner di avviso "Browser non supportato".
- **Causa**: Race Coordinator AI è sviluppato con Angular moderno ed ECMAScript (ES2020+), utilizzando CSS Grid, variabili CSS (`var(--...)`), moduli ES e moderne API JavaScript (tra cui `BigInt`, `globalThis`, `queueMicrotask`, optional chaining `?.`, nullish coalescing `??` e campi di classe privati `#x`). I browser privi di queste funzionalità non possono compilare né eseguire il client web.
- **Supporto del Sistema Operativo e del Browser**:

| Piattaforma | Versioni supportate e browser minimi | Stato | Note |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Google Chrome, Microsoft Edge, Mozilla Firefox aggiornati | **Completamente supportato** | Supportato nativamente con aggiornamenti automatici del browser. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 o Mozilla Firefox 115 ESR | **Supportato** | È necessario utilizzare le ultime versioni del browser supportate (Chrome 109 / Firefox 115 ESR). Internet Explorer non è supportato. |
| **Windows XP / Vista** | Browser ufficiali predefiniti (Chrome 49, Firefox 52 ESR) | **Solo Server** | I browser predefiniti non supportano ES2020+ e non possono eseguire localmente l'interfaccia client. Tuttavia, il server Java di Race Coordinator AI (JRE 8) funziona in modalità headless su XP/Vista per gestire gare per tablet remoti o PC moderni. |
| **Android** | Android 9.0+ con Google Chrome moderno o System WebView | **Supportato** | Google ha interrotto definitivamente gli aggiornamenti di Chrome/WebView per Android 8 e versioni precedenti. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Supportato** | Motore Apple WebKit con supporto moderno ECMAScript. |
| **macOS** | macOS 10.15 (Catalina) fino a macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Supportato** | Pienamente compatibile con computer Mac Intel e Apple Silicon. |
| **Linux** | Qualsiasi distribuzione moderna con Chrome, Chromium o Firefox | **Supportato** | Include Raspberry Pi OS a 64 bit e computer a scheda singola ARM64. |

- **Risoluzione e raccomandazioni**:
  - **Utilizzare un Browser Moderno Supportato**: Collegarsi utilizzando Google Chrome, Microsoft Edge, Mozilla Firefox o Apple Safari su un sistema operativo supportato (Android 9.0+, iOS 14+, Windows 7+, macOS o Linux).
  - **Configurazione di Windows Legacy (Win 7 / 8 / 8.1)**: Se si utilizza Windows 7 o 8, assicurarsi di installare **Google Chrome 109** o **Mozilla Firefox 115 ESR** anziché il dismesso Internet Explorer.
  - **Tablet Moderni Economici**: Tablet moderni accessibili (es. Amazon Fire HD 8/10 o tablet Android con Android 11–14) supportano Chrome moderno offrendo prestazioni eccellenti a costi contenuti.
  - **Display Remoto / Mirroring dello Schermo**: Per tablet o terminali datati, è possibile eseguire il server Race Coordinator AI sulla macchina host e proiettare lo schermo con strumenti leggeri VNC o desktop remoto (come bVNC o AnyDesk).
