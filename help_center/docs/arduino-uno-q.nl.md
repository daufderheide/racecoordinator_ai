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

## Een bestaande installatie bijwerken { #updating-an-existing-installation }

Zodra Race Coordinator AI is geïnstalleerd en operationeel is op uw Arduino Uno Q, is het eenvoudig om het systeem up-to-date te houden met nieuwe functies, bugfixes en firmware-verbeteringen. Afhankelijk van of uw bord is verbonden met het netwerk of volledig offline op het circuit draait, kiest u de gewenste updatemethode:

- **[Bijwerken met een netwerkverbinding (Aanbevolen)](#bijwerken-met-een-netwerkverbinding)**: Volautomatische achtergrond-updates die rechtstreeks vanuit de webinterface worden geconfigureerd.
- **[Bijwerken zonder netwerkverbinding (Offline via USB)](#bijwerken-zonder-netwerkverbinding)**: Een release-archief via een USB-stick naar het bord kopiëren en lokaal bijwerken.

---

### Bijwerken met een netwerkverbinding { #bijwerken-met-een-netwerkverbinding }

Als uw Arduino Uno Q is verbonden met uw lokale netwerk en toegang heeft tot internet (via Wi-Fi of Ethernet), kunt u profiteren van automatische achtergrond-updates rechtstreeks vanuit de webinterface van Race Coordinator AI:

1. **Automatische updates inschakelen in de webinterface**:
   - Navigeer in Race Coordinator AI naar **Opties → Automatische updates** in Racedag-instellingen of via de bovenste menubalk.
   - Kies uw gewenste releasekanaal:
     - **🟢 Officiële / Productiereleases**: Volledig gevalideerde, stabiele releases aanbevolen voor standaard raceactiviteiten en clubevenementen waarbij maximale operationele stabiliteit voorop staat.
     - **🟡 Bètareleases**: Functie-complete preview-releases die tijdens actieve ontwikkelingscycli worden gepubliceerd voor communitytests en verificatie op de racebaan. Aanbevolen om nieuwe functies te testen en feedback te geven vóór de officiële release.
     - **🔵 Dagelijkse Alpha-builds**: Geautomatiseerde dagelijkse builds van de actieve ontwikkelingstak met de allernieuwste functies.
   - Voor een uitgebreide uitleg van de releasekanalen en hoe versies worden gepromoveerd, raadpleegt u het gedeelte [Releasekanalen & Automatische Updates](downloads.nl.md#release-channels) in het Helpcentrum.

2. **Hoe automatische updates werken op de Arduino Uno Q**:
   Wanneer een update wordt gedetecteerd voor uw geconfigureerde kanaal:
   - **Downloaden op de achtergrond**: Het bord downloadt het nieuwe Linux ARM64-pakket (`RaceCoordinatorAI-Linux-ARM64*.tar.gz`) op de achtergrond zonder actieve racesessies te onderbreken.
   - **Service herstarten**: De updater pakt de nieuwe release uit over `/opt/racecoordinatorai` en herstart `racecoordinatorai.service` (en het kiosk-display) naadloos via `systemctl`.
   - **MCU-sketch-synchronisatie**: Als de nieuwe release updates bevat voor de realtime microcontroller-firmware (`racecoordinatorai_sketch.ino`), hercompileert het updateprogramma de sketch automatisch en flasht de firmware opnieuw naar de STM32-microcontroller via de interne netwerkbrug met `arduino-cli`.
   - Alle racegeschiedenis, baanconfiguraties, aangepaste layouts, coureurslijsten en uw SQLite-database blijven volledig behouden.

3. **Handmatige controle op updates**:
   Zelfs als automatische updates zijn uitgeschakeld of op handmatig zijn ingesteld, kunt u op elk gewenst moment een directe controle uitvoeren door in het menu van de webinterface op **Controleren op updates** te klikken.

---

### Bijwerken zonder netwerkverbinding { #bijwerken-zonder-netwerkverbinding }

Als uw Arduino Uno Q volledig offline op het circuit wordt gebruikt zonder internetverbinding, kunt u de installatie eenvoudig handmatig bijwerken met een standaard USB-stick.

#### Stap 1: Het updatepakket via USB overbrengen naar het bord

1. **Het releasepakket downloaden op een computer met internet**:
   Open op een computer met internettoegang (Mac, Windows of Linux) het [Download- & releaseportaal](downloads.nl.md) of de [GitHub Releases](https://github.com/daufderheide/racecoordinator_ai/releases) pagina en download het Linux ARM64-pakket:
   - Bestandsformaat: `RaceCoordinatorAI-Linux-ARM64.tar.gz` (of met versienummer: `RaceCoordinatorAI-Linux-ARM64_v*.tar.gz`).
2. **Kopiëren naar een USB-stick**:
   Kopieer het gedownloade `.tar.gz`-bestand naar een standaard FAT32- of exFAT-geformatteerde USB-stick.
3. **De USB-stick aansluiten op de Uno Q**:
   Steek de USB-stick in een van de beschikbare USB-poorten van de Arduino Uno Q.
4. **Het bestand naar het bord kopiëren**:
   - **Via de desktop-interface**: Open het bestandsbeheer op het bureaublad van de Uno Q, selecteer de gekoppelde USB-stick in de zijbalk en kopieer het `.tar.gz`-archief naar uw map `~/Downloads/` (of persoonlijke map `~/`).
   - **Via de terminal / SSH**: Het systeem koppelt USB-opslagmedia automatisch onder `/media/arduino/<STATIONNAAM>` (of koppel het handmatig met `sudo mount /dev/sda1 /mnt`). Kopieer het bestand naar uw lokale map:
     ```bash
     cp /media/arduino/*/RaceCoordinatorAI-Linux-ARM64*.tar.gz ~/Downloads/
     ```
     *(Als uw laptop rechtstreeks via een ethernetkabel of een lokale Wi-Fi-router zonder internet met het bord is verbonden, kunt u het bestand ook overbrengen via `scp`: `scp RaceCoordinatorAI-Linux-ARM64*.tar.gz arduino@<hostname>:~/Downloads/`).*

#### Stap 2: De update toepassen

Zodra het `.tar.gz`-archief op het bord staat (bijvoorbeeld in `~/Downloads/`), kiest u een van de volgende drie methoden om de update toe te passen:

##### Optie 1: Ingebouwd update-helperscript (Snelste & Aanbevolen)
Race Coordinator AI bevat een kant-en-klaar updatescript op locatie op `/opt/racecoordinatorai/scripts/update_app.sh`. Dit script stopt automatisch de actieve services, pakt de nieuwe release uit over `/opt/racecoordinatorai`, hercompileert en flasht de microcontroller-firmware indien bijgewerkt, stelt de juiste bestandsrechten in en start alle services opnieuw:
```bash
sudo /opt/racecoordinatorai/scripts/update_app.sh ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz
```
*(Alle databaserecords, racegegevens, aangepaste UI-layouts en gebruikersinstellingen blijven automatisch behouden).*

##### Optie 2: `install.sh` uit het updatepakket uitpakken en uitvoeren
U kunt het gedownloade releasepakket uitpakken in een tijdelijke map en het meegeleverde `install.sh` uitvoeren. Het installatieprogramma detecteert de bestaande installatie in `/opt/racecoordinatorai`, werkt de toepassingsbestanden bij, flasht de microcontroller-firmware opnieuw en herstart de systemd-services:
```bash
# Gedownload archief uitpakken
tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz

# Installer over bestaande installatie uitvoeren (behoudt database & instellingen)
cd RaceCoordinator_Linux_ARM64
sudo ./install.sh
```

##### Optie 3: Handmatig bijwerken via Linux-opdrachten (Zonder helperscripts)
Als u de update liever volledig handmatig uitvoert zonder gebruik te maken van de meegeleverde scripts, voert u de volgende opdrachten uit in de terminal:

1. **Actieve services stoppen**:
     ```bash
     sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai
     ```
2. **Bijgewerkte bestanden uitpakken over `/opt/racecoordinatorai`**:
     ```bash
     sudo tar -xzf ~/Downloads/RaceCoordinatorAI-Linux-ARM64*.tar.gz -C /opt/racecoordinatorai/ --strip-components=1
     ```
     *(Opmerking: Dit werkt de programmabestanden, webclientbestanden en scripts bij, terwijl uw SQLite-database en aangepaste bestanden onaangeroerd blijven).*
3. **Juiste bestandseigendom en machtigingen verifiëren**:
     ```bash
     sudo chown -R arduino:arduino /opt/racecoordinatorai
     ```
4. **Microcontroller-firmware opnieuw compileren en flashen (als de sketch is bijgewerkt)**:
     ```bash
     cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
     arduino-cli compile --fqbn arduino:zephyr:unoq .
     arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
     ```
5. **De server- en kiosk-services opnieuw starten**:
     ```bash
     sudo systemctl restart racecoordinatorai
     sudo systemctl restart racecoordinatorai-kiosk
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

### Browserparameters in kioskmodus en navigatie met meerdere tabbladen
In de kioskmodus wordt Chromium gestart via `/opt/racecoordinatorai/scripts/start_kiosk.sh`. Race Coordinator AI gebruikt `--start-maximized` (in plaats van het restrictieve `--kiosk`) om ervoor te zorgen dat secundaire tabbladen —zoals Heatresultaten, Raceresultaten, themaweergaven en het offline Helpcentrum— zichtbaar en toegankelijk blijven via de tabbladenbalk bovenaan het tv-scherm. Chromium vereist ook specifieke parameters om Speech Dispatcher en automatisch afspelen van audio in te schakelen. Zorg ervoor dat uw script `start_kiosk.sh` het volgende bevat:
```bash
  --start-maximized \
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

