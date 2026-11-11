# Installatiehandleiding

Deze handleiding leidt u stap voor stap door het downloaden, installeren en configureren van Race Coordinator AI op uw computer.

---

## Ondersteunde Besturingssystemen

Race Coordinator AI is volledig platformonafhankelijk en draait op zowel moderne als oudere besturingssystemen:

| Platform | Ondersteunde Versies | Aanbevolen Installatieprogramma |
| :--- | :--- | :--- |
| **🪟 Windows (Modern)** | Windows 10, Windows 11 (64-bits & 32-bits) | **Online Setup** (`RaceCoordinatorAI_Online_Setup_*.exe`) |
| **🪟 Windows (Ouder)** | Windows 8, Windows 7, Windows XP | **Offline Volledige Setup** (`RaceCoordinatorAI_Offline_Setup_*.exe`) *(Vereist voor eerste installatie op Win 8 en ouder)* |
| **🍏 macOS** | macOS 10.15 (Catalina) tot en met macOS 15+ (Intel & Apple Silicon) | **Schijfkopie** (`RaceCoordinator_Mac_*.dmg`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q** | Raspberry Pi OS (64-bits), Arduino Linux OS, Debian, Ubuntu | **ARM64 / Linux-Pakket** (`RaceCoordinatorAI-Linux-ARM64_*.tar.gz`) |

---

## Uw Releasekanaal Kiezen

Race Coordinator AI wordt verspreid via drie kanalen:

* **🟢 Officiële Stabiele Releases** *(Aanbevolen)*: Volledig geteste, stabiele builds aanbevolen voor regelmatig racen, thuisbanen en clubwedstrijden.
* **🟡 Beta Previews**: Voorlopige versies met aankomende functies, nieuwe hardwaredrivers en experimentele verbeteringen voor feedback van de community.
* **🔵 Alpha / Nightly Builds**: Automatische momentopnames vanuit actieve softwareontwikkeling.

👉 Bezoek het **[Download- en Releaseportaal](downloads.nl.md)** om elke gewenste versie te downloaden of het volledige archief te bekijken.

---

## 🪟 Installatie op Windows

### 1. Het Installatieprogramma Downloaden
* Voor **Windows 10 / 11**: Download `RaceCoordinatorAI_Online_Setup_*.exe`.
* Voor **Windows 8 en ouder** (of pc's zonder actieve internetverbinding): Download `RaceCoordinatorAI_Offline_Setup_*.exe`.

### 2. Het Installatieprogramma Uitvoeren
1. Dubbelklik op het gedownloade `.exe`-bestand.
2. Als Windows SmartScreen de melding *"Windows heeft uw pc beschermd"* toont, klikt u op **Meer informatie** en vervolgens op **Toch uitvoeren**.
3. Volg de stappen in de Inno Setup-wizard om uw installatiemap te kiezen (standaard: `C:\Program Files\RaceCoordinator AI`).
4. Kies of u een bureaubladicoon wilt aanmaken.
5. Klik op **Installeren** om de installatie te voltooien.

### 3. Starten
Dubbelklik op de snelkoppeling **Race Coordinator AI** op uw bureaublad of open de app vanuit het Windows Startmenu.

!!! note "Vereisten voor Oudere Windows-versies (XP / 7 / 8)"
    Zorg er bij Windows 7, 8 of XP voor dat het [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784) pakket is geïnstalleerd.

---

## 🍏 Installatie op macOS

### 1. De Schijfkopie Downloaden
Download `RaceCoordinator_Mac_*.dmg` van de releasepagina.

### 2. Installeren in de Map Programma's
1. Dubbelklik op het gedownloade bestand `RaceCoordinator_Mac_*.dmg` om de schijfkopie te openen.
2. Sleep het icoon **Race Coordinator AI** naar uw map **Programma's** (Applications).
3. Verwijder de schijfkopie (Eject).

### 3. Eerste Keer Starten en macOS-beveiliging
1. Open uw map **Programma's** en dubbelklik op **Race Coordinator AI**.
2. Als macOS meldt dat de app niet kan worden geopend omdat deze afkomstig is van een niet-geïdentificeerde ontwikkelaar:
   - Open **Systeeminstellingen** → **Privacy en beveiliging**.
   - Scrol omlaag naar de sectie **Beveiliging** en klik naast Race Coordinator AI op **Toch openen**.
   - U kunt ook de `Control`-toets ingedrukt houden terwijl u op het app-icoon klikt en **Open** kiezen.

---

## 🐧 Installatie op Linux, Raspberry Pi en Arduino Uno Q

Voor speciale hardware-appliances met geautomatiseerde systemd-achtergrondservices, kioskweergave en hardware-interfaces raadpleegt u onze gespecialiseerde handleidingen:

* **[Arduino UNO Q Installatiegids](arduino-uno-q.nl.md)**: Kant-en-klare installatie voor de Arduino Uno Q dual-core appliance met ingebouwde realtime STM32-microcontroller.
* **[Raspberry Pi Installatiegids (Experimenteel)](raspberry-pi.nl.md)**: Handleiding voor Raspberry Pi 4 / 5 in een twee-borden-architectuur gekoppeld aan een externe USB Arduino-microcontroller.

### 1. Het Linux-pakket Downloaden
Download `RaceCoordinatorAI-Linux-ARM64_*.tar.gz` van de downloadpagina.

### 2. Uitpakken en Uitvoeren
1. Open een terminal en pak het archief uit in de gewenste map:
   ```bash
   tar -xzf RaceCoordinatorAI-Linux-ARM64_*.tar.gz
   cd RaceCoordinatorAI
   ```
2. Zorg ervoor dat het startscript uitvoerrechten heeft:
   ```bash
   chmod +x RaceCoordinatorAI
   ```
3. Start de applicatie:
   ```bash
   ./RaceCoordinatorAI
   ```

---

## Eerste Keer Starten & Aan de Slag

Wanneer u Race Coordinator AI voor het eerst start:

1. **Standaarddatabase**: De applicatie initialiseert automatisch een ingebouwde SQLite-database (`racecoordinator.db`) gevuld met voorbeeldrijders, teams, een standaard 4-baans baan en standaard raceformats (Iedereen-tegen-iedereen, Vrije training).
2. **Toetsenbord Demonstratiemodus**: U kunt direct racemodi verkennen en uitproberen via toetsenbordinvoer zonder fysieke baanhardware aan te sluiten.
3. **Baansensoren Configureren**: Navigeer naar **Baanbeheer** → **Baan bewerken** om uw interfacehardware in te stellen (Arduino Uno / Uno Q, Phidget, Trak-Mate of rondetiming via webcam).

---

## Bestaande Installaties Bijwerken

Het bijwerken naar een nieuwere versie van Race Coordinator AI verloopt zonder gegevensverlies:

* **Uw Gegevens Blijven Behouden**: Uw database (`racecoordinator.db`), racestatistieken, rijdersprofielen, baanconfiguraties en aangepaste thema's worden opgeslagen in de gebruikersmap en worden **niet** overschreven tijdens een update.
* **Bijwerken op Windows**: Voer eenvoudig het nieuw gedownloade installatieprogramma uit over de bestaande installatie, of klik op **Nu installeren** in de meldingsbalk binnen de app.
* **Bijwerken op Linux / Arduino Uno Q / Raspberry Pi**: Voer `sudo /opt/racecoordinatorai/scripts/update_app.sh /pad/naar/RaceCoordinatorAI-Linux-ARM64*.tar.gz` uit of pak het archief uit en voer `sudo ./install.sh` uit. Zie de [Arduino UNO Q Gids](arduino-uno-q.nl.md#een-bestaande-installatie-bijwerken) of de [Raspberry Pi Gids](raspberry-pi.nl.md#een-bestaande-installatie-bijwerken) voor gedetailleerde stappen.

---

## Problemen Melden & Feedback

Als u problemen ondervindt tijdens de installatie of suggesties heeft:

1. Bezoek ons **[GitHub Issues Portaal](https://github.com/daufderheide/racecoordinator_ai/issues)**.
2. Doorzoek bestaande meldingen om te zien of er al een oplossing beschikbaar is.
3. Klik op **New Issue** en vermeld:
   * Uw besturingssysteem en versie.
   * Race Coordinator AI-versie (bijv. `v1.0.0` of `v1.0.0-beta.1`).
   * Stappen om het probleem te reproduceren en schermafbeeldingen/logbestanden indien van toepassing.
