# Installatiehandleiding Arduino UNO Q

Deze handleiding legt uit hoe u **Race Coordinator AI (RC AI)** instelt op het **Arduino UNO Q** hybride ontwikkelbord als een zelfstandig hardware-apparaat.

---

## Hardware-overzicht en geheugenvarianten

De **Arduino UNO Q** combineert een 64-bits Linux Single Board Computer (SBC) met een real-time microcontroller op één enkel bord:

- **Linux MPU (Qualcomm Cortex-A53 @ 2,0 GHz)**: Voert de Race Coordinator AI-server, SQLite-database, webclient-server en automatische updater uit.
- **Real-Time MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Beheert ronde-sensor pin-interrupts, sectortijden, oproepknoppen en baanvermogensrelais met sub-milliseconde nauwkeurigheid (opmerking: FastLED adresseerbare RGB-leds worden op deze architectuur niet ondersteund).
- **Schermuitgang**: USB-C DisplayPort-uitgang kan rechtstreeks worden aangesloten op een monitor, tv of touchscreen.

### 4GB- versus 2GB-modellen

* **Arduino UNO Q 4GB (Aanbevolen en ondersteund)**: Uitgerust met 4 GB RAM en 32 GB eMMC-opslag. Dit model is vereist voor de **Kiosk Display-modus** (rechtstreekse aansturing van een HDMI/DisplayPort-tv of -monitor), omdat het gelijktijdig uitvoeren van het Linux-bureaublad, de Chromium-browser, de Java-runtime en de SQLite-database meer dan 2 GB geheugen vereist.
* **Arduino UNO Q 2GB (Overweging voor headless-modus)**:
  * Hoewel het 2GB-model onvoldoende geheugen heeft om het lokale bureaublad en de Chromium-kioskweergave soepel uit te voeren, heeft het voldoende geheugen om de backendserver uit te voeren in de **Headless Appliance-modus**.
  * **Huidige ondersteuningsstatus**: Headless-modus op de Uno Q wordt **momenteel niet ondersteund**, omdat er nog aanvullende wijzigingen nodig zijn in het Uno Q-ondersteuningspakket en de configuratie. Ondersteuning voor headless-gebruik op de 2GB Q **kan echter op verzoek worden toegevoegd**, mits de Uno Q over een actieve netwerkverbinding (wifi of ethernet) beschikt, zodat wedstrijdleiders en coureurs vanaf andere apparaten op het netwerk toegang hebben tot de webinterface.

---

## Bedrijfsmodi

1. **Kiosk Display-modus (4GB-model)**: Sluit een HDMI/DisplayPort-monitor of -tv rechtstreeks aan op de USB-C-poort van de Uno Q via een multiport-adapter. Het bord start Chromium automatisch in de kioskmodus op volledig scherm (`http://localhost:7070`), terwijl netwerkverbindingen op afstand gelijktijdig mogelijk zijn.
2. **Headless Appliance-modus (Momenteel niet ondersteund - beschikbaar op verzoek)**: Het bord voert uitsluitend de backendserver uit en maakt verbinding met de baanhardware, zonder dat er een lokale monitor of browser actief is. Gebruikers hebben toegang tot de webinterface via het lokale netwerk (`http://<hostname>:7070` of `http://<IP_ADRES>:7070`). Zoals hierboven vermeld, wordt de headless-modus op de Uno Q momenteel niet standaard ondersteund, maar kan deze op verzoek worden toegevoegd als de Uno Q een netwerkverbinding heeft.

---

## Stapsgewijze installatie

### Stap 1: Het bord voorbereiden en verbinden via het netwerk

1. **Het bord inschakelen** *(Flashen is meestal niet nodig)*:
   * Uw Arduino Uno Q wordt geleverd met **Arduino Linux OS (Debian 12 arm64) vooraf geïnstalleerd** op het interne 32 GB eMMC-flashgeheugen. Sluit het bord eenvoudig aan op de voeding om het besturingssysteem op te starten.
   * *(Opmerking: Het flashen van een besturingssysteemkopie is alleen nodig als u een beschadigd systeem herstelt of een volledige fabrieksreset uitvoert).*

2. **Netwerkverbinding instellen**:
   > [!IMPORTANT]
   > **Internettoegang alleen vereist tijdens de initiële installatie**: Een netwerkverbinding met internettoegang is strikt noodzakelijk tijdens deze initiële installatie om pakketten bij te werken en vereisten te downloaden. Zodra de installatie is voltooid, werkt Race Coordinator AI 100% lokaal en offline, zonder dat een internetverbinding nodig is. Het biedt echter aanzienlijke doorlopende voordelen om het bord verbonden te houden met uw lokale netwerk:
   > - **Automatische software-updates**: Download en installeer eenvoudig nieuwe versies van Race Coordinator AI en firmware-updates rechtstreeks vanuit de webinterface.
   > - **Externe clienttoegang**: Wedstrijdleiders, coureurs en toeschouwers kunnen hun smartphones, tablets of laptops via uw lokale netwerk rechtstreeks verbinden met de webinterface van het bord (`http://<hostname>:7070` of `http://<IP_ADRES>:7070`).

   * **Wifi-configuratie via de schermwizard**: Bij het eerste opstarten vraagt de installatiewizard om de configuratie van het draadloze netwerk. Selecteer uw wifi-netwerk en voer het wachtwoord in.
   * **Alternatief: Wifi instellen via de opdrachtregel**: Als u de wifi niet via de wizard heeft ingesteld of handmatig in de terminal wilt configureren:
     ```bash
     # Beschikbare draadloze netwerken weergeven:
     nmcli dev wifi list

     # Verbinding maken met uw wifi-netwerk:
     sudo nmcli dev wifi connect "Uw_SSID" password "Uw_Wachtwoord"
     ```
   * **Alternatief: Bekabeld ethernet**: Sluit eenvoudig een ethernetkabel aan op het bord (of een USB-C-ethernetadapter). De netwerkadapter configureert zich automatisch via DHCP.
   * **Opmerking over de eerste verbinding**: De wifi-verbinding wordt mogelijk niet direct na het invoeren actief en handmatige `nmcli`-opdrachten kunnen bij het eerste opstarten tijdelijke fouten vertonen. Voer in dat geval eenvoudig `sudo reboot` uit. Na het opnieuw opstarten initialiseert de draadloze netwerkadapter zich correct en maakt deze automatisch verbinding met uw geconfigureerde wifi-netwerk.
   * **Board- en firmware-updates toepassen**: Na het opnieuw opstarten (of wanneer het systeem hierom vraagt), wordt u mogelijk gevraagd of u verschillende pakketten en firmwarecomponenten op het bord wilt bijwerken. Het wordt ten zeerste aanbevolen om alle voorgestelde updates te accepteren en uit te voeren, aangezien de fabrieksfirmware vaak verouderd is. Houd er rekening mee dat deze initiële update enige tijd kan duren (vaak 5 tot meer dan 10 minuten, afhankelijk van de netwerksnelheid); laat dit proces ononderbroken voltooien.

3. **SSH inschakelen op het bord & verbinden (Aanbevolen)**:
   * Het instellen van het bord is het gemakkelijkst via SSH vanaf uw computer, zodat u installatieopdrachten rechtstreeks kunt kopiëren en plakken.
   * **SSH-service inschakelen**: Standaard is de SSH-server niet actief op het bord. Schakel de SSH-service in en start deze vanaf de lokale terminal (met het toetsenbord en scherm aangesloten op het bord):
     ```bash
     sudo systemctl enable --now ssh
     ```
   * **Hostnaam & IP-adres zoeken**: Voer `hostname` en `hostname -I` uit op het bord om de toegewezen hostnaam en het lokale IP-adres te achterhalen (de fabrieksconfiguratie kent vaak een unieke naam toe zoals `allianora` in plaats van `uno-q`):
     ```bash
     hostname
     hostname -I
     ```
     *(Opmerking: `avahi-daemon` is niet vooraf geïnstalleerd op Arduino Linux OS, dus `.local` mDNS-domeinnamen zoals `uno-q.local` werken standaard niet, tenzij u het pakket installeert via `sudo apt-get install -y avahi-daemon`).*
   * **Verbinden vanaf uw pc**:
     * **macOS**: Open het ingebouwde programma **Terminal** of **iTerm2** ([iterm2.com](https://iterm2.com/)) en maak verbinding via de opdrachtregel:
       ```bash
       ssh arduino@<hostname>
       # Of maak rechtstreeks verbinding via IP:
       ssh arduino@<IP_ADRES>
       ```
     * **Windows**: U kunt de ingebouwde PowerShell of Opdrachtprompt gebruiken (met `ssh arduino@<hostname>` of `ssh arduino@<IP_ADRES>`) of een grafische SSH-client zoals **PuTTY** (downloaden via [putty.org](https://www.putty.org/)) gebruiken. Bij gebruik van PuTTY:
       1. Voer de hostnaam of het IP-adres van het bord in het veld **Host Name (or IP address)** in.
       2. Zorg ervoor dat de poort is ingesteld op `22` en het verbindingstype op **SSH**.
       3. Klik op **Open**, accepteer de waarschuwing voor de hostsleutel bij de eerste verbinding en meld u aan als gebruiker `arduino` met uw wachtwoord.

### Stap 2: Vereisten installeren
Installeer de Java-runtime-omgeving (`default-jre-headless`), audio-hulpprogramma's (`espeak-ng`, `speech-dispatcher`, `speech-dispatcher-espeak-ng`, `alsa-utils`), `chromium` en vensterbeheer (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium wmctrl
```
*(Opmerking: Op Debian heet het browserpakket `chromium` in plaats van `chromium-browser`, en `default-jre-headless` levert de standaard OpenJDK-runtime. Het hulpprogramma `wmctrl` wordt door de kioskservice gebruikt om ervoor te zorgen dat Race Coordinator AI de vensterfocus behoudt ten opzichte van automatisch startende desktop-apps zoals Arduino App Lab).*

Controleer of `arduino-cli` is geïnstalleerd:
```bash
arduino-cli version
```
*(Als `arduino-cli` niet vooraf op uw bord is geïnstalleerd, installeer het dan via: `curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sudo BINDIR=/usr/local/bin sh`).*

### Stap 3: Applicatiepakket & Systemd-services installeren
Draag `RaceCoordinatorAI-Linux-ARM64.tar.gz` over van uw computer naar het bord:
```bash
# Vanaf de terminal van uw laptop:
scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz arduino@<hostname>:~/
```

Kies een van de volgende installatiemethoden:

#### Optie A: Geautomatiseerde kant-en-klare installatie (Aanbevolen)
Het geautomatiseerde installatieprogramma regelt de controle van de vereisten, mapconfiguratie, seriële poortmachtigingen, systemd-serviceregistratie, het uploaden van microcontroller-firmware en onmiddellijke opstart met foutafhandeling:
```bash
tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
# Of voor gedetailleerde uitgebreide uitvoer:
# sudo ./install.sh -v
```
*(Opmerking: Meldingen zoals `tar: Ignoring unknown extended header...` zijn onschadelijke macOS-metagegevens en kunnen veilig worden genegeerd).*

> [!NOTE] Download en duur van de Zephyr-boardcore (~5 tot 10+ minuten)
> Tijdens de eerste installatie downloadt en pakt `arduino-cli` de **Zephyr-boardcore (`arduino:zephyr`)** uit voor de geïntegreerde STM32U5 Cortex-M33 MCU. Dit pakket bevat het volledige Zephyr Real-Time Besturingssysteem, de ARM cross-compiler toolchain en hardwarebibliotheken (~500 MB+ download en tienduizenden bestanden).
>
> - **Geschatte tijd**: **5 tot 10+ minuten** afhankelijk van uw netwerkverbinding en eMMC-schrijfsnelheid. **Tijd voor een kop koffie!**
> - **Consolevoortgang**: De voortgang van het downloaden en uitpakken wordt rechtstreeks in de terminal weergegeven. Als u extra gedetailleerde uitvoer van het compileren en uitpakken wilt zien, voert u `sudo ./install.sh -v` uit.
> - **Voortgang controleren via een tweede console / SSH**: Als u zich zorgen maakt dat de installatie is vastgelopen, opent u een tweede SSH-sessie (of een ander terminaltabblad op de Uno Q) en voert u uit:
>   ```bash
>   top -p $(pgrep arduino-cli)
>   ```
>   U zult zien dat `arduino-cli` actief CPU en I/O gebruikt tijdens het downloaden en uitpakken. U kunt de voortgang van de tijdelijke bestanden ook bekijken met:
>   ```bash
>   ls -lh ~/.arduino15/staging/cores/ 2>/dev/null || ls -lh ~/.arduino15/packages/arduino/
>   ```

#### Optie B: Handmatige stapsgewijze installatie (Fallback)
Als u de voorkeur geeft aan handmatige controle of uw configuratie wilt aanpassen:
1. **Applicatiebestanden uitpakken naar `/opt/racecoordinatorai`**:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```

2. **Machtigingen en toegang tot de seriële groep configureren**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   sudo usermod -a -G dialout,audio arduino
   ```

3. **Systemd-services installeren en registreren**:
   ```bash
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai.service /etc/systemd/system/
   sudo cp /opt/racecoordinatorai/systemd/racecoordinatorai-kiosk.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable racecoordinatorai.service
   ```

#### Een bestaande installatie handmatig bijwerken (Vanuit gedownload archief)
Wanneer u een release-update downloadt (zoals `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` opgeslagen in `~/Downloads/` via het opslagvenster van de browser of handmatig overgedragen), kunt u de update toepassen met een van de volgende methoden:

##### Methode 1: Ingebouwd update-helperscript (Snelste & Aanbevolen)
Race Coordinator AI bevat een geautomatiseerd in-place updatescript dat de release uitpakt over `/opt/racecoordinatorai`, indien nodig de microcontroller-firmware opnieuw compileert en uploadt, en services herstart:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```

##### Methode 2: `install.sh` uit het gedownloade pakket uitpakken en uitvoeren
```bash
# Gedownload archief uitpakken
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Voer het installatieprogramma uit over de bestaande installatie (behoudt database en instellingen)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Methode 3: Direct handmatig bestanden uitpakken
Als u de stappen liever handmatig uitvoert:
1. **Actieve services stoppen**:
   ```bash
   sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
   ```
2. **Bijgewerkte bestanden uitpakken over `/opt/racecoordinatorai`**:
   ```bash
   sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
   ```
3. **Zorg voor de juiste machtigingen**:
   ```bash
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
4. **Microcontroller-firmware opnieuw flashen (als de sketch is bijgewerkt)**:
   ```bash
   cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
   arduino-cli compile --fqbn arduino:zephyr:unoq .
   arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
   ```
5. **Services herstarten**:
   ```bash
   sudo systemctl restart racecoordinatorai
   sudo systemctl restart racecoordinatorai-kiosk
   ```

### Stap 4: Microcontroller-firmware flashen
Compileer en upload de hardwaresketch naar de ingebouwde MCU:
```bash
# Gedetecteerde borden en poorten controleren
arduino-cli board list

# Zephyr-bordcore installeren in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Vereiste Arduino-bibliotheken installeren (Uno Q router-bridge)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge

# racecoordinatorai_sketch voor de Uno Q MCU compileren
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Uploaden naar de ingebouwde MCU via de interne netwerkbrug
# (Voer het bordwachtwoord 'arduino' in wanneer gevraagd, of geef --upload-field password=arduino mee)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Opmerking: Zoals geverifieerd via `arduino-cli board list`, draait de Uno Q microcontroller Zephyr OS via de interne netwerkbrug `172.17.0.1` met FQBN `arduino:zephyr:unoq`. De bibliotheek `Arduino_RouterBridge` is vereist voor seriële communicatie via de SoC-brug. Houd er rekening mee dat het uitvoeren van `arduino-cli core install arduino:zephyr` ~500 MB+ downloadt en 5 tot 10+ minuten nodig heeft om uit te pakken op de eMMC-opslag (neem een kop koffie terwijl dit gebeurt; u kunt de voortgang bekijken met `top -p $(pgrep arduino-cli)` in een tweede terminal). FastLED-rgb-ledstrips worden op de STM32U5 / Zephyr Cortex-M33-architectuur momenteel niet ondersteund vanwege upstream CMSIS 6-registerdefinities, maar alle kernfuncties van het circuit—rondensensoren, sectortijden, oproepknoppen en baanrelais—zijn volledig operationeel).*

### Stap 5: Services starten & Kiosk-weergave starten
Start de backend-daemon en schakel de kiosk op volledig scherm op de tv in:
```bash
# Start de backend-server
sudo systemctl start racecoordinatorai

# U hebt de backend-daemon eerder al ingeschakeld.
# Schakel nu de tv-kioskservice in voor grafisch opstarten:
sudo systemctl enable racecoordinatorai-kiosk.service

# Kioskweergave op volledig scherm op de tv direct starten
sudo systemctl start racecoordinatorai-kiosk.service
```

---

## Vensterfocus en automatisch startende desktop-apps (bijv. Arduino App Lab)

Op de Arduino Uno Q start Arduino Linux OS bij het inloggen op het bureaublad standaard «Arduino App Lab».
- **Automatisch focusbehoud**: Standaard gebruikt `start_kiosk.sh` het hulpprogramma `wmctrl` om Race Coordinator AI automatisch naar voren te brengen en de focus te behouden, zodat het tv-scherm direct klaar is voor races zonder handmatig met muis of toetsenbord te hoeven schakelen.
- **Optioneel: App Lab uitschakelen bij opstarten**: Voor een toegewijde racebaankiosk waar Arduino App Lab bij het opstarten niet nodig is, kunt u het autostart-item uitschakelen:
  ```bash
  mkdir -p ~/.config/autostart-disabled
  mv ~/.config/autostart/*app-lab*.desktop ~/.config/autostart-disabled/ 2>/dev/null || true
  ```

---

## FastLED- en RGB-led-ondersteuning (Niet ondersteund op Uno Q)

> [!WARNING] Adresseerbare FastLED RGB-leds niet ondersteund op Uno Q MCU
> Adresseerbare RGB-ledstrips (WS2812B, NeoPixel, SK6812, APA102, enz.) die worden aangestuurd via **FastLED worden niet ondersteund op de ingebouwde microcontroller van de Arduino Uno Q**. De real-time MCU van de Uno Q maakt gebruik van een STM32U585-architectuur onder Zephyr OS (CMSIS 6), waarin ondersteuning voor low-level registers en bit-banging-timing in de upstream FastLED-bibliotheek ontbreekt. Daarom schakelt de Race Coordinator AI-sketch (`racecoordinatorai_sketch.ino`) FastLED (`WITH_FAST_LED`) expliciet uit bij het compileren voor de Uno Q MCU.

### Beschikbare verlichtingsalternatieven

Als u visuele verlichtingsindicatoren wilt op een Arduino Uno Q-opstelling, hebt u twee opties:

1. **Standaard digitale uitgangs-leds**: Enkelkleurige leds (bijv. standaard rode, gele of groene leds die worden aangestuurd via digitale uitgangspinnen met voorschakelweerstanden, transistors of relais) kunnen in Race Coordinator AI op de Uno Q MCU nog steeds worden geconfigureerd als standaard baanoproep- of statusindicatoren.
2. **Toegewijde secundaire Arduino voor FastLED RGB-leds (Aanbevolen voor RGB-strips)**: Als u echt adresseerbare RGB-ledstrips wilt gebruiken voor meerfasige startlicht-countdowns, tankbalkgrafieken in de pitstraat en finishvlag-overwinningsanimaties, kunt u een **tweede Arduino** aansluiten die speciaal is bedoeld voor het aansturen van de RGB-leds.

> [!TIP] Een tweede Arduino gebruiken voor FastLED RGB-leds
> De **multi-interface architectuur** van Race Coordinator AI ondersteunt het gelijktijdig aansluiten en gebruiken van meerdere hardwarecontrollers op hetzelfde circuit:
> 
> - **Primaire interface (Ingebouwde Uno Q MCU)**: Beheert de tijdkritische racesignalen—optische rondesensoren, sectortijden, coureur-oproepknoppen en baanstroomrelais—met sub-milliseconde precisie.
> - **Secundaire interface (Tweede Arduino via USB)**: Sluit een voordelig standaard Arduino-bord (zoals een **Arduino Uno R3**, **Nano**, **Mega 2560**, **RP2040** of **ESP32**) aan op een van de USB-hostpoorten van de Uno Q. Flasht de standaard `racecoordinatorai_sketch.ino` (waarin FastLED is ingeschakeld) naar dit tweede bord.
> - **Configuratie in de Circuit-editor**: Ga in de Race Coordinator AI-webinterface naar de **Circuit-editor** $\rightarrow$ **Hardware-interfaces** en klik op **Interface toevoegen** om de seriële poort van de tweede Arduino toe te voegen (bijv. `/dev/ttyUSB0` of `/dev/ttyACM0`). Configureer uw FastLED-lichtstrips op deze tweede interface. Race Coordinator AI stuurt beide borden tijdens races automatisch gelijktijdig aan.

---

## Probleemoplossing voor tekst-naar-spraak (TTS) en audio

Race Coordinator AI gebruikt de Web Speech API van de browser (`window.speechSynthesis`) om rondetijden, racegebeurtenissen en commentaar van coureurs aan te kondigen. In tegenstelling tot Windows of macOS heeft Linux (Debian 12 op de Uno Q) geen ingebouwde spraaksynthesizer, waardoor Chromium afhankelijk is van **Speech Dispatcher** en **eSpeak NG**.

### Vereiste pakketten
Het geautomatiseerde installatieprogramma (`install.sh`) installeert deze pakketten automatisch. Als u een handmatige installatie hebt uitgevoerd of TTS geen geluid produceert, zorg er dan voor dat de vereiste spraak- en audiopakketten zijn geïnstalleerd:
```bash
sudo apt-get update
sudo apt-get install -y speech-dispatcher speech-dispatcher-espeak-ng espeak-ng alsa-utils
```

### Browserparameters in kioskmodus
In de kioskmodus wordt Chromium gestart via `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Chromium schakelt standaard de integratie met Linux Speech Dispatcher uit en blokkeert audio voorafgaand aan gebruikersinteractie, tenzij specifieke parameters worden meegegeven. Zorg ervoor dat uw script `start_kiosk.sh` het volgende bevat:
```bash
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
```
*(Als u `start_kiosk.sh` handmatig bewerkt, herstart dan de kioskservice: `sudo systemctl restart racecoordinatorai-kiosk`).*

### Stappen voor probleemoplossing
1. **Bedrijfsmodus en audio-uitgang controleren**:
   - **Kiosk Display-modus**: Audio wordt rechtstreeks vanaf de Uno Q afgespeeld via de USB-C DisplayPort/HDMI-verbinding naar uw tv/monitor of aangesloten USB-luidsprekers.
   - **Externe netwerkclient**: Als u Race Coordinator AI bekijkt vanaf een laptop, tablet of smartphone via het lokale netwerk (`http://<hostname>:7070`), worden audio en TTS afgespeeld via **de browser en luidsprekers van dat apparaat**, niet via het Uno Q-bord.
2. **Hardware-audio-uitgang controleren**:
   Voer een geluidstest uit in de Uno Q-terminal om te controleren of de audio-uitgang actief is en niet is gedempt:
   ```bash
   speaker-test -t wav -c 2 -l 1
   ```
   Als er geen geluid klinkt, start dan `alsamixer` in de terminal om te controleren of de Master/PCM/HDMI-volumeregelaars niet zijn gedempt (`[MM]`, druk op `M` om te schakelen) en voldoende hoog staan.
3. **Spraaksynthesizers testen vanaf de opdrachtregel**:
   Controleer of eSpeak NG en Speech Dispatcher op besturingssysteemniveau functioneren:
   ```bash
   # Zuivere spraaksynthese testen
   espeak-ng "Testing speech synthesis"

   # Speech Dispatcher testen (de backend van Chromium)
   spd-say "Testing speech dispatcher"
   ```
   Als `spd-say` een foutmelding geeft of blijft hangen, start de daemon dan opnieuw: `pkill -f speech-dispatcher && spd-say "Hello"`.
4. **Testen in de webinterface**:
   Open in de Race Coordinator AI-webinterface **Interface aanpassen** (of **Thema-editor** $\rightarrow$ **Audio-instellingen**). Controleer het vervolgkeuzemenu **TTS-stem**: de beschikbare stemmen moeten worden weergegeven. Klik op **TTS-stem testen** om het afspelen te verifiëren.

---

## Automatische software-updates

Wanneer verbonden met wifi, controleert Race Coordinator AI automatisch GitHub Releases:
1. **App-update**: Downloadt het nieuwe Linux ARM64-pakket op de achtergrond.
2. **Herstart van de service**: Herstart `racecoordinatorai.service` naadloos via systemd.
3. **MCU Sketch Sync**: Flasht de firmware van de STM32-microcontroller automatisch opnieuw met behulp van `arduino-cli` als `racecoordinatorai_sketch.ino` is bijgewerkt.

> [!TIP]
> Als u een `.tar.gz`-release-archief heeft gedownload via de link **Update downloaden** in de browser, raadpleegt u hierboven [Een bestaande installatie handmatig bijwerken](#een-bestaande-installatie-handmatig-bijwerken-vanuit-gedownload-archief) om de update toe te passen.

