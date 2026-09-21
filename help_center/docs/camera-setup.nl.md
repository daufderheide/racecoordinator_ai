# Installatiehandleiding voor mobiele webcamera

Deze handleiding legt uit hoe u een smartphone of tablet (iOS of Android) configureert als optische hogesnelheids-rondetellingcamera in **Race Coordinator AI (RC AI)**.

---

## Overzicht

Race Coordinator AI maakt het mogelijk om elke moderne smartphone te gebruiken als optische tijdwaarnemingsbrug. Door het apparaat direct boven de start/finishlijn of ingang van de pitstraat te monteren, detecteert de camera passerende auto's op elke baan en verstuurt het telsignalen via WebSockets in realtime naar de server.

Omdat deze interface direct in de mobiele browser draait zonder apps te hoeven installeren, gelden de beveiligingsrichtlijnen van de browser.

---

## Waarom cameratoegang op het lokale netwerk beperkt is

Moderne browsers hanteren strenge beveiligingsregels rondom mediabronnen (`navigator.mediaDevices.getUserMedia`).

Om de privacy te waarborgen, staan browsers cameratoegang alleen toe binnen een **Beveiligde Context (Secure Context)**:

1. **Versleutelde HTTPS-verbindingen** (`https://...`).
2. **Lokale loopback-adressen** (`http://localhost` of `http://127.0.0.1`).

Wanneer uw mobiele apparaat via lokale wifi verbindt met Race Coordinator AI via een lokaal IP-adres (bijv. `http://192.168.1.150:4200`), classificeert de browser dit als een onveilige HTTP-oorsprong en blokkeert de cameratoegang standaard.

---

## Browsercompatibiliteit en verschillen

| Besturingssysteem | Browser | Web-engine | Omzeilingsflag beschikbaar? | Camera via lokaal HTTP? |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Google Chrome | Chromium (Blink) | **Ja** (`chrome://flags`) | **Ja** (met flag) |
| **Android** | Edge / Brave / Opera | Chromium (Blink) | **Ja** (`edge://flags`, etc.) | **Ja** (met flag) |
| **Android** | Firefox | Gecko | Nee | HTTPS vereist |
| **iOS (iPhone / iPad)** | Safari | Apple WebKit | **Nee** | HTTPS vereist |
| **iOS (iPhone / iPad)** | Chrome / Edge / Firefox | Apple WebKit (`WKWebView`) | **Nee** | HTTPS vereist |

!!! warning "Belangrijke opmerking over Chrome op iOS"
    Onder Apple iOS verplicht Apple alle browsers (inclusief Google Chrome, Edge en Firefox) om onder de motorkap de **WebKit-engine** van Apple te gebruiken.
    
    Daarom ondersteunt **iOS Chrome GEEN `chrome://flags`**. Het invoeren van `chrome://flags` op iOS heeft geen effect of opent een zoekopdracht. iOS-apparaten vereisen altijd een HTTPS-verbinding, ongeacht welke browserapp is geïnstalleerd.

---

## Stapsgewijze configuratie voor Android (Google Chrome)

Google Chrome op Android biedt een ingebouwde ontwikkelaarsflag om specifieke lokale IP-adressen als veilige oorsprong aan te merken.

### Stap 1: Server-IP en poort opzoeken
1. Open in Race Coordinator AI op uw computer **Baanbewerker** > **Cameraconfiguratie**.
2. Vouw de sectie **Mobiele koppeling** uit en klik op **QR-code voor koppeling tonen**.
3. Noteer de getoonde server-URL (bijv. `http://192.168.1.150:4200`).

### Stap 2: De Chrome-beveiligingsflag instellen
1. Open **Google Chrome** op uw Android-apparaat.
2. Voer in de adresbalk het volgende in en druk op Enter:
   ```text
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```
3. Zoek de gemarkeerde optie genaamd **"Insecure origins treated as secure"**.
4. Verander de instelling in **Enabled**.
5. Voer in het invoerveld eronder de exacte URL met poort in:
   ```text
   http://192.168.1.150:4200
   ```
   *(Vervang door uw eigen IP-adres en poort).*
6. Tik onderaan op de blauwe knop **Relaunch** om Chrome opnieuw te starten.

### Stap 3: Verbinden en toestemming verlenen
1. Scan de **Koppelings-QR-code** op uw computerscherm met uw smartphone.
2. Tik bij de browsermelding op **Toestaan** om cameratoegang te geven.
3. De live camerabeelden en detectiepoorten verschijnen op uw scherm.

---

## Stapsgewijze configuratie voor iOS (iPhone en iPad)

Omdat Apple WebKit de beveiligde context afdwingt op alle browsers op iOS zonder omzeilingsvlaggen, vereist het gebruik van een iPhone of iPad een **HTTPS-verbinding**.

### Methode 1: Lokale HTTPS Reverse Proxy met mkcert (Aanbevolen)
1. **Installeer mkcert** op de hostcomputer.
2. **Genereer een lokale certificaatautoriteit**: `mkcert -install`
3. **Maak een certificaat aan voor uw lokale IP**: `mkcert 192.168.1.150 localhost 127.0.0.1`
4. **Start een reverse proxy** (zoals Caddy) die het HTTPS-verkeer doorstuurt naar `localhost:4200`.
5. **Installeer het basiscertificaat op uw iOS-apparaat**:
   - Stuur het `rootCA.pem`-bestand naar het iOS-apparaat.
   - Ga naar **Instellingen** > **Profiel gedownload** > **Installeer**.
   - Schakel volledige vertrouwensrelatie in onder **Instellingen** > **Algemeen** > **Info** > **Vertrouwensinstellingen voor certificaten**.
6. Open Safari of Chrome op iOS en navigeer naar het HTTPS-adres.

### Methode 2: Veilige HTTPS-tunnel (Snelste voor testen)
1. Start **ngrok** op uw hoofdcomputer: `ngrok http 4200`
2. Open de gegenereerde `https://...`-URL op uw iPhone. Omdat dit een officieel vertrouwd SSL-certificaat bevat, vraagt iOS direct om cameratoegang.

---

## Testen op deze computer (Desktop- en laptop-webcams)

Om de camerainterface direct op uw hoofdcomputer te testen zonder mobiel apparaat, klikt u in de Baanbewerker op **Testen op dit apparaat** (`http://localhost:4200/camera_interface`).

Omdat `localhost` door alle browsers als een beveiligde context wordt gezien, zijn er geen SSL-certificaten of flags nodig. Wel moeten besturingssysteem- en browsertoestemmingen worden verleend.

### macOS: Installatie en Probleemoplossing

Als de camera op macOS niet start, zelfs na het toestaan van de melding:

1. **Website-toestemmingen in de browser controleren**:
   - Klik in de adresbalk (naast `localhost:4200`) op het **instellingen-/hangslot-icoon** (Site-instellingen).
   - Zorg dat **Camera** staat ingesteld op **Toestaan**.
2. **Systeemtoestemming in macOS verlenen**:
   - Klik op **OK** wanneer het macOS-systeemvenster verschijnt (*"Google Chrome wil toegang tot de camera"*).
   - Indien u dit gemist of eerder geweigerd heeft: open **Systeeminstellingen** > **Privacy en beveiliging** > **Camera** en zet de schakelaar voor **Google Chrome** (of uw browser) op **AAN**.
3. **Herstart de browser (`Cmd + Q`)**:
   - **Cruciaal**: Het beveiligingssysteem van macOS (TCC) vereist dat de browserapplicatie **volledig wordt afgesloten (`Cmd + Q`) en herstart** nadat systeemrechten zijn verleend, voordat het browserproces toegang krijgt tot de camerabron.
4. **Klik op de knop "Opnieuw proberen"**:
   - Het oorspronkelijke cameraverzoek in de pagina verloopt vaak terwijl het macOS-venster nog openstaat. Klik na het verlenen van toestemming op het scherm op **Opnieuw proberen**.
5. **Controleer op cameravergrendeling (Reeds in gebruik)**:
   - De ingebouwde FaceTime HD-camera van macOS kan door slechts één app tegelijk worden gebruikt. Sluit programma's zoals **FaceTime**, **Zoom**, **Microsoft Teams**, **Slack**, **Photo Booth** of **OBS** en klik op **Opnieuw proberen**.

### Windows: Installatie en Probleemoplossing

1. Open **Instellingen** > **Privacy en beveiliging** > **Camera**.
2. Controleer of **Cameratoegang** is ingeschakeld.
3. Schakel zowel **Apps toegang verlenen tot uw camera** als **Desktop-apps toegang verlenen tot uw camera** in.
4. Geef in Chrome of Edge toestemming voor `localhost:4200`.

---

## Montage- en afsteltips

1. **Boven de baan**: Monteer de smartphone op 30 tot 60 cm loodrecht boven de start/finishlijn.
2. **Trillingsvrij**: Zorg voor een stevige houder om valse detecties door baantrillingen te voorkomen.
3. **Verlichting**: Zorg voor egale verlichting zonder flikkerende TL-buizen of slagschaduwen.
4. **Beeldsnelheid**: Selecteer **60 FPS** in de cameraconfiguratie voor nauwkeurige detectie bij hoge snelheden.
