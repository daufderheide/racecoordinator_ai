# Installatiehandleiding Arduino UNO Q

Deze handleiding legt uit hoe u **Race Coordinator AI (RC AI)** instelt op het **Arduino UNO Q** hybride ontwikkelbord als een zelfstandig hardware-apparaat.

---

## Hardware-overzicht en geheugenvarianten

De **Arduino UNO Q** combineert een 64-bits Linux Single Board Computer (SBC) met een real-time microcontroller op één enkel bord:

- **Linux MPU (Qualcomm Cortex-A53 @ 2,0 GHz)**: Voert de Race Coordinator AI-server, SQLite-database, webclient-server en automatische updater uit.
- **Real-Time MCU (STM32U585 Cortex-M33 @ 160 MHz)**: Beheert ronde-sensor pin-interrupts, vermogensrelais en FastLED RGB-lichtbruggen met sub-milliseconde nauwkeurigheid.
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

### Stap 1: Het bord voorbereiden en verbinden via SSH
1. Installeer **Arduino Linux OS** (Debian 12 arm64) op de Uno Q.
2. Verbind het bord met uw lokale netwerk via wifi of ethernet:
   * **Wifi-configuratie bij de eerste keer opstarten**: Bij het eerste opstarten vraagt de installatiewizard om de configuratie van het draadloze netwerk.
   * **Opmerking over de eerste verbinding**: De wifi-verbinding wordt mogelijk niet direct na het invoeren actief en handmatige terminalopdrachten zoals `sudo nmcli dev wifi connect "Uw_SSID" password "Uw_Wachtwoord"` kunnen bij het eerste opstarten eveneens mislukken. Voer in dat geval eenvoudig `sudo reboot` uit. Na het opnieuw opstarten initialiseert de draadloze netwerkadapter zich correct en maakt deze automatisch verbinding met uw geconfigureerde wifi-netwerk.
   * **Board- en firmware-updates toepassen**: Na het opnieuw opstarten (of wanneer het systeem hierom vraagt), wordt u mogelijk gevraagd of u verschillende pakketten en firmwarecomponenten op het bord wilt bijwerken. Het wordt ten zeerste aanbevolen om alle voorgestelde updates te accepteren en uit te voeren, aangezien de fabrieksfirmware vaak verouderd is. Houd er rekening mee dat deze initiële update enige tijd kan duren (vaak 5 tot meer dan 10 minuten, afhankelijk van de netwerksnelheid); laat dit proces ononderbroken voltooien.
3. SSH inschakelen op het bord & verbinden:
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
   * **Verbinden vanaf uw pc**: Open een terminal op uw computer en maak verbinding via de hostnaam of het IP-adres van het bord:
     ```bash
     ssh arduino@<hostname>
     # Of maak rechtstreeks verbinding via IP:
     ssh arduino@<IP_ADRES>
     ```

### Stap 2: Vereisten installeren
Installeer de Java-runtime-omgeving (`default-jre-headless`), audio-hulpprogramma's (`espeak-ng`, `alsa-utils`), `chromium` en vensterbeheer (`wmctrl`):
```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng alsa-utils git curl unzip chromium wmctrl
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
```
*(Opmerking: Meldingen zoals `tar: Ignoring unknown extended header...` zijn onschadelijke macOS-metagegevens en kunnen veilig worden genegeerd).*

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
   sudo usermod -a -G dialout arduino
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

### Stap 4: Microcontroller-firmware flashen (met FastLED-ondersteuning)
Compileer en upload de hardwaresketch naar de ingebouwde MCU:
```bash
# Gedetecteerde borden en poorten controleren
arduino-cli board list

# Zephyr-bordcore installeren in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:zephyr

# Vereiste Arduino-bibliotheken installeren (Uno Q router-bridge & FastLED)
arduino-cli lib update-index
arduino-cli lib install Arduino_RouterBridge
arduino-cli lib install FastLED

# racecoordinatorai_sketch voor de Uno Q MCU compileren
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:zephyr:unoq .

# Uploaden naar de ingebouwde MCU via de interne netwerkbrug
# (Voer het bordwachtwoord 'arduino' in wanneer gevraagd, of geef --upload-field password=arduino mee)
arduino-cli upload -p 172.17.0.1 --fqbn arduino:zephyr:unoq --upload-field password=arduino .
```
*(Opmerking: Zoals geverifieerd via `arduino-cli board list`, draait de Uno Q microcontroller Zephyr OS via de interne netwerkbrug `172.17.0.1` met FQBN `arduino:zephyr:unoq`. De bibliotheek `Arduino_RouterBridge` is vereist voor seriële communicatie via de SoC-brug. FastLED-rgb-ledstrips worden op de STM32U5 / Zephyr Cortex-M33-architectuur momenteel niet ondersteund vanwege upstream CMSIS 6-registerdefinities, maar alle kernfuncties van het circuit—rondensensoren, sectortijden, oproepknoppen en baanrelais—zijn volledig operationeel).*

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

## FastLED RGB-lichtbruginstelling

FastLED wordt volledig ondersteund op de Uno Q. Adresseerbare RGB-ledstrips (WS2812B, NeoPixel, SK6812, APA102) worden rechtstreeks aangesloten op de GPIO-headerpinnen op de STM32-MCU.

- **Startlichten**: Aftelanimatie in 5 fasen (rood $\rightarrow$ geel $\rightarrow$ groen).
- **Pitstraat / Tanken**: Real-time brandstofniveaupercentage per baan.
- **Leider & Overwinning**: Dynamische puls voor de heat-leider en finishvlag-animatie.

---

## Automatische software-updates

Wanneer verbonden met wifi, controleert Race Coordinator AI automatisch GitHub Releases:
1. **App-update**: Downloadt het nieuwe Linux ARM64-pakket op de achtergrond.
2. **Herstart van de service**: Herstart `racecoordinatorai.service` naadloos via systemd.
3. **MCU Sketch Sync**: Flasht de firmware van de STM32-microcontroller automatisch opnieuw met behulp van `arduino-cli` als `racecoordinatorai_sketch.ino` is bijgewerkt.

> [!TIP]
> Als u een `.tar.gz`-release-archief heeft gedownload via de link **Update downloaden** in de browser, raadpleegt u hierboven [Een bestaande installatie handmatig bijwerken](#een-bestaande-installatie-handmatig-bijwerken-vanuit-gedownload-archief) om de update toe te passen.

