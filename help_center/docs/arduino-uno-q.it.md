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
2. **Modalità dispositivo headless (Attualmente non supportata - Disponibile su richiesta)**: La scheda esegue esclusivamente il server backend e si collega all'hardware della pista, senza monitor o browser locali in esecuzione. Gli utenti accedono all'interfaccia web tramite la rete locale (`http://uno-q.local:7070`). Come indicato sopra, la modalità headless su Uno Q non è supportata per impostazione predefinita, ma può essere aggiunta su richiesta se Uno Q dispone di una connessione di rete.

---

## Installazione passo dopo passo

### Passaggio 1: Preparare la scheda e connettersi tramite SSH
1. Installa **Arduino Linux OS** (Debian 12 arm64) su Uno Q.
2. Collega la scheda alla rete locale tramite Wi-Fi o Ethernet.
3. Apri una sessione SSH:
   ```bash
   ssh arduino@uno-q.local
   ```

### Passaggio 2: Installare i prerequisiti
Installa OpenJDK 11, `arduino-cli`, utilità di visualizzazione e Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Passaggio 3: Eseguire il flashing del firmware del microcontrollore (con supporto FastLED)
Compila e carica lo sketch hardware sulla MCU STM32 integrata:
```bash
# Installa il core della scheda STM32 in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# Compila e carica racecoordinatorai_sketch
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Passaggio 4: Installare il pacchetto dell'applicazione e i servizi Systemd
1. Scarica `RaceCoordinatorAI-Linux-ARM64.tar.gz` ed estrailo in `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Esegui lo script di installazione:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Avvia i servizi:
   ```bash
   # Avvia il server backend
   sudo systemctl start racecoordinatorai

   # (Facoltativo) Abilita il chiosco dello schermo locale su USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
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
