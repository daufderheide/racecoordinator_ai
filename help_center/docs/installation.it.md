# Guida all'Installazione

Questa guida accompagna l'utente nel download, nell'installazione e nella configurazione di Race Coordinator AI sul proprio computer.

---

## Sistemi Operativi Supportati

Race Coordinator AI è completamente multipiattaforma e funziona sia sui sistemi operativi moderni che su quelli legacy:

| Piattaforma | Versioni Supportate | Programma di Installazione Consigliato |
| :--- | :--- | :--- |
| **🪟 Windows (Moderno)** | Windows 10, Windows 11 (64 bit e 32 bit) | **Setup Online** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Legacy)** | Windows 8, Windows 7, Windows XP | **Setup Offline Completo** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Richiesto per installazione iniziale su Win 8 e precedenti)* |
| **🍏 macOS** | Da macOS 10.15 (Catalina) a macOS 15+ (Intel e Apple Silicon) | **Immagine Disco** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64 bit), Arduino Linux OS, Debian, Ubuntu | **Pacchetto ARM64 / Linux** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Scelta del Canale di Rilascio

Race Coordinator AI viene distribuito attraverso tre canali:

* **🟢 Versioni Stabili Ufficiali** *(Consigliato)*: Build interamente collaudate e pronte per la produzione, consigliate per le normali gare su piste casalinghe o di club.
* **🟡 Anteprime Beta**: Build preliminari che integrano le nuove funzionalità in arrivo, nuovi driver hardware e miglioramenti sperimentali per i test della community.
* **🔵 Build Alpha / Nightly**: Versioni snapshot generate automaticamente dallo sviluppo attivo.

👉 Visita il **[Portale Download e Versioni](downloads.it.md)** per scaricare qualsiasi release o visualizzare l'archivio completo.

---

## 🪟 Installazione su Windows

### 1. Scaricare il Programma di Installazione
* Per **Windows 10 / 11**: Scaricare `RaceCoordinatorAI_Online_Setup_*.exe`.
* Per **Windows 8 e precedenti** (o PC privi di connessione Internet attiva): Scaricare `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Eseguire l'Installazione
1. Fare doppio clic sul file `.exe` scaricato.
2. Se Windows SmartScreen visualizza l'avviso *"PC protetto da Windows"*, fare clic su **Ulteriori informazioni** e poi su **Esegui comunque**.
3. Seguire le istruzioni dell'assistente Inno Setup per scegliere la cartella di destinazione (predefinita: `C:\Program Files\RaceCoordinator AI`).
4. Scegliere se creare un collegamento sul desktop.
5. Fare clic su **Installa** per completare la configurazione.

### 3. Avvio
Fare doppio clic sul collegamento **Race Coordinator AI** sul desktop oppure aprirlo dal menu Start di Windows.

!!! note "Prerequisiti per Windows Legacy (XP / 7 / 8)"
    Se si utilizza Windows 7, 8 o XP, assicurarsi di aver installato il componente [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784).

---

## 🍏 Installazione su macOS

### 1. Scaricare l'Immagine Disco
Scaricare `RaceCoordinator_Mac_*.dmg` dalla pagina dei rilasci.

### 2. Installare nella Cartella Applicazioni
1. Fare doppio clic sul file `RaceCoordinator_Mac_*.dmg` scaricato per aprire l'immagine disco.
2. Trascinare l'icona **Race Coordinator AI** nella cartella **Applicazioni** (Applications).
3. Espellere l'immagine disco.

### 3. Primo Avvio e Sicurezza di macOS
1. Aprire la cartella **Applicazioni** e fare doppio clic su **Race Coordinator AI**.
2. Se macOS mostra il messaggio che l'app non può essere aperta perché proviene da uno sviluppatore non identificato:
   - Aprire **Impostazioni di Sistema** → **Privacy e sicurezza**.
   - Scorrere verso il basso fino alla sezione **Sicurezza** e fare clic su **Apri comunque** accanto a Race Coordinator AI.
   - In alternativa, tenere premuto il tasto `Control`, fare clic sull'icona dell'app in Applicazioni e scegliere **Apri**.

---

## 🐧 Installazione su Linux, Raspberry Pi e Arduino Uno Q

Per installazioni su hardware dedicato con servizi systemd automatici, modalità kiosk e interfacce di pista, consultare le guide dedicate:

* **[Guida alla Configurazione su Arduino UNO Q](arduino-uno-q.it.md)**: Configurazione completa per l'appliance dual-core Arduino Uno Q con microcontrollore STM32 in tempo reale integrato.
* **[Guida alla Configurazione su Raspberry Pi (Sperimentale)](raspberry-pi.it.md)**: Guida per Raspberry Pi 4 / 5 con architettura a due schede abbinata a un microcontrollore USB Arduino esterno.

### 1. Scaricare il Pacchetto Linux
Scaricare `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` dalla pagina dei download.

### 2. Estrarre ed Eseguire
1. Aprire un terminale ed estrarre l'archivio nella cartella desiderata:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Verificare che l'eseguibile disponga dei permessi di esecuzione:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Avviare l'applicazione:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Primo Avvio & Primi Passi

Al primo avvio di Race Coordinator AI:

1. **Database Predefinito**: L'applicazione inizializza automaticamente un database SQLite integrato (`racecoordinator.db`) precaricato con piloti e team di esempio, una pista standard a 4 corsie e formati di gara predefiniti (Girone all'italiana, Prove libere).
2. **Modalità Dimostrazione da Tastiera**: È possibile provare immediatamente le modalità di gara utilizzando i tasti per i passaggi sul traguardo, senza collegare alcun hardware fisico.
3. **Configurare i Sensori di Pista**: Accedere a **Gestione Piste** → **Modifica Pista** per impostare l'hardware dell'interfaccia (Arduino Uno / Uno Q, Phidget, Trak-Mate o cronometraggio via webcam).

---

## Aggiornamento di Installazioni Esistenti

L'aggiornamento a una versione più recente di Race Coordinator AI è privo di rischi:

* **I Dati Vengono Mantenuti**: Il database (`racecoordinator.db`), le statistiche di gara, i profili pilota, le configurazioni delle piste e i temi personalizzati risiedono nella cartella dati utente e **non** vengono sovrascritti.
* **Aggiornamento su Windows**: È sufficiente avviare il nuovo programma di installazione sopra l'installazione esistente oppure fare clic su **Installa ora** nel banner di aggiornamento nell'app.
* **Aggiornamento su Linux / Arduino Uno Q / Raspberry Pi**: Eseguire `sudo /opt/racecoordinatorai/scripts/update_app.sh /percorso/a/RaceCoordinatorAI-Linux-ARM64*.tar.gz` oppure estrarre l'archivio ed eseguire `sudo ./install.sh`. Consultare la [Guida Arduino UNO Q](arduino-uno-q.it.md#aggiornamento-di-uninstallazione-esistente) o la [Guida Raspberry Pi](raspberry-pi.it.md#aggiornamento-di-uninstallazione-esistente) per i dettagli.

---

## Segnalazione Problemi e Feedback

Se si riscontrano problemi durante l'installazione o si desidera proporre un miglioramento:

1. Visitare il nostro **[Portale Problemi su GitHub](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Cercare tra i problemi esistenti per verificare se è già disponibile una soluzione.
3. Fare clic su **New Issue** e specificare:
   * Sistema operativo e versione.
   * Versione di Race Coordinator AI (es. `v1.0.0` o `v1.0.0-beta.1`).
   * Passaggi per riprodurre il problema e screenshot/log se disponibili.
