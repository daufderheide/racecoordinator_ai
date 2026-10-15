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
