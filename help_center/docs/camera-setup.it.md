# Guida alla Configurazione della Web Camera Mobile

Questa guida illustra come configurare uno smartphone o tablet (iOS o Android) come telecamera ottica per il rilevamento dei giri ad alta velocità in **Race Coordinator AI (RC AI)**.

---

## Panoramica

Race Coordinator AI consente di utilizzare qualsiasi smartphone moderno come ponte ottico di cronometraggio. Posizionando il dispositivo direttamente sopra il traguardo o l'ingresso della corsia box, la fotocamera rileva il passaggio delle vetture su ciascuna corsia e trasmette gli eventi in tempo reale al server tramite WebSockets.

Poiché questa interfaccia viene eseguita direttamente nel browser senza dover installare applicazioni native, si applicano le norme di sicurezza dei browser.

---

## Perché l'accesso alla fotocamera sulla rete locale è limitato

I browser moderni applicano rigidi requisiti di sicurezza sui dispositivi multimediali (`navigator.mediaDevices.getUserMedia`).

Per garantire la privacy dell'utente, l'accesso alla fotocamera è consentito esclusivamente all'interno di un **Contesto Sicuro (Secure Context)**:

1. **Connessioni HTTPS crittografate** (`https://...`).
2. **Indirizzi di loopback locale** (`http://localhost` o `http://127.0.0.1`).

Quando il dispositivo mobile si connette a Race Coordinator AI sulla rete Wi-Fi tramite un indirizzo IP locale (es. `http://192.168.1.150:4200`), il browser riconosce la connessione come un'origine HTTP non protetta e blocca l'accesso alla fotocamera per impostazione predefinita.

---

## Compatibilità e Differenze tra Browser

| Sistema Operativo | Browser | Motore Web | Flag di eccezione disponibile? | Fotocamera su HTTP locale? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Sì** (`chrome://flags`) | **Sì** (con flag abilitato) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Sì** (`edge://flags`, etc.) | **Sì** (con flag abilitato) |
| **Android** | Firefox | Gecko | No | HTTPS richiesto |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **No** | HTTPS richiesto |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **No** | HTTPS richiesto |

!!! warning "Nota Importante su Chrome per iOS"
    Su Apple iOS, le regole di Apple impongono a tutti i browser (inclusi Google Chrome, Edge e Firefox) di utilizzare il motore interno **WebKit** di Apple.
    
    Pertanto, **iOS Chrome NON supporta i `chrome://flags`**. L'inserimento di `chrome://flags` su iOS non avrà alcun effetto o avvierà una ricerca web. I dispositivi iOS richiedono obbligatoriamente una connessione HTTPS indipendentemente dal browser utilizzato.

---

## Configurazione Passo-Passo per Android (Google Chrome)

Google Chrome su Android consente di autorizzare specifici indirizzi IP locali come origini sicure tramite un flag interno per sviluppatori.

### Passaggio 1: Individuare l'IP e la porta del server
1. In Race Coordinator AI sul computer principale, aprire **Editor Tracciato** > **Configurazione Fotocamera**.
2. Espandere la sezione **Accoppiamento Mobile** e fare clic su **Mostra QR Code di Accoppiamento**.
3. Annotare l'URL mostrato (ad esempio `http://192.168.1.150:4200`).

### Passaggio 2: Configurare il flag di sicurezza in Chrome
1. Aprire **Google Chrome** sul dispositivo Android.
2. Digitare nella barra degli indirizzi il seguente URL e premere Invio:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Individuare il flag evidenziato denominato **"Insecure origins treated as secure"**.
4. Impostare il menu a discesa su **Enabled**.
5. Nel campo di testo sottostante, inserire l'indirizzo esatto del server con protocollo e porta:
   ```text
   http://192.168.1.150:4200
   ```
   *(Sostituire con il proprio IP e porta effettivi).*
6. Toccare il pulsante blu **Relaunch** in basso per riavviare Chrome.

### Passaggio 3: Connessione e autorizzazioni
1. Eseguire la scansione del **QR Code di Accoppiamento** mostrato nell'Editor Tracciato con lo smartphone.
2. Alla richiesta di accesso alla fotocamera, selezionare **Consenti**.
3. Il feed video e i varchi di rilevamento interattivi appariranno sullo schermo.

---

## Configurazione Passo-Passo per iOS (iPhone e iPad)

Poiché Apple WebKit impone il contesto sicuro senza possibilità di eccezioni tramite flag, l'utilizzo di iPhone o iPad richiede la pubblicazione tramite **HTTPS**.

### Metodo 1: Reverse Proxy HTTPS Locale con mkcert (Consigliato)
1. **Installare mkcert** sul computer host.
2. **Generare l'autorità di certificazione locale (CA)**: `mkcert -install`
3. **Generare il certificato per l'IP locale**: `mkcert 192.168.1.150 localhost 127.0.0.1`
4. **Avviare un reverse proxy** (es. Caddy) reindirizzando il traffico HTTPS alla porta `localhost:4200`.
5. **Installare il certificato radice su iOS**:
   - Inviare il file `rootCA.pem` al dispositivo iOS.
   - Aprire **Impostazioni** > **Profilo scaricato** > **Installa**.
   - Abilitare la piena attendibilità in **Impostazioni** > **Generali** > **Info** > **Attendibilità certificati**.
6. Aprire Safari o Chrome su iOS e connettersi all'indirizzo sicuro `https://...`.

### Metodo 2: Tunnel HTTPS Sicuro (Test Rapido)
Per testare un iPhone senza installare certificati SSL locali, un tunnel HTTPS fornisce un indirizzo pubblico affidabile:

#### Opzione A: LocalTunnel (Nessuna registrazione richiesta)
Eseguire direttamente dal terminale senza creare un account:
```bash
npx -y localtunnel --port 4200
```
Aprire il link generato `https://...loca.lt` sul proprio iPhone.

#### Opzione B: Tunnel SSH nativo (Nessuna installazione né registrazione)
Utilizzare il comando SSH già incluso nel sistema:
```bash
ssh -R 80:localhost:4200 localhost.run
```
Copiare l'indirizzo `https://...` mostrato nel terminale e aprirlo sull'iPhone.

#### Opzione C: ngrok (Richiede account gratuito)
ngrok richiede un account e un token di autenticazione:
1. Registrarsi gratuitamente su [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup).
2. Aggiungere il token:
   ```bash
   npx ngrok config add-authtoken <IL_TUO_TOKEN>
   ```
3. Avviare il tunnel:
   ```bash
   npx ngrok http 4200
   ```
4. Aprire l'URL `https://...ngrok-free.app` sul proprio iPhone.

### Metodo 3: Fotocamera Continuity Wireless di Apple (macOS + iPhone)
Se il computer principale è un Mac e si desidera usare un iPhone come fotocamera da pista, è possibile sfruttare la funzione integrata **Fotocamera Continuity (Continuity Camera)** di Apple. Funziona **completamente senza fili**, senza bisogno di cavi:

1. **Verificare Apple ID e connettività wireless**:
   - Assicurarsi che Mac e iPhone abbiano effettuato l'accesso con lo stesso Apple ID (con autenticazione a due fattori).
   - Tenere attivi **Wi-Fi** e **Bluetooth** su entrambi i dispositivi.
   - Sull'iPhone, verificare in **Impostazioni** > **Generali** > **AirPlay e Continuity** che **Fotocamera Continuity** sia attiva.
2. **Montare l'iPhone sulla pista**:
   - Posizionare l'iPhone orizzontalmente sopra la linea del traguardo con la fotocamera posteriore rivolta verso il basso.
   - Bloccare lo schermo dell'iPhone. Non serve alcun cavo (un cavo è utile solo per mantenere la ricarica durante sessioni prolungate).
3. **Avviare l'interfaccia localmente sul Mac**:
   - Nell'Editor Tracciato sul Mac, fare clic su **Prova su questo dispositivo** (oppure aprire `http://localhost:4200/camera_interface`).
   - Essendo `localhost` un contesto protetto, il browser consente l'accesso alla fotocamera senza certificati SSL né flag.
   - Nelle impostazioni video del browser o di macOS, selezionare la **Fotocamera iPhone**. Il flusso video wireless verrà agganciato automaticamente.
4. **Portata wireless**: La Fotocamera Continuity utilizza un collegamento diretto peer-to-peer (portata tipica circa 10 metri nella stessa stanza). Se il Mac si trova in un'altra stanza lontana, utilizzare il **Metodo 1 (HTTPS locale)**, il **Metodo 2 (Tunnel HTTPS)** o uno smartphone Android tramite la rete Wi-Fi normale.

---

## Test su questo Computer (Webcam Desktop e Portatili)

Per testare l'interfaccia sul computer principale senza collegare uno smartphone, fare clic su **Prova su questo dispositivo** nell'Editor Tracciato (`http://localhost:4200/camera_interface`).

Poiché `localhost` è riconosciuto come contesto protetto da tutti i browser, non servono flag né certificati SSL. Tuttavia, è necessario concedere i permessi a livello di browser e sistema operativo.

### macOS: Configurazione e Risoluzione dei Problemi

Se la telecamera non si avvia su macOS anche dopo aver concesso l'accesso:

1. **Verificare i permessi del sito nel browser**:
   - Nella barra degli indirizzi (accanto a `localhost:4200`), fare clic sull'**icona delle impostazioni/lucchetto** (Impostazioni sito).
   - Verificare che **Fotocamera** sia impostata su **Consenti**.
2. **Concedere i permessi di sistema in macOS**:
   - Quando compare la finestra di sistema (*«Google Chrome vorrebbe accedere alla fotocamera»*), fare clic su **OK**.
   - Se il messaggio è stato chiuso o rifiutato in precedenza: aprire **Impostazioni di Sistema** > **Privacy e sicurezza** > **Fotocamera** e verificare che l'opzione per **Google Chrome** (o il proprio browser) sia **ATTIVA**.
3. **Riavviare il browser (`Cmd + Q`)**:
   - **Fondamentale**: Il sistema di sicurezza di macOS (TCC) richiede di **chiudere completamente (`Cmd + Q`) e riavviare il browser** dopo aver concesso i permessi affinché il processo possa agganciarsi alla fotocamera.
4. **Fare clic su «Riprova»**:
   - La richiesta iniziale della pagina web spesso scade durante l'attesa del clic sulla finestra di macOS. Fare clic sul pulsante **Riprova** sullo schermo per avviare il video.
5. **Verificare il blocco hardware (Fotocamera occupata)**:
   - La webcam FaceTime HD integrata su Mac supporta un solo programma alla volta. Chiudere applicazioni come **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** o **OBS** e fare clic su **Riprova**.

### Windows: Configurazione e Risoluzione dei Problemi

1. Aprire **Impostazioni** > **Privacy e sicurezza** > **Fotocamera**.
2. Verificare che l'**Accesso alla fotocamera** sia abilitato.
3. Attivare sia **Consenti alle app di accedere alla fotocamera** sia **Consenti alle app desktop di accedere alla fotocamera**.
4. In Chrome o Edge, concedere il permesso per `localhost:4200`.

---

## Suggerimenti per Montaggio e Taratura

1. **Posizione Sopraelevata**: Posizionare lo smartphone a circa 30-60 cm perpendicolarmente sopra la linea di arrivo.
2. **Assenza di Vibrazioni**: Utilizzare un supporto rigido per evitare false rilevazioni causate dalle vibrazioni delle piste.
3. **Illuminazione Costante**: Evitare zone d'ombra o luci fluorescenti sfarfallanti.
4. **Frequenza di Fotogrammi**: Impostare **60 FPS** per una cattura precisa anche a velocità elevate.

---

## Widget Codice QR fotocamera per la schermata di gara

È possibile posizionare un widget interattivo con il **Codice QR fotocamera** direttamente sulla schermata di gara utilizzando l'[Editor interfaccia](ui-editor.it.md):

1. Aprire l'**Editor interfaccia** e individuare **Codice QR fotocamera** nel gruppo di strumenti **Media & Chrome**.
2. Trascinare il widget sul layout di gara nella posizione desiderata.
3. **Visualizzazione in tempo reale**:
   - Il widget visualizza il codice QR di associazione direttamente durante le prove o le batterie di gara.
   - Chiunque può inquadrare il codice con lo smartphone per connettere istantaneamente il sistema di cronometraggio.
4. **Finestra modale interattiva**:
   - Cliccando sul widget in modalità gara viene aperta una finestra con il codice QR ingrandito, l'URL diretto, il pulsante di copia negli appunti e il test locale.

