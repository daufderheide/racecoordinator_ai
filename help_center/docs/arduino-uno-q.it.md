# Guida alla configurazione di Arduino UNO Q

Questa guida spiega come configurare **Race Coordinator AI (RC AI)** sulla scheda di sviluppo ibrida **Arduino UNO Q** come dispositivo hardware autonomo.

---

## Panoramica dell'hardware e varianti di memoria

L'**Arduino UNO Q** combina un Single Board Computer (SBC) Linux a 64 bit con un microcontrollore in tempo reale su un'unica scheda:

- **MPU Linux (Qualcomm Cortex-A53 a 2,0 GHz)**: Esegue il server Race Coordinator AI, il database SQLite, il server client Web e l'aggiornamento automatico.
- **MCU in tempo reale (STM32U585 Cortex-M33 a 160 MHz)**: Gestisce gli interrupt dei pin dei sensori di giro, i relè di alimentazione e i ponti di luci RGB FastLED con precisione sub-millisecondo.
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

### Passaggio 1: Preparare la scheda e connettersi tramite SSH
1. Installa **Arduino Linux OS** (Debian 12 arm64) su Uno Q.
2. Collega la scheda alla rete locale tramite Wi-Fi o Ethernet:
   * **Configurazione Wi-Fi al primo avvio**: All'avvio iniziale, la procedura guidata di configurazione richiederà la configurazione della rete wireless.
   * **Nota sulla prima connessione**: La connessione Wi-Fi potrebbe non avere effetto immediato e i comandi manuali da terminale come `sudo nmcli dev wifi connect "IlTuo_SSID" password "LaTua_Password"` potrebbero inizialmente fallire al primo avvio. Se ciò si verifica, esegui semplicemente `sudo reboot`. Dopo il riavvio, la scheda di rete wireless si inizializzerà correttamente e si connetterà automaticamente alla rete Wi-Fi configurata.
   * **Applicare gli aggiornamenti della scheda e del firmware**: Al riavvio (o quando richiesto dal sistema), potrebbe esserti chiesto se desideri aggiornare vari pacchetti e componenti firmware sulla scheda. Si consiglia vivamente di accettare ed eseguire tutti gli aggiornamenti suggeriti, poiché il firmware di fabbrica è spesso obsoleto. Tieni presente che questo aggiornamento iniziale può richiedere del tempo (spesso da 5 a più di 10 minuti a seconda della velocità della rete); lascia che si completi senza interruzioni.
3. Abilitare SSH sulla scheda e connettersi:
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
   * **Connettersi dal PC**: Apri un terminale sul tuo computer e connettiti utilizzando il nome host o l'indirizzo IP della scheda:
     ```bash
     ssh arduino@<hostname>
     # Oppure connettiti direttamente tramite IP:
     ssh arduino@<INDIRIZZO_IP>
     ```

### Passaggio 2: Installare i prerequisiti
Installa l'ambiente di runtime Java (`default-jre-headless`), le utilità audio (`espeak-ng`, `alsa-utils`), `chromium` e il gestore delle finestre (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
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
```
*(Nota: Eventuali avvisi come `tar: Ignoring unknown extended header...` sono innocui tag di metadati macOS e possono essere ignorati).*

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
   sudo usermod -a -G dialout arduino
   ```

3. **Installare e registrare i servizi systemd**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

### Passaggio 4: Eseguire il flashing del firmware del microcontrollore (con supporto FastLED)
Compila e carica lo sketch hardware sulla MCU integrata:
```bash
# Verifica schede e porte rilevate
arduino-cli board list

# Installa il core della scheda Zephyr in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Installa le librerie Arduino richieste (bridge router Uno Q e FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# Compila racecoordinatorai_sketch per la MCU Uno Q
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Carica sulla MCU integrata tramite il bridge di rete interno
# (Inserisci la password della scheda 'arduino' quando richiesto, o passa --upload-field password=arduino)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Nota: Come verificato tramite `arduino-cli board list`, il microcontrollore Uno Q esegue Zephyr OS sul bridge di rete interno `172.17.0.1` con FQBN `arduino:zephyr:unoq`. La libreria `Arduino_RouterBridge` è necessaria per la comunicazione seriale attraverso il bridge SoC. Le strisce di luci LED FastLED non sono attualmente supportate sull'architettura STM32U5 / Zephyr Cortex-M33 a causa delle definizioni di registro CMSIS 6, ma tutte le funzionalità principali della pista—sensori di giro, tempi di settore, pulsanti di chiamata e relè di corsia—sono perfettamente operative).*

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

## Focus della finestra e app di avvio automatico del desktop (es. Arduino App Lab)

Su Arduino Uno Q, Arduino Linux OS avvia «Arduino App Lab» all'accesso al desktop.
- **Mantenimento automatico del focus**: Per impostazione predefinita, `start_kiosk.sh` utilizza `wmctrl` per portare automaticamente Race Coordinator AI in primo piano e mantenere il focus, assicurando che lo schermo TV sia subito pronto per le gare senza dover cambiare finestra con mouse o tastiera.
- **Opzionale: Disabilitare App Lab all'avvio**: Per un chiosco dedicato alla pista in cui Arduino App Lab non è necessario all'avvio, puoi disabilitare la sua voce di avvio automatico:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## Configurazione del ponte luci RGB FastLED

FastLED è completamente supportato su Uno Q. Le strisce LED RGB indirizzabili (WS2812B, NeoPixel, SK6812, APA102) si collegano direttamente ai pin di intestazione GPIO sulla MCU STM32.

- **Luci di partenza**: Animazione del conto alla rovescia in 5 fasi (rosso $\rightarrow$ giallo $\rightarrow$ verde).
- **Corsia box / Rifornimento**: Indicatore di percentuale del livello di carburante in tempo reale per corsia.
- **Leader e vittoria**: Impulso dinamico per il leader della manche e animazione con bandiera a scacchi.

---

## Aggiornamenti software automatici

Quando è connesso al Wi-Fi, Race Coordinator AI controlla automaticamente le release di GitHub:
1. **Aggiornamento dell'applicazione**: Scarica il nuovo pacchetto Linux ARM64 in background.
2. **Riavvio del servizio**: Riavvia `racecoordinatorai.service` tramite systemd senza interruzioni.
3. **Sincronizzazione dello sketch MCU**: Ricarica automaticamente il firmware del microcontrollore STM32 utilizzando `arduino-cli` se `racecoordinatorai_sketch.ino` è stato aggiornato.
