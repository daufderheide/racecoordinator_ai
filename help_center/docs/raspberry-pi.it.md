# Guida alla Configurazione su Raspberry Pi (Sperimentale)

Questa guida illustra come configurare **Race Coordinator AI (RC AI)** su un single-board computer **Raspberry Pi** impiegando un'architettura a due schede.

---

> [!NOTE] Configurazione Hardware Sperimentale
> Sebbene l'applicazione principale Linux ARM64 di Race Coordinator AI venga eseguita in modo nativo e fluido su Raspberry Pi OS a 64 bit, l'esecuzione su Raspberry Pi è classificata come **sperimentale**. A differenza dell'architettura integrata dual-core dell'Arduino Uno Q (che combina una MPU applicativa e un microcontrollore STM32 in tempo reale dedicato su un unico circuito stampato), la configurazione su Raspberry Pi richiede un **microcontrollore USB esterno** (come Arduino Uno, Nano, Mega o RP2040) per gestire i sensori di corsia e i relè di alimentazione della pista.

---

## Architettura: Perché una Configurazione a Due Schede?

Per comprendere le ragioni dell'architettura a due schede su Raspberry Pi, è utile evidenziare la differenza fondamentale tra elaborazione general-purpose e cronometraggio deterministico in tempo reale:

```
┌────────────────────────────────────────────────────────┐
│          Raspberry Pi 4 / 5 (Computer Host)            │
│                                                        │
│  - Raspberry Pi OS a 64 bit (Debian Linux)             │
│  - Runtime Server Java 21 e Database SQLite            │
│  - Server Web Applicativo (Porta 7070)                 │
│  - Schermo Kiosk Chromium a Schermo Intero (HDMI TV)   │
└───────────────────────────┬────────────────────────────┘
                            │ Connessione Seriale USB
                            │ (/dev/ttyACM0 o /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Microcontrollore Esterno (Arduino Uno / Nano)     │
│                                                        │
│  - Firmware Real-Time (racecoordinatorai_sketch.ino)   │
│  - Gestione Interrupt con Precisione al Microsecondo   │
│  - Ingressi Tolleranti a 5V (Fototransistor / IR)      │
│  - Controllo Relè Alimentazione Pista e Pulsanti Pausa │
└────────────────────────────────────────────────────────┘
```

### Perché non Utilizzare Direttamente i Pin GPIO del Raspberry Pi?

1. **Jitter di Pianificazione del Kernel Linux**:
   Raspberry Pi OS è un sistema operativo multitasking prelatorio di tipo general-purpose. Il kernel Linux distribuisce continuamente il tempo CPU tra attività di sistema, I/O di rete, servizi in background e rendering grafico. Questo introduce una latenza non deterministica ("jitter") che varia tipicamente tra **5 e 30 millisecondi**. Nello slot racing, un'automobilina leggera che attraversa un sensore ottico o un dead strip ad alta velocità genera un impulso elettrico della durata di appena **1 - 5 millisecondi**. L'affidamento diretto al polling dei GPIO o agli interrupt nello spazio utente sotto Linux provoca inevitabilmente giri persi e cronometraggi imprecisi al centesimo di secondo.
2. **Tensioni Elettriche e Protezione dai Transitori**:
   Il connettore GPIO a 40 pin del Raspberry Pi opera rigorosamente a **logica 3,3V** senza alcuna protezione interna da sovratensioni. Collegare direttamente i cavi della pista alla scheda espone il Pi al rischio di distruzione causato da sensori ottici a 5V, picchi induttivi delle bobine dei relè o forza contro-elettromotrice da 12V–18V generata dai motori dei modelli.
3. **La Soluzione a Due Schede**:
   Accoppiando il Raspberry Pi a un economico microcontrollore USB (come Arduino Uno R3/R4, Nano, Mega 2560 o Raspberry Pi Pico con firmware Arduino), si ottiene il meglio di entrambe le tecnologie:
   - Il **microcontrollore** esegue firmware bare-metal in tempo reale con interrupt hardware al di sotto del millisecondo e tolleranza elettrica ai 5V.
   - Il **Raspberry Pi** opera come potente computer host per il server Java 21, il database SQLite, i servizi di rete, la sintesi vocale e l'uscita video HDMI.

---

## Requisiti Hardware e Varianti di Memoria

### 1. Single-Board Computer Raspberry Pi

* **Modelli Supportati**: **Raspberry Pi 4 Model B** o **Raspberry Pi 5** (ARM Cortex-A72 o Cortex-A76 a 64 bit).
* **Sistema Operativo**: È richiesto **Raspberry Pi OS (64-bit)**. La versione a 32 bit non è supportata.
* **Supporto di Memorizzazione**: Scheda microSD ad alta velocità da almeno 16 GB (consigliata classe A1 o A2) o un'unità SSD USB 3.0.
* **Alimentatore**: Alimentatore ufficiale USB-C Raspberry Pi (15W per Pi 4, 27W per Pi 5) per prevenire cali di tensione.

### 2 GB contro 4 GB / 8 GB di RAM

| Modello | Modalità Operativa Consigliata | Descrizione |
| :--- | :--- | :--- |
| **Raspberry Pi (2 GB RAM)** | **Modalità Dispositivo Senza Schermo (Headless)** | Ideale per l'utilizzo come server di pista dedicato senza monitor collegato. I piloti e i direttori di gara aprono l'interfaccia su tablet, smartphone o portatili tramite Wi-Fi/LAN (`http://<pi-ip>:7070`). La disattivazione del browser kiosk locale libera memoria RAM per il server Java e il database. |
| **Raspberry Pi (4 GB o 8 GB RAM)** | **Modalità Schermo Kiosk** *(Consigliata)* | Consigliata quando si collega direttamente un monitor HDMI o un televisore al Pi. Esegue simultaneamente il desktop grafico, il browser kiosk a schermo intero, il server Java e il database con eccellente reattività. |

### 2. Microcontrollore Esterno di Cronometraggio

Una scheda esterna su cui è caricato il firmware di Race Coordinator AI:

* **Schede Consigliate**:
  * **Arduino Uno R3 o R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideale per piste a 4 o 6 corsie con numerosi pin per sensori)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** con firmware Arduino
* **Cavo USB**: Cavo USB standard per collegare il microcontrollore a una qualsiasi porta USB del Raspberry Pi.
* **Sensori di Pista e Relè**: Collegati al microcontrollore come documentato nella **[Guida alla Configurazione delle Piste](track-editor.it.md)**.

---

## Installazione Passo dopo Passo

### Passo 1: Installare Raspberry Pi OS (64 bit)

1. Scaricare e avviare **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** sul proprio PC o Mac.
2. Selezionare il modello di Raspberry Pi (Pi 4 o Pi 5).
3. In **Sistema Operativo**, scegliere **Raspberry Pi OS (64-bit)** (Debian Bookworm o Bullseye).
4. Fare clic su **Modifica impostazioni** (icona ingranaggio) per preconfigurare:
   * **Nome host (Hostname)**: Assegnare un nome univoco (es. `racecoordinator` o `slotcar-pi`).
   * **Nome utente e password**: Configurare un account utente (es. utente `pi`).
   * **Wi-Fi**: Inserire SSID e password della rete wireless.
   * **Servizi**: Selezionare **Abilita SSH** (con password o chiave pubblica).
5. Selezionare la scheda microSD o l'unità SSD di destinazione e fare clic su **Scrivi**.

### Passo 2: Installare il Firmware sul Microcontrollore

Prima di connettere l'Arduino al Raspberry Pi:

1. Scaricare il pacchetto di rilascio di Race Coordinator AI sul proprio computer o individuare `racecoordinatorai_sketch.ino` nell'archivio all'interno della cartella `firmware/`.
2. Aprire lo sketch nell'**IDE di Arduino** sul computer.
3. Selezionare il tipo di scheda (es. *Arduino Uno* o *Arduino Nano*) e la porta seriale.
4. Fare clic su **Carica** per compilare e installare il firmware sulla scheda.
5. Scollegare il microcontrollore dal computer e connetterlo a una porta USB del Raspberry Pi. Verrà riconosciuto automaticamente come dispositivo seriale (tipicamente `/dev/ttyACM0` o `/dev/ttyUSB0`).

### Passo 3: Installare i Prerequisiti sul Raspberry Pi

Accendere il Raspberry Pi e connettersi via SSH dal terminale del proprio computer:

```bash
ssh pi@<hostname>.local
# Oppure connettersi tramite indirizzo IP:
# ssh pi@192.168.1.xxx
```

Aggiornare i repository e installare Java, i pacchetti per la sintesi vocale, il browser e le utilità di sistema:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Nota: Nelle versioni recenti di Debian/Raspberry Pi OS Bookworm, il pacchetto del browser si chiama `chromium` anziché `chromium-browser`. Se `chromium-browser` non viene trovato, installare `chromium`).*

### Passo 4: Scaricare ed Eseguire l'Installer Automatizzato

1. Trasferire l'archivio di rilascio Linux ARM64 sul Raspberry Pi:
   ```bash
   # Dal terminale del PC / Mac:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(In alternativa, scaricarlo direttamente sul Pi con `curl` o `wget` dalla [Pagina dei Download](downloads.it.md)).*

2. Estrarre l'archivio ed entrare nella cartella di installazione:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Eseguire l'installer con privilegi di amministratore (`sudo`):
   ```bash
   sudo ./install.sh
   ```

#### Riconoscimento Automatico dell'Hardware e Banner Pre-Installazione

L'installer analizza `/proc/device-tree/model` e rileva automaticamente l'esecuzione su Raspberry Pi:

- **Piattaforma Hardware**: Imposta `Hardware Platform: pi`.
- **Account di Servizio**: Assegna la proprietà dei file e l'esecuzione dei servizi all'utente chiamante (es. `pi`), configurando i servizi systemd e i permessi del gruppo seriale (`dialout`).
- **Caricamento Firmware**: Ignora automaticamente la compilazione e il caricamento del firmware Zephyr dell'Arduino Uno Q, in quanto sul Raspberry Pi viene utilizzato un Arduino USB esterno.

Prima di copiare file o registrare i servizi, l'installer visualizza il **Riepilogo di Risoluzione della Configurazione Previa**:

```text
==========================================================
 Race Coordinator AI Installation Configuration
==========================================================
 Hardware Platform: pi
   Resolution:      Auto-detected (/proc/device-tree/model: Raspberry Pi 4 Model B Rev 1.5)
 Service Account:   pi
   Resolution:      Detected from sudo invocation ($SUDO_USER)
   Home Directory:  /home/pi
   Account Status:  Account exists (UID: 1000, GID: 1000)
 Target Directory:  /opt/racecoordinatorai
 MCU Firmware:      SKIP (External USB microcontroller used on Raspberry Pi)
 Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service
 Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)
 Web UI Port:       7070
==========================================================
```

#### Opzioni della Riga di Comando dell'Installer

È possibile personalizzare l'installazione tramite argomenti facoltativi:

| Argomento | Descrizione | Predefinito |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Imposta esplicitamente il tipo di scheda target. | Rilevato da `/proc/device-tree/model` (`pi`) |
| `--user=<nome_utente>` | Account utente Linux proprietario di `/opt/racecoordinatorai` e dei servizi. | Rilevato tramite `$SUDO_USER` (predefinito `pi` su Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Salta esplicitamente compilazione/caricamento dello sketch del microcontrollore. | Saltato automaticamente su `pi` |
| `-v`, `--verbose` | Attiva la registrazione dettagliata. | Output standard (`false`) |
| `-h`, `--help` | Mostra il riepilogo dell'utilizzo ed esce. | - |

---

## Modalità Operative: Kiosk o Headless (Senza Schermo)

### 1. Modalità Schermo Kiosk (Pi da 4 GB / 8 GB)

Per impostazione predefinita, l'installer abilita due servizi in background systemd:

1. `racecoordinatorai.service`: Il server backend Java e il database SQLite integrato.
2. `racecoordinatorai-kiosk.service`: Una sessione Chromium a schermo intero avviata sull'uscita HDMI principale all'indirizzo `http://localhost:7070`.

Se un televisore o monitor è collegato all'uscita HDMI del Pi, Race Coordinator AI si aprirà automaticamente all'avvio in modalità schermo intero.

### 2. Modalità Dispositivo Senza Schermo (Headless) (Pi da 2 GB o Server Dedicato)

Se si utilizza un **Raspberry Pi da 2 GB** o se il Pi è installato sotto la pista senza monitor collegato:

```bash
# Arrestare e disabilitare permanentemente il browser kiosk:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Con il servizio kiosk disabilitato:

- Il server consuma una quantità minima di memoria RAM (~250–350 MB).
- È possibile connettersi da qualsiasi dispositivo nella stessa rete Wi-Fi o cablata aprendo un browser su:
  ```text
  http://<ip-del-raspberry-pi>:7070
  # Esempio: http://192.168.1.150:7070 o http://racecoordinator.local:7070
  ```

---

## Configurare l'Interfaccia di Pista in Race Coordinator AI

A server avviato, configurare la connessione seriale con il microcontrollore esterno:

1. Aprire l'interfaccia web nel browser (`http://localhost:7070` o `http://<pi-ip>:7070`).
2. Accedere a **Gestione Piste** → **Modifica Pista**.
3. Nella scheda **Interfacce Hardware**:
   * **Tipo Interfaccia**: Selezionare **Arduino**.
   * **Porta**: Selezionare `/dev/ttyACM0` o `/dev/ttyUSB0` (la porta USB del proprio Arduino).
   * **Baud Rate**: `115200`.
4. Fare clic su **Connetti / Verifica Interfaccia** per accertare la comunicazione bidirezionale.
5. Assegnare i sensori di corsia, i pulsanti di pausa e i relè di alimentazione ai pin corrispondenti dell'Arduino.
6. Fare clic su **Salva Pista**.

---

## Gestione dei Servizi Systemd

Controllare i servizi in background tramite i comandi standard di `systemctl`:

```bash
# Verificare lo stato del server e visualizzare i log in tempo reale:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Riavviare l'applicazione:
sudo systemctl restart racecoordinatorai.service

# Verificare lo stato del browser kiosk (se abilitato):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Aggiornamento di un'Installazione Esistente

L'aggiornamento di Race Coordinator AI su Raspberry Pi preserva tutti i dati utente:

* **Conservazione dei Dati**: Il database (`racecoordinator.db`), lo storico gare, i profili pilota e i temi personalizzati restano custoditi in `/home/<utente>/.racecoordinatorai/` e non vengono sovrascritti.
* **Aggiornamento Automatico nell'App**: Quando è disponibile un aggiornamento, fare clic su **Installa ora** nel banner di notifica. Lo script `/opt/racecoordinatorai/scripts/update_app.sh` riconosce automaticamente il Raspberry Pi ed evita il caricamento dello sketch.
* **Aggiornamento Manuale**: Scaricare il nuovo archivio `.tar.gz` ed eseguire:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
