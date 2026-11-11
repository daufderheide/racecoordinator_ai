# Guida alla configurazione di Arduino UNO Q

Questa guida spiega come configurare **Race Coordinator AI (RC AI)** sulla scheda di sviluppo ibrida **Arduino UNO Q** come dispositivo hardware autonomo.

---

## Panoramica dell'hardware e varianti di memoria

L'**Arduino UNO Q** combina un Single Board Computer (SBC) Linux a 64 bit con un microcontrollore in tempo reale su un'unica scheda:

- **MPU Linux (Qualcomm Cortex-A53 a 2,0 GHz)**: Esegue il server Race Coordinator AI, il database SQLite, il server client Web e l'aggiornamento automatico.
- **MCU in tempo reale (STM32U585 Cortex-M33 a 160 MHz)**: Gestisce gli interrupt dei pin dei sensori di giro, i tempi di settore, i pulsanti di chiamata e i relè di alimentazione della pista con precisione sub-millisecondo (nota: i LED RGB indirizzabili FastLED non sono supportati su questa architettura).
- **Uscita display**: L'uscita USB-C DisplayPort si collega direttamente a un monitor, TV o touchscreen.

### Modelli da 4 GB rispetto a 2 GB

* **Arduino UNO Q da 4 GB (Consigliato e supportato)**: Dotato di 4 GB di RAM e 32 GB di memoria eMMC. Questo modello è necessario per la **Modalità display Kiosk** (pilotando direttamente una TV o un monitor HDMI/DisplayPort), poiché l'esecuzione simultanea del desktop Linux, del browser Chromium, del runtime Java e del database SQLite richiede più di 2 GB di memoria.
* **Arduino UNO Q da 2 GB (Considerazioni sulla modalità headless)**:
  * Sebbene il modello da 2 GB non disponga della memoria necessaria per eseguire senza problemi il desktop locale e il display kiosk di Chromium, dispone di memoria sufficiente per eseguire il server backend in **Modalità dispositivo headless**.
  * **Stato attuale del supporto**: La modalità headless su Uno Q **non è attualmente supportata**, poiché sono ancora necessarie ulteriori modifiche al pacchetto di supporto e alla configurazione di Uno Q. Tuttavia, il supporto headless sul Q da 2 GB **potrebbe essere aggiunto su richiesta**, a condizione che l'Uno Q disponga di una connessione di rete attiva (Wi-Fi o Ethernet) per consentire a direttori di gara e piloti di accedere all'interfaccia web da altri dispositivi sulla rete.

---

## Modalità operative

1. **Modalità display Kiosk (Modello da 4 GB)**: Collega un monitor o una TV HDMI/DisplayPort direttamente alla porta USB-C di Uno Q tramite un adattatore multiporta. La scheda avvia automaticamente Chromium in modalità kiosk a schermo intero (`http://localhost:7070`), consentendo contemporaneamente connessioni di rete remote.
2. **Modalità dispositivo headless (Attualmente non supportata - Disponibile su richiesta)**: La scheda esegue esclusivamente il server backend e si collega all'hardware della pista, senza monitor o browser locali in esecuzione. Gli utenti accedono all'interfaccia web tramite la rete locale (`http://<hostname>:7070` o `http://<INDIRIZZO_IP>:7070`). Come indicato sopra, la modalità headless su Uno Q non è supportata per impostazione predefinita, ma può essere aggiunta su richiesta se Uno Q dispone di una connessione di rete.

---

## Installazione passo dopo passo

### Passaggio 1: Preparare la scheda e connettersi tramite la rete

1. **Accendere la scheda** *(Il flashing di solito non è necessario)*:
   * Il tuo Arduino Uno Q viene fornito con **Arduino Linux OS (Debian 12 arm64) preinstallato** sulla memoria flash eMMC interna da 32 GB. È sufficiente collegare la scheda all'alimentazione per avviare il sistema operativo.
   * *(Nota: Il flashing di un'immagine del sistema operativo è necessario solo se si sta ripristinando un sistema danneggiato o eseguendo un ripristino completo delle impostazioni di fabbrica).*

2. **Configurazione della connessione di rete**:
   > [!IMPORTANT]
   > **Accesso a Internet necessario solo durante la configurazione iniziale**: Una connessione di rete con accesso a Internet è strettamente richiesta durante questa configurazione iniziale per aggiornare i pacchetti e scaricare i prerequisiti. Una volta completata la configurazione, Race Coordinator AI funziona al 100% in locale e offline, senza richiedere una connessione a Internet. Tuttavia, mantenere la scheda collegata alla rete locale offre notevoli vantaggi continui:
   > - **Aggiornamenti software automatici**: Scarica e installa facilmente nuove versioni di Race Coordinator AI e aggiornamenti del firmware direttamente dall'interfaccia web.
   > - **Accesso client remoto**: Direttori di gara, piloti e spettatori possono collegare smartphone, tablet o laptop direttamente all'interfaccia web della scheda (`http://<hostname>:7070` o `http://<INDIRIZZO_IP>:7070`) tramite la rete locale.

   * **Configurazione Wi-Fi tramite procedura guidata sullo schermo**: Al primo avvio, la procedura guidata sullo schermo richiederà la configurazione della rete wireless. Seleziona la tua rete Wi-Fi e inserisci la password.
   * **Alternativa: Configurare il Wi-Fi da riga di comando**: Se non hai configurato il Wi-Fi durante la procedura guidata o desideri configurarlo manualmente da terminale:
     ```bash
     # Elencare le reti wireless disponibili:
     nmcli dev wifi list

     # Connettersi alla rete Wi-Fi:
     sudo nmcli dev wifi connect "IlTuo_SSID" password "LaTua_Password"
     ```
   * **Alternativa: Ethernet cablata**: È sufficiente collegare un cavo Ethernet alla scheda (o un adattatore Ethernet USB-C). La scheda di rete si configura automaticamente tramite DHCP.
   * **Nota sulla prima connessione**: La connessione Wi-Fi potrebbe occasionalmente non avere effetto immediato, oppure i comandi manuali `nmcli` potrebbero mostrare errori temporanei al primo avvio. Se ciò si verifica, esegui semplicemente `sudo reboot`. Dopo il riavvio, la scheda wireless si inizializzerà correttamente e si connetterà automaticamente alla rete Wi-Fi configurata.
   * **Applicare gli aggiornamenti della scheda e del firmware**: Al riavvio (o quando richiesto dal sistema), potrebbe esserti chiesto se desideri aggiornare vari pacchetti e componenti firmware sulla scheda. Si consiglia vivamente di accettare ed eseguire tutti gli aggiornamenti suggeriti, poiché il firmware di fabbrica è spesso obsoleto. Tieni presente che questo aggiornamento iniziale può richiedere del tempo (spesso da 5 a più di 10 minuti a seconda della velocità della rete); lascia che si completi senza interruzioni.

3. **Abilitare SSH sulla scheda e connettersi (Consigliato)**:
   * La configurazione della scheda è più semplice tramite SSH dal tuo computer, poiché puoi copiare e incollare direttamente i comandi di installazione.
   * **Abilitare il servizio SSH**: Per impostazione predefinita, il server SSH non è attivo sulla scheda. Dal terminale locale (utilizzando la tastiera e il display collegati alla scheda), abilita e avvia il servizio SSH:
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Trovare il nome host e l'indirizzo IP**: Esegui `hostname` e `hostname -I` sulla scheda per scoprire il nome host assegnato e l'indirizzo IP locale (la configurazione di fabbrica assegna spesso un nome univoco come `allianora` anziché `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Nota: `avahi-daemon` non è preinstallato su Arduino Linux OS, quindi i nomi di dominio mDNS `.local` come `uno-q.local` non esistono per impostazione predefinita a meno che non si installi il pacchetto tramite `sudo apt-get install -y avahi-daemon`).*
   * **Connettersi dal PC**:
     * **macOS**: Apri l'applicazione integrata **Terminale** o **iTerm2** ([iterm2.com](https://iterm2.com/)) e connettiti da riga di comando:
       ```bash
       ssh arduino@<hostname>
       # Oppure connettiti direttamente tramite IP:
       ssh arduino@<INDIRIZZO_IP>
       ```
     * **Windows**: Puoi utilizzare PowerShell o il Prompt dei comandi integrati (eseguendo `ssh arduino@<hostname>` o `ssh arduino@<INDIRIZZO_IP>`) oppure utilizzare un client SSH grafico come **PuTTY** (scaricabile da [putty.org](https://www.putty.org/)). Se utilizzi PuTTY:
       1. Inserisci il nome host o l'indirizzo IP della scheda nel campo **Host Name (or IP address)**.
       2. Assicurati che la porta sia impostata su `22` e il tipo di connessione su **SSH**.
       3. Fai clic su **Open**, accetta l'avviso relativo alla chiave host alla prima connessione ed effettua il login come `arduino` con la tua password.

### Passaggio 2: Installare i prerequisiti
Installa l'ambiente di runtime Java (`default-jre-headless`), le utilità audio (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` e il gestore delle finestre (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Nota: Su Debian, il pacchetto del browser si chiama `chromium` anziché `chromium-browser` e `default-jre-headless` fornisce l'ambiente di runtime OpenJDK standard. L'utilità `wmctrl` viene utilizzata dal servizio chiosco per garantire che Race Coordinator AI mantenga il focus della finestra rispetto alle app con avvio automatico del desktop come Arduino App Lab).*

Verifica che `arduino-cli` sia installato:
```bash
arduino-cli version
```
*(Se `arduino-cli` non è preinstallato sulla scheda, installalo tramite: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Passaggio 3: Installare il pacchetto dell'applicazione e i servizi Systemd
Trasferisci `RaceCoordinatorAI-Linux-ARM64.tar.gz` dal tuo computer alla scheda:
```bash
# Dal terminale del tuo laptop:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Scegli uno dei seguenti metodi di installazione:

#### Opzione A: Installazione automatizzata chiavi in mano (Consigliato)
L'installer automatico gestisce il controllo dei prerequisiti, la configurazione della directory, i permessi seriali, la registrazione dei servizi systemd, il caricamento del firmware del microcontrollore e l'avvio immediato con gestione degli errori:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
# Oppure per un output dettagliato:
# sudo ./install.sh -v
```
*(Nota: Eventuali avvisi come `tar: Ignoring unknown extended header...` sono innocui tag di metadati macOS e possono essere ignorati).*

> [!NOTE] Download e durata del core Zephyr (~da 5 a più di 10 minuti)
> Durante l'installazione iniziale, `arduino-cli` scarica ed estrae il **core della scheda Zephyr (`arduino:zephyr`)** per la MCU integrata STM32U5 Cortex-M33. Questo pacchetto contiene l'intero sistema operativo Real-Time Zephyr, la toolchain di cross-compilazione ARM e le librerie hardware (oltre 500 MB di download e decine di migliaia di file).
>
> - **Tempo stimato**: **da 5 a più di 10 minuti** a seconda della velocità della connessione di rete e della memoria flash eMMC. **Il momento perfetto per una pausa caffè!**
> - **Avanzamento sulla console**: L'avanzamento del download e dell'estrazione viene mostrato direttamente nel terminale. Se desideri maggiori dettagli sulle fasi di compilazione ed estrazione, esegui `sudo ./install.sh -v`.
> - **Verifica dello stato tramite seconda console / SSH**: Se temi che l'installazione si sia bloccata, apri una seconda sessione SSH (o un'altra scheda di terminale su Uno Q) ed esegui:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   Vedrai che `arduino-cli` sta utilizzando attivamente CPU e I/O durante il download e l'estrazione. Puoi anche controllare l'espansione dei file temporanei con:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

#### Opzione B: Installazione manuale passo-passo (Alternativa)
Se preferisci il controllo manuale o hai bisogno di personalizzare la configurazione:
1. **Estrarre i file dell'applicazione in `/opt/racecoordinatorai`**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Configurare i permessi e l'accesso al gruppo seriale**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout,audio arduino
   ```

3. **Installare e registrare i servizi systemd**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Passaggio 4: Eseguire il flashing del firmware del microcontrollore
Compila e carica lo sketch hardware sulla MCU integrata:
```bash
# Verifica schede e porte rilevate
arduino-cli board list

# Installa il core della scheda Zephyr in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Installa le librerie Arduino richieste (bridge router Uno Q)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# Compila racecoordinatorai_sketch per la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Carica sulla MCU integrata tramite il bridge di rete interno
# (Inserisci la password della scheda 'arduino' quando richiesto, o passa --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Come verificato tramite `arduino-cli board list`, il microcontrollore Uno Q esegue Zephyr OS sul bridge di rete interno `172.17.0.1` con FQBN `arduino:zephyr:unoq`. La libreria `Arduino_RouterBridge` è necessaria per la comunicazione seriale attraverso il bridge SoC. Si noti che l'esecuzione di `arduino-cli core install arduino:zephyr` scarica oltre 500 MB e richiede da 5 a più di 10 minuti per essere estratta sulla memoria eMMC (prenditi un caffè mentre si scompatta; puoi controllare lo stato di avanzamento con `top -p $(pgrep arduino-cli)` in un secondo terminale). Le strisce di luci LED FastLED non sono attualmente supportate sull'architettura STM32U5 / Zephyr Cortex-M33 a causa delle definizioni di registro CMSIS 6, ma tutte le funzionalità principali della pista—sensori di giro, tempi di settore, pulsanti di chiamata e relè di corsia—sono perfettamente operative).*

### Passaggio 5: Avviare i servizi e avviare il display Kiosk
Avvia il demone backend e abilita il chiosco TV a schermo intero:
```bash
# Avvia il server backend
sudo systemctl start racecoordinatorai

# Hai già abilitato il demone backend in precedenza.
# Ora abilita il servizio chiosco TV per l'avvio grafico del sistema:
sudo systemctl enable racecoordinatorai-kiosk.service

# Avvia il display del chiosco TV a schermo intero immediatamente
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Aggiornare un'installazione esistente { #updating-an-existing-installation }

Una volta che Race Coordinator AI è installato e funzionante sul tuo Arduino Uno Q, mantenerlo aggiornato con nuove funzionalità, correzioni di bug e miglioramenti del firmware è un processo semplice. A seconda che la scheda sia collegata alla rete o funzioni completamente offline sulla pista, scegli il metodo di aggiornamento più adatto:

- **[Aggiornamento con connessione di rete (Consigliato)](#aggiornamento-con-connessione-di-rete)**: Aggiornamenti automatici in background configurati direttamente dall'interfaccia web.
- **[Aggiornamento senza connessione di rete (Offline tramite USB)](#aggiornamento-senza-connessione-di-rete)**: Copia di un archivio di rilascio tramite chiavetta USB e aggiornamento locale sulla scheda.

---

### Aggiornamento con connessione di rete { #aggiornamento-con-connessione-di-rete }

Se il tuo Arduino Uno Q è connesso alla rete locale con accesso a Internet (tramite Wi-Fi o Ethernet), puoi sfruttare gli aggiornamenti automatici direttamente dall'interfaccia web di Race Coordinator AI:

1. **Abilitare gli aggiornamenti automatici nell'interfaccia web**:
   - In Race Coordinator AI, vai su **Opzioni → Aggiornamenti automatici** dalla Configurazione giorno di gara o dalla barra dei menu superiore.
   - Seleziona il tuo canale di rilascio preferito:
     - **🟢 Versioni ufficiali / di produzione**: Versioni stabili e completamente validate, consigliate per le normali operazioni di gara ed eventi di club in cui la massima stabilità operativa è fondamentale.
     - **🟡 Versioni beta**: Versioni di anteprima complete pubblicate durante i cicli di sviluppo attivo per test della community e verifica in gare reali. Consigliate per provare nuove funzionalità e fornire feedback prima della versione ufficiale.
     - **🔵 Build giornaliere Alpha**: Versioni generate automaticamente ogni giorno dal ramo di sviluppo attivo con le funzionalità più recenti.
   - Per una spiegazione dettagliata sul funzionamento dei canali di rilascio e sulla promozione delle versioni, consulta la sezione [Canali di rilascio e aggiornamenti automatici](downloads.it.md#release-channels) nel Centro assistenza.

2. **Come funzionano gli aggiornamenti automatici su Arduino Uno Q**:
   Quando viene rilevato un aggiornamento per il canale configurato:
   - **Download in background**: La scheda scarica il nuovo pacchetto Linux ARM64 (`RaceCoordinatorAI-Linux-ARM64*.tar.gz`) in background senza interrompere le sessioni di gara attive.
   - **Riavvio del servizio**: Il programma di aggiornamento estrae la nuova versione su `/opt/racecoordinatorai` e riavvia `racecoordinatorai.service` (e il display kiosk) senza problemi tramite `systemctl`.
   - **Sincronizzazione dello sketch del microcontrollore**: Se la nuova versione include modifiche al firmware del microcontrollore in tempo reale (`racecoordinatorai_sketch.ino`), il programma ricompila automaticamente lo sketch e carica il nuovo firmware sul microcontrollore STM32 tramite il bridge di rete interno con `arduino-cli`.
   - Tutti i dati di gara, le configurazioni della pista, i layout personalizzati, gli elenchi dei piloti e il database SQLite vengono interamente preservati.

3. **Controllo manuale degli aggiornamenti**:
   Anche se gli aggiornamenti automatici in background sono disabilitati o impostati su manuale, puoi avviare un controllo immediato in qualsiasi momento selezionando **Controlla aggiornamenti** dal menu dell'interfaccia web.

---

### Aggiornamento senza connessione di rete { #aggiornamento-senza-connessione-di-rete }

Se il tuo Arduino Uno Q viene utilizzato completamente offline sulla pista senza connessione a Internet, puoi aggiornare facilmente l'installazione in modo manuale utilizzando una normale chiavetta USB.

#### Passaggio 1: Trasferire il pacchetto di aggiornamento sulla scheda tramite USB

1. **Scaricare il pacchetto di rilascio su un computer connesso**:
   Da un computer con accesso a Internet (Mac, Windows o Linux), apri il portale [Download e versioni](downloads.it.md) o la pagina [GitHub Releases](https://github.com/daufderheide/racecoordinator_ai/releases) e scarica il pacchetto Linux ARM64:
   - Formato file: `RaceCoordinatorAI-Linux-ARM64.tar.gz` (o con versione: `RaceCoordinatorAI-Linux-ARM64_v*.tar.gz`).
2. **Copiare su una chiavetta USB**:
   Copia il file `.tar.gz` scaricato su una normale chiavetta USB formattata in FAT32 o exFAT.
3. **Collegare la chiavetta USB all'Uno Q**:
   Inserisci la chiavetta USB in una delle porte USB host disponibili su Arduino Uno Q.
4. **Copiare il file sulla scheda**:
   - **Tramite l'interfaccia desktop**: Apri il file manager sul desktop di Uno Q, seleziona la chiavetta USB montata nella barra laterale e copia il file `.tar.gz` nella cartella `~/Downloads/` (o nella home `~/`).
   - **Tramite terminale / SSH**: Il sistema monta automaticamente i dispositivi USB in `/media/arduino/<NOME_DISPOSITIVO>` (oppure montalo manualmente con `sudo mount /dev/sda1 /mnt`). Copia l'archivio nella tua directory locale:
     ```bash
     cp /media/arduino/*/RaceCoordinatorAI-Linux-ARM64*.tar.gz ~/Downloads/
     ```
     *(In alternativa, se il tuo computer portatile è collegato direttamente alla scheda tramite cavo Ethernet o router Wi-Fi locale senza Internet, puoi trasferire il file tramite `scp`: `scp RaceCoordinatorAI-Linux-ARM64*.tar.gz arduino@<hostname>:~/Downloads/`).*

#### Passaggio 2: Applicare l'aggiornamento

Una volta copiato l'archivio `.tar.gz` sulla scheda (ad esempio in `~/Downloads/`), scegli uno dei seguenti tre metodi per applicare l'aggiornamento:

##### Opzione 1: Script di supporto all'aggiornamento integrato (Più veloce e consigliato)
Race Coordinator AI include uno script di aggiornamento automatico situato in `/opt/racecoordinatorai/scripts/update_app.sh`. Arresta automaticamente i servizi attivi, estrae la nuova versione su `/opt/racecoordinatorai`, ricompila e carica il firmware del microcontrollore se aggiornato, imposta i permessi e riavvia tutti i servizi:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```
*(Tutti i record del database, i dati di gara, i layout personalizzati dell'interfaccia e le preferenze dell'utente vengono preservati automaticamente).*

##### Opzione 2: Estrarre ed eseguire `install.sh` dal pacchetto scaricato
Puoi estrarre l'archivio di aggiornamento scaricato in una cartella temporanea ed eseguire il relativo script `install.sh`. Il programma di installazione rileva l'installazione esistente in `/opt/racecoordinatorai`, aggiorna i file dell'applicazione, reinstalla il firmware del microcontrollore e riavvia i servizi systemd:
```bash
# Estrarre l'archivio scaricato
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Eseguire l'installer sull'installazione esistente (preserva database e impostazioni)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Opzione 3: Aggiornamento manuale tramite comandi Linux (Senza script di supporto)
Se preferisci eseguire l'aggiornamento completamente a mano senza utilizzare gli script forniti, esegui la seguente sequenza di comandi nel terminale:

1. **Arrestare i servizi attivi**:
     ```bash
     sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
     ```
2. **Estrarre i file aggiornati su `/opt/racecoordinatorai`**:
     ```bash
     sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
     ```
     *(Nota: Questa operazione aggiorna i file eseguibili, l'interfaccia web e gli script sul posto lasciando intatti il database SQLite e le risorse personalizzate).*
3. **Verificare la proprietà e i permessi corretti dei file**:
     ```bash
     sudo chown -R arduino:arduino /opt/racecoordinatorai
     ```
4. **Ricompilare e caricare il firmware del microcontrollore (se lo sketch è stato aggiornato)**:
     ```bash
     cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
     arduino-cli compile --fqbn arduino:zephyr:unoq .
     arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
     ```
5. **Riavviare i servizi del server e del kiosk**:
     ```bash
     sudo systemctl restart racecoordinatorai
     sudo systemctl restart racecoordinatorai-kiosk
     ```

---

## Focus della finestra e app di avvio automatico del desktop (es. Arduino App Lab)

Su Arduino Uno Q, Arduino Linux OS avvia «Arduino App Lab» all'accesso al desktop.
- **Mantenimento automatico del focus**: Per impostazione predefinita, `start_kiosk.sh` utilizza `wmctrl` per portare automaticamente Race Coordinator AI in primo piano e mantenere il focus, assicurando che lo schermo TV sia subito pronto per le gare senza dover cambiare finestra con mouse o tastiera.
- **Opzionale: Disabilitare App Lab all'avvio**: Per un chiosco dedicato alla pista in cui Arduino App Lab non è necessario all'avvio, puoi disabilitare la sua voce di avvio automatico:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## Supporto FastLED e LED RGB (Non supportato su Uno Q)

> [!WARNING] Strisce LED RGB indirizzabili FastLED non supportate sulla MCU di Uno Q
> Le strisce luminose a LED RGB indirizzabili (WS2812B, NeoPixel, SK6812, APA102, ecc.) gestite tramite **FastLED non sono supportate sul microcontrollore integrato di Arduino Uno Q**. La MCU in tempo reale di Uno Q impiega un'architettura STM32U585 basata su Zephyr OS (CMSIS 6), che è priva del supporto a basso livello per registri e temporizzazione bit-banging nella libreria FastLED a monte. Di conseguenza, lo sketch di Race Coordinator AI (`racecoordinatorai_sketch.ino`) disabilita esplicitamente FastLED (`WITH_FAST_LED`) quando viene compilato per la MCU di Uno Q.

### Alternative di illuminazione disponibili

Se desideri indicatori luminosi visivi su una configurazione Arduino Uno Q, sono disponibili due opzioni:

1. **LED a uscita digitale standard**: I LED monocolore (ad es. i classici LED rossi, gialli o verdi pilotati tramite pin di uscita digitale con resistori di limitazione, transistor o relè) possono comunque essere configurati sulla MCU di Uno Q in Race Coordinator AI come normali indicatori di chiamata o stato della pista.
2. **Arduino secondario dedicato per LED RGB FastLED (Consigliato per strisce RGB)**: Se desideri a tutti i costi strisce LED RGB indirizzabili per semafori di partenza con conto alla rovescia a più fasi, indicatori di livello carburante nei box in tempo reale e animazioni di vittoria con bandiera a scacchi, puoi collegare un **secondo Arduino** dedicato al pilotaggio dei LED RGB.

> [!TIP] Utilizzo di un secondo Arduino per LED RGB FastLED
> L'**architettura multi-interfaccia** di Race Coordinator AI supporta pienamente il collegamento e il funzionamento simultaneo di più controller hardware sulla stessa pista:
> 
> - **Interfaccia primaria (MCU integrata di Uno Q)**: Gestisce i segnali di gara critici in termini di tempo—sensori ottici di passaggio sul giro, tempi di settore, pulsanti di chiamata piloti e relè di alimentazione master della pista—con precisione sub-millisecondo.
> - **Interfaccia secondaria (Secondo Arduino tramite USB)**: Collega una scheda Arduino standard economica (come un **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** o **ESP32**) a una delle porte host USB di Uno Q. Carica lo sketch standard `racecoordinatorai_sketch.ino` (in cui FastLED è abilitato) su questa seconda scheda.
> - **Configurazione nell'Editor della pista**: Nell'interfaccia web di Race Coordinator AI, accedi all'**Editor della pista** $\rightarrow$ **Interfacce hardware** e fai clic su **Aggiungi interfaccia** per selezionare la porta seriale del secondo Arduino (ad es. `/dev/ttyUSB0` o `/dev/ttyACM0`). Configura le tue strisce luminose FastLED su questa seconda interfaccia. Race Coordinator AI gestisce e coordina automaticamente entrambe le schede in modo simultaneo durante le gare.

---

## Risoluzione dei problemi relativi a sintesi vocale (TTS) e audio

Race Coordinator AI utilizza la Web Speech API del browser (`window.speechSynthesis`) per annunciare tempi sul giro, eventi di gara e commenti dei piloti. A differenza di Windows o macOS, Linux (Debian 12 su Uno Q) non dispone di un sintetizzatore vocale integrato, pertanto Chromium si affida a **Speech Dispatcher** ed **eSpeak NG**.

### Pacchetti richiesti
Il programma di installazione automatizzato (`install.sh`) installa automaticamente questi pacchetti. Se hai eseguito un'installazione manuale o se il TTS non emette suoni, assicurati che siano installati i pacchetti vocali e audio necessari:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Parametri del browser in modalità chiosco e navigazione a più schede
In modalità chiosco, Chromium viene avviato tramite `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Race Coordinator AI utilizza `--start-maximized` (anziché la modalità restrittiva `--kiosk`) per garantire che le schede secondarie —come Risultati manche, Risultati gara, visualizzazioni dei temi e la Guida in linea offline— rimangano visibili e accessibili dalla barra delle schede nella parte superiore della TV. Chromium richiede inoltre flag specifici per abilitare Speech Dispatcher e la riproduzione automatica dell'audio. Assicurati che il tuo script `start_kiosk.sh` includa:
```bash
  --start-maximized \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Se modifichi `start_kiosk.sh` manualmente, riavvia il servizio del chiosco: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Passaggi per la risoluzione dei problemi
1. **Verificare la modalità operativa e l'uscita audio**:
   - **Modalità schermo chiosco**: L'audio viene riprodotto direttamente da Uno Q tramite la connessione DisplayPort/HDMI USB-C verso la TV/monitor o tramite altoparlanti USB collegati.
   - **Client di rete remoto**: Se accedi a Race Coordinator AI da un laptop, tablet o smartphone sulla rete locale (`http://<hostname>:7070`), l'audio e il TTS vengono riprodotti tramite **il browser e gli altoparlanti di quel dispositivo**, non dalla scheda Uno Q.
2. **Verificare l'uscita audio hardware**:
   Esegui un test audio nel terminale di Uno Q per verificare che l'uscita audio non sia muta e funzioni:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Se non viene emesso alcun suono, avvia `alsamixer` nel terminale per verificare che i cursori del volume Master/PCM/HDMI non siano silenziati (`[MM]`, premi `M` per attivare) e siano a un livello adeguato.
3. **Testare i sintetizzatori vocali da riga di comando**:
   Verifica che eSpeak NG e Speech Dispatcher funzionino a livello di sistema operativo:
   ```bash
   # Testare la sintesi pura
   espeak-ng "Testing speech synthesis"

   # Testare Speech Dispatcher (il backend di Chromium)
   spd-say "Testing speech dispatcher"
   ```
   Se `spd-say` restituisce un errore o si blocca, riavvia il demone: `pkill -f speech-dispatcher && spd-say "Hello"`.
4. **Testare nell'interfaccia web**:
   Nell'interfaccia web di Race Coordinator AI, apri **Personalizza interfaccia** (o **Editor dei temi** $\rightarrow$ **Impostazioni audio**). Controlla il menu a discesa **Voce TTS**: devono comparire le voci disponibili. Fai clic su **Prova voce TTS** per confermare la riproduzione.

