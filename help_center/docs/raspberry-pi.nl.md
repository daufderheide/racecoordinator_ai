# Raspberry Pi-installatiegids (Experimenteel)

Deze handleiding legt uit hoe u **Race Coordinator AI (RC AI)** installeert en configureert op een **Raspberry Pi**-singleboardcomputer met behulp van een twee-borden-architectuur.

---

> [!NOTE] Experimentele hardwareconfiguratie
> Hoewel de Linux ARM64-hoofdtoepassing van Race Coordinator AI native en soepel draait op 64-bits Raspberry Pi OS, is de werking op een Raspberry Pi geclassificeerd als **experimenteel**. In tegenstelling tot de geïntegreerde dual-core architectuur van de Arduino Uno Q (die zowel een applicatie-MPU als een speciale realtime STM32-microcontroller op één printplaat verenigt), vereist een Raspberry Pi-opstelling een **externe USB-microcontroller** (zoals een Arduino Uno, Nano, Mega of RP2040) om baansensoren en baanrelais aan te sturen.

---

## Architectuur: Waarom een opstelling met twee borden?

Om te begrijpen waarom Race Coordinator AI op een Raspberry Pi twee borden gebruikt, is het nuttig om het verschil te zien tussen computertaken voor algemeen gebruik en deterministische realtime hardwaretiming:

```
┌────────────────────────────────────────────────────────┐
│           Raspberry Pi 4 / 5 (Hostcomputer)            │
│                                                        │
│  - 64-bits Raspberry Pi OS (Debian Linux)              │
│  - Java 21-serverruntime & SQLite-database             │
│  - Webapplicatieserver (Poort 7070)                    │
│  - Volledig scherm Chromium-kioskweergave (HDMI naar TV│
└───────────────────────────┬────────────────────────────┘
                            │ Seriële USB-verbinding
                            │ (/dev/ttyACM0 of /dev/ttyUSB0)
┌───────────────────────────▼────────────────────────────┐
│      Externe microcontroller (Arduino Uno / Nano)      │
│                                                        │
│  - Realtime firmware (racecoordinatorai_sketch.ino)    │
│  - Interruptverwerking met microseconde-precisie       │
│  - 5V-tolerante sensoringangen (Fototransistors / IR)  │
│  - Baanstroomrelais & Chaostoetsen                     │
└────────────────────────────────────────────────────────┘
```

### Waarom niet rechtstreeks de GPIO-pinnen van de Raspberry Pi gebruiken?

1. **Jitter door Linux-kernelscheduling**:
   Raspberry Pi OS is een 'preemptive' multitasking-besturingssysteem voor algemeen gebruik. De Linux-kernel schakelt processortijd voortdurend om tussen achtergrondtaken, netwerkverkeer, grafische weergave en systeemdiensten. Dit introduceert niet-deterministische planningsvertragingen ("jitter") van doorgaans **5 tot 30 milliseconden**. Bij slotracen passeert een lichte raceauto een optische sensor of dead strip op hoge snelheid, waardoor een elektrisch signaal ontstaat dat slechts **1 tot 5 milliseconden** duurt. Rechtstreekse GPIO-polling of user-space interrupts in Linux leiden onvermijdelijk tot gemiste ronden en onnauwkeurige rondetijden op honderdsten van een seconde.
2. **Elektrische spanning & overspanningsbeveiliging**:
   De 40-pins GPIO-header van de Raspberry Pi werkt uitsluitend met **3,3V-logica** en heeft geen ingebouwde overspanningsbeveiliging. Rechtstreekse verbinding met baanbedrading brengt een ernstig risico op beschadiging van de Pi met zich mee door 5V-lichtsensoren, inductieve pieken van relaisspoelen of 12V–18V tegen-EMK van de motoren van de slotcars.
3. **De oplossing met twee borden**:
   Door de Raspberry Pi te koppelen aan een voordelige USB-microcontroller (zoals een Arduino Uno R3/R4, Nano, Mega 2560 of Raspberry Pi Pico met Arduino-firmware), combineert u het beste van twee werelden:
   - De **microcontroller** draait bare-metal realtime firmware met sub-milliseconde hardware-interrupts en robuuste 5V-spanningstolerantie.
   - De **Raspberry Pi** fungeert als krachtige hostcomputer voor de Java 21-server, SQLite-database, netwerkcommunicatie, spraaksynthese en HDMI-schermweergave.

---

## Hardwarevereisten & Geheugenvarianten

### 1. Raspberry Pi-singleboardcomputer

* **Ondersteunde modellen**: **Raspberry Pi 4 Model B** of **Raspberry Pi 5** (64-bits ARM Cortex-A72 of Cortex-A76).
* **Besturingssysteem**: **Raspberry Pi OS (64-bit)** is vereist. De 32-bits versie wordt niet ondersteund.
* **Opslag**: Snelle microSD-kaart van 16 GB of groter (klasse A1 of A2 aanbevolen) of een USB 3.0-SSD.
* **Voeding**: Officiële Raspberry Pi USB-C-voeding (15W voor Pi 4, 27W voor Pi 5) om stroomtekorten en 'throttling' te voorkomen.

### 2 GB versus 4 GB / 8 GB RAM

| Model | Aanbevolen bedrijfsmodus | Beschrijving |
| :--- | :--- | :--- |
| **Raspberry Pi (2 GB RAM)** | **Modus zonder scherm (Headless)** | Ideaal voor gebruik als dedicated baanserver zonder aangesloten beeldscherm. Rijders en wedstrijdleiders bekijken de interface via wifi/LAN op tablets, iPads, smartphones of laptops (`http://<pi-ip>:7070`). Het uitschakelen van de lokale Chromium-kioskbrowser bespaart werkgeheugen voor de server en database. |
| **Raspberry Pi (4 GB of 8 GB RAM)** | **Kioskweergavemodus** *(Aanbevolen)* | Aanbevolen bij het rechtstreeks aansluiten van een HDMI-scherm of tv op de Pi. Voert tegelijkertijd de volledige desktop, de Chromium-kioskbrowser op volledig scherm, de Java-runtime en de database uit met uitstekende reactiesnelheid. |

### 2. Externe timing-microcontroller

Een extern bord waarop de Race Coordinator AI-firmware draait:

* **Aanbevolen borden**:
  * **Arduino Uno R3 of R4**
  * **Arduino Nano (ATmega328P)**
  * **Arduino Mega 2560** (ideaal voor 4- of 6-baans banen met veel sensoraansluitingen)
  * **Raspberry Pi Pico / Pico 2 (RP2040)** met Arduino-firmware
* **USB-kabel**: Standaard USB-kabel om de microcontroller op een willekeurige USB-poort van de Raspberry Pi aan te sluiten.
* **Baansensoren & Relais**: Aangesloten op de microcontroller zoals beschreven in de **[Baanconfiguratiehandleiding](track-editor.nl.md)**.

---

## Stapsgewijze installatie

### Stap 1: Raspberry Pi OS (64-bits) installeren

1. Download en open de **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** op uw pc of Mac.
2. Selecteer uw Raspberry Pi-model (Pi 4 of Pi 5).
3. Kies bij **Besturingssysteem** voor **Raspberry Pi OS (64-bit)** (Debian Bookworm of Bullseye).
4. Klik op **Instellingen bewerken** (tandwielicoon) voor de voorconfiguratie:
   * **Hostnaam**: Geef een herkenbare naam op (bijv. `racecoordinator` of `slotcar-pi`).
   * **Gebruikersnaam en wachtwoord**: Maak een gebruikersaccount aan (bijv. gebruiker `pi`).
   * **Draadloos LAN**: Voer de SSID en het wachtwoord van uw wifi-netwerk in.
   * **Services**: Vink **SSH inschakelen** aan (met wachtwoord of publieke sleutel).
5. Selecteer uw microSD-kaart of SSD en klik op **Schrijven**.

### Stap 2: Microcontroller-firmware flashen

Voordat u de Arduino op de Raspberry Pi aansluit:

1. Download het nieuwste Race Coordinator AI-releasepakket op uw computer of zoek `racecoordinatorai_sketch.ino` op in het archief in de map `firmware/`.
2. Open de sketch in de **Arduino IDE** op uw computer.
3. Selecteer het bordtype (bijv. *Arduino Uno* of *Arduino Nano*) en de seriële poort.
4. Klik op **Uploaden** om de firmware te compileren en naar het bord te schrijven.
5. Koppel de microcontroller los van uw computer en sluit deze aan op een USB-poort van de Raspberry Pi. Het bord wordt automatisch herkend als serieel apparaat (doorgaans `/dev/ttyACM0` of `/dev/ttyUSB0`).

### Stap 3: Vereisten op de Raspberry Pi installeren

Start de Raspberry Pi op en maak verbinding via SSH vanuit de terminal van uw computer:

```bash
ssh pi@<hostname>.local
# Of verbind via het IP-adres van de Pi:
# ssh pi@192.168.1.xxx
```

Pakketlijsten bijwerken en Java, spraakondersteuning, de browser en vensterbeheer installeren:

```bash
sudo apt-get update
sudo apt-get install -y default-jre-headless espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip chromium-browser wmctrl
```

*(Opmerking: Op nieuwere Debian/Raspberry Pi OS Bookworm-versies heet het browserpakket `chromium` in plaats van `chromium-browser`. Als `chromium-browser` niet wordt gevonden, installeert u `chromium`).*

### Stap 4: Geautomatiseerd installatieprogramma downloaden en uitvoeren

1. Zet het Linux ARM64-releasearchief over naar uw Raspberry Pi:
   ```bash
   # Vanaf de terminal van uw pc / Mac:
   scp release/RaceCoordinatorAI-Linux-ARM64.tar.gz pi@<hostname>.local:~/
   ```
   *(U kunt het bestand ook rechtstreeks downloaden op de Pi met `curl` of `wget` via het [Downloadportaal](downloads.nl.md)).*

2. Pak het archief uit en open de installatiemap:
   ```bash
   tar -xzf ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
   cd RaceCoordinator_Linux_ARM64
   ```

3. Voer het installatieprogramma uit met `sudo`:
   ```bash
   sudo ./install.sh
   ```

#### Automatische hardwareherkenning & configuratieoverzicht

Het installatieprogramma leest `/proc/device-tree/model` en herkent automatisch dat het op een Raspberry Pi draait:

- **Platformbepaling**: Stelt `Hardware Platform: pi` in.
- **Serviceaccount**: Wijst bestandsbeheer en services toe aan de uitvoerende gebruiker (bijv. `pi`), configureert systemd-services en kent seriële groepsrechten toe (`dialout`).
- **Firmware-upload**: Slaat het compileren en uploaden van de Zephyr-firmware voor de Arduino Uno Q automatisch over, aangezien op de Raspberry Pi een externe USB-Arduino wordt gebruikt.

Voordat bestanden worden gekopieerd of services worden gewijzigd, toont het installatieprogramma de samenvatting:

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

#### Opdrachtregelopties van het installatieprogramma

U kunt de installatie aanpassen met optionele argumenten:

| Argument | Beschrijving | Standaardwaarde |
| :--- | :--- | :--- |
| `--board=<pi\|unoq\|generic>` | Doel-hardwareplatform expliciet instellen. | Automatisch gedetecteerd via `/proc/device-tree/model` (`pi`) |
| `--user=<gebruikersnaam>` | Linux-gebruikersaccount voor `/opt/racecoordinatorai` en services. | Automatisch bepaald via `$SUDO_USER` (standaard `pi` op Raspberry Pi) |
| `--skip-sketch`, `--skip-mcu` | Compilatie/upload van de microcontrollersketch expliciet overslaan. | Automatisch overgeslagen op `pi` |
| `-v`, `--verbose` | Uitgebreide logboekregistratie inschakelen. | Standaarduitvoer (`false`) |
| `-h`, `--help` | Help en beschikbare opties weergeven. | - |

---

## Bedrijfsmodi: Kiosk versus Zonder Scherm (Headless)

### 1. Kioskweergavemodus (Pi van 4 GB / 8 GB)

Standaard activeert het installatieprogramma twee systemd-achtergrondservices:

1. `racecoordinatorai.service`: De backend-Java-server en de ingebouwde SQLite-database.
2. `racecoordinatorai-kiosk.service`: Een Chromium-sessie op volledig scherm die start op het primaire HDMI-scherm op `http://localhost:7070`.

Als er een tv of monitor op de HDMI-poort van de Pi is aangesloten, start Race Coordinator AI automatisch bij het opstarten in de kioskmodus op volledig scherm.

### 2. Modus zonder scherm (Headless) (Pi van 2 GB of dedicated server)

Als u een **2 GB Raspberry Pi** gebruikt of de Pi onder de baan is gemonteerd zonder aangesloten beeldscherm, schakelt u de kioskservice uit:

```bash
# De grafische kioskbrowser stoppen en permanent uitschakelen:
sudo systemctl disable --now racecoordinatorai-kiosk.service
```

Wanneer de kioskservice is uitgeschakeld:

- Verbruikt de backendserver slechts minimaal werkgeheugen (~250–350 MB RAM).
- Kunt u vanaf elk apparaat op hetzelfde wifi- of bekabelde netwerk verbinding maken via de browser:
  ```text
  http://<raspberry-pi-ip>:7070
  # Voorbeeld: http://192.168.1.150:7070 of http://racecoordinator.local:7070
  ```

---

## De baaninterface in Race Coordinator AI configureren

Zodra de server actief is, configureert u de seriële verbinding met de externe microcontroller:

1. Open de webinterface in uw browser (`http://localhost:7070` of `http://<pi-ip>:7070`).
2. Navigeer naar **Baanbeheer** → **Baan bewerken**.
3. Kies het tabblad **Hardwareschnittstellen**:
   * **Interfacetype**: Selecteer **Arduino**.
   * **Poort**: Selecteer `/dev/ttyACM0` of `/dev/ttyUSB0` (de USB-poort van uw Arduino).
   * **Baudrate**: `115200`.
4. Klik op **Verbinden / Interface testen** om de communicatie te controleren.
5. Wijs de baansensoren, chaostoetsen en baanrelais toe aan de corresponderende Arduino-pinnen.
6. Klik op **Baan opslaan**.

---

## Systemd-services beheren

Beheer de achtergrondservices met standaard `systemctl`-opdrachten:

```bash
# Serverstatus controleren en live logs bekijken:
sudo systemctl status racecoordinatorai.service
journalctl -u racecoordinatorai.service -f

# Applicatie herstarten:
sudo systemctl restart racecoordinatorai.service

# Status van de kioskbrowser controleren (indien ingeschakeld):
sudo systemctl status racecoordinatorai-kiosk.service
```

---

## Een bestaande installatie bijwerken

Het bijwerken van Race Coordinator AI op een Raspberry Pi behoudt al uw gegevens:

* **Gegevensbehoud**: Uw database (`racecoordinator.db`), raceresultaten, rijdersprofielen en aangepaste thema's blijven bewaard in `/home/<gebruiker>/.racecoordinatorai/` en worden nooit overschreven.
* **In-App automatische update**: Wanneer er een nieuwe versie beschikbaar is, klikt u op **Nu installeren** in de meldingsbalk. Het script `/opt/racecoordinatorai/scripts/update_app.sh` herkent de Raspberry Pi automatisch en slaat het uploaden van de sketch over.
* **Handmatige update**: Download het nieuwe `.tar.gz`-bestand en voer uit:
  ```bash
  sudo /opt/racecoordinatorai/scripts/update_app.sh ~/RaceCoordinatorAI-Linux-ARM64.tar.gz
  ```
