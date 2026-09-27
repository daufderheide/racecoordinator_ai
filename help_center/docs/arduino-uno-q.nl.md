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
2. **Headless Appliance-modus (Momenteel niet ondersteund - beschikbaar op verzoek)**: Het bord voert uitsluitend de backendserver uit en maakt verbinding met de baanhardware, zonder dat er een lokale monitor of browser actief is. Gebruikers hebben toegang tot de webinterface via het lokale netwerk (`http://uno-q.local:7070`). Zoals hierboven vermeld, wordt de headless-modus op de Uno Q momenteel niet standaard ondersteund, maar kan deze op verzoek worden toegevoegd als de Uno Q een netwerkverbinding heeft.

---

## Stapsgewijze installatie

### Stap 1: Het bord voorbereiden en verbinden via SSH
1. Installeer **Arduino Linux OS** (Debian 12 arm64) op de Uno Q.
2. Verbind het bord met uw lokale netwerk via wifi of ethernet.
3. Open een SSH-sessie:
   ```bash
   ssh arduino@uno-q.local
   ```

### Stap 2: Vereisten installeren
Installeer OpenJDK 11, `arduino-cli`, weergavehulpprogramma's en Chromium:
```bash
sudo apt-get update
sudo apt-get install -y openjdk-11-jre-headless espeak-ng alsa-utils git curl unzip xorg nodm chromium-browser
```

### Stap 3: Microcontroller-firmware flashen (met FastLED-ondersteuning)
Compileer en upload de hardwaresketch naar de ingebouwde STM32-MCU:
```bash
# STM32-bordcore installeren in arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:stm32

# racecoordinatorai_sketch compileren en uploaden
cd /opt/racecoordinatorai/arduino/racecoordinatorai_sketch
arduino-cli compile --fqbn arduino:stm32:uno_q .
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q .
```

### Stap 4: Applicatiepakket & Systemd-services installeren
1. Download `RaceCoordinatorAI-Linux-ARM64.tar.gz` en pak het uit naar `/opt/racecoordinatorai`:
   ```bash
   sudo mkdir -p /opt/racecoordinatorai
   sudo tar -xzf RaceCoordinatorAI-Linux-ARM64.tar.gz -C /opt/racecoordinatorai/
   sudo chown -R arduino:arduino /opt/racecoordinatorai
   ```
2. Voer het installatiescript uit:
   ```bash
   cd /opt/racecoordinatorai
   sudo ./install.sh
   ```

3. Start de services:
   ```bash
   # Start de backend-server
   sudo systemctl start racecoordinatorai

   # (Optioneel) Lokale schermkiosk inschakelen op USB-C DisplayPort
   sudo systemctl enable --now racecoordinatorai-kiosk
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
