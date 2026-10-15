# Probleemoplossing

## Verbindingsproblemen

### USB-interface Slaapstand & Verbindingsverlies Tussen Heats (Selectief Onderbreken & Energiebesparing) {: #usb-sleep-prevention }
- **Symptoom**: Tijdens pauzes tussen heats, bij het wisselen van sporen of na enkele minuten inactiviteit valt de verbinding met de interface (Phidget, Arduino, Trackmate of USB-seriële adapter) weg. Zodra de volgende heat start of auto's de sensoren activeren, herstelt de verbinding zich en verschijnt de melding: *"Interface Verbonden: De verbinding met de interface is hersteld."*
- **Oorzaak**: Moderne besturingssystemen (Windows, macOS en Linux) hanteren een agressief energiebeheer voor USB-controllers en Human Interface Devices (HID). Hoewel Race Coordinator AI voorkomt dat het totale systeem in slaapstand gaat, schakelt het besturingssysteem inactieve USB-poorten, USB-hoofdhubs en HID-apparaten zelfstandig uit (USB Selective Suspend) wanneer er korte tijd geen sensorgegevens worden verzonden.
- **Waarom dit niet automatisch via software kan worden uitgeschakeld**: Energiebeheer op hardwareniveau wordt rechtstreeks geregeld door de kernel van het besturingssysteem en de stuurprogramma's. In Windows vereist het aanpassen van hardware-energie-instellingen beheerdersrechten (UAC) en wijzigingen in beveiligde registersleutels (`HKLM`). Standaardapplicaties mogen en kunnen dit niet zomaar uitvoeren om te voorkomen dat andere randapparatuur (toetsenborden, muizen of Bluetooth-adapters) instabiel wordt.
- **Oplossing per Besturingssysteem**:

#### Windows 10 & Windows 11 (Aanbevolen Permanente Oplossing)

##### 1. Energiebesparing voor USB- en HID-apparaten Uitschakelen in Apparaatbeheer
1. Klik met de rechtermuisknop op de knop **Start** (of druk op `Win + X`) en kies **Apparaatbeheer**.
2. Vouw **Human Interface-apparaten (HID)** uit:
    - Zoek naar de **USB-invoerapparaat**-vermeldingen van uw interface.
    - Klik met de rechtermuisknop op elk item, kies **Eigenschappen** en ga naar het tabblad **Energiebeheer**.
    - **Schakel het vinkje uit** bij *"De computer mag dit apparaat uitschakelen om energie te besparen"* en klik op **OK**.
3. Vouw **USB-controllers (Universal Serial Bus controllers)** uit:
    - Klik met de rechtermuisknop op elke **USB-hoofdhub** en **Generieke USB-hub**, kies **Eigenschappen** en ga naar het tabblad **Energiebeheer**.
    - **Schakel het vinkje uit** bij *"De computer mag dit apparaat uitschakelen om energie te besparen"* en klik op **OK**.
4. (Voor Arduino / Serieel): Vouw **Poorten (COM & LPT)** uit:
    - Klik met de rechtermuisknop op uw USB-seriële poort (bijv. *Arduino Uno*, *USB-seriële poort*), kies **Eigenschappen** en schakel onder het tabblad **Energiebeheer** (indien aanwezig) de optie *"De computer mag dit apparaat uitschakelen om energie te besparen"* uit.

##### 2. Selectieve USB-onderbreking Uitschakelen in Windows Energiebeheer
1. Open het Windows-**Configuratiescherm** en ga naar **Energiebeheer** (of druk op `Win + R`, typ `powercfg.cpl` en druk op Enter).
2. Klik op **De schema-instellingen wijzigen** naast uw actieve energieschema.
3. Klik op **Geavanceerde energie-instellingen wijzigen**.
4. Vouw **USB-instellingen** -> **Instelling voor selectieve USB-onderbreking** uit.
5. Zet zowel **Op batterij** als **Netstroom** op **Uitgeschakeld**.
6. Klik op **Toepassen** en vervolgens op **OK**.

---

#### Linux & Raspberry Pi OS

##### 1. Kernel USB Autosuspend Uitschakelen
Standaard schakelt de Linux-kernel inactieve USB-apparaten na 2 seconden uit:
- **Op Ubuntu, Debian of Linux Mint (GRUB)**:
    1. Bewerk uw GRUB-configuratie: `sudo nano /etc/default/grub`.
    2. Voeg `usbcore.autosuspend=-1` toe aan `GRUB_CMDLINE_LINUX_DEFAULT`.
    3. Werk GRUB bij en herstart: `sudo update-grub && sudo reboot`.
- **Op Raspberry Pi OS**:
    1. Open het opstartopdrachtenbestand: `sudo nano /boot/firmware/cmdline.txt` (of `/boot/cmdline.txt`).
    2. Voeg `usbcore.autosuspend=-1` toe aan het einde van de regel (alle argumenten moeten op één enkele regel blijven staan).
    3. Sla op en herstart: `sudo reboot`.

##### 2. Autosuspend Uitschakelen via Udev-regel (Alternatief)
1. Maak een nieuw regelbestand aan: `sudo nano /etc/udev/rules.d/50-usb-power.rules`
2. Voeg de volgende regel toe:
   ```text
   ACTION=="add", SUBSYSTEM=="usb", TEST=="power/control", ATTR{power/control}="on"
   ```
3. Herlaad de udev-regels: `sudo udevadm control --reload-rules && sudo udevadm trigger`

---

#### macOS

- **Instellingen voor Energiestand / Schermen**: Ga naar **Systeeminstellingen** -> **Schermen** -> **Geavanceerd...** (of **Energiestand**) en schakel **"Voorkom automatische sluimerstand wanneer het beeldscherm is uitgeschakeld"** in.
- **Gebruik Actieve USB-hubs met Externe Voeding**: macOS kan passieve USB-hubs uitschakelen bij stroomschommelingen. Sluit timing-interfaces altijd aan via een actieve USB-hub met een eigen stopcontactadapter.

## Weergaveproblemen


### Browsercompatibiliteit & Leeg Scherm op Oudere Apparaten (Android < 9, Oudere Windows-systemen en Tablets) {: #browser-compatibility }
- **Symptoom**: Bij het openen van Race Coordinator AI op een oudere tablet (zoals Android 4.4 KitKat tot en met Android 8 Oreo), een oudere pc of een verouderde browser blijft het scherm volledig leeg of wordt de waarschuwingsbanner "Browser niet ondersteund" weergegeven.
- **Oorzaak**: Race Coordinator AI is gebouwd met modern Angular en ECMAScript (ES2020+), waarbij gebruik wordt gemaakt van CSS Grid, aangepaste CSS-eigenschappen (`var(--...)`), ES-modules en moderne JavaScript-API's (waaronder `BigInt`, `globalThis`, `queueMicrotask`, optionele ketenvorming `?.`, nullish coalescing `??` en privé-klassevelden `#x`). Browsers die deze functies missen, kunnen de webclient niet compileren of uitvoeren.
- **Ondersteuning voor Besturingssysteem en Browser**:

| Platform | Ondersteunde versies & minimale browsers | Status | Opmerkingen |
| :--- | :--- | :---: | :--- |
| **Windows 10 / 11** | Actuele versies van Google Chrome, Microsoft Edge, Mozilla Firefox | **Volledig ondersteund** | Direct klaar voor gebruik met automatische browserupdates. |
| **Windows 7 (SP1), 8, 8.1** | Google Chrome 109, Microsoft Edge 109 of Mozilla Firefox 115 ESR | **Ondersteund** | Moet de laatste ondersteunde browserversies gebruiken (Chrome 109 / Firefox 115 ESR). Internet Explorer wordt niet ondersteund. |
| **Windows XP / Vista** | Officiële standaardbrowsers (Chrome 49, Firefox 52 ESR) | **Alleen Server** | Standaardbrowsers missen ES2020+ en kunnen de gebruikersinterface niet lokaal uitvoeren. De Race Coordinator AI Java-server (JRE 8) draait echter headless op XP/Vista om races te hosten voor externe tablets of moderne pc's. |
| **Android** | Android 9.0+ met moderne Google Chrome of System WebView | **Ondersteund** | Google heeft updates voor Chrome/WebView op Android 8 en ouder definitief stopgezet. |
| **Apple iOS / iPadOS** | iOS 14.0+ (Safari / WebKit) | **Ondersteund** | Apple WebKit-engine met moderne ECMAScript-ondersteuning. |
| **macOS** | macOS 10.15 (Catalina) tot en met macOS 15+ (Safari 14+, Chrome, Firefox, Edge) | **Ondersteund** | Volledig compatibel op Intel- en Apple Silicon-Macs. |
| **Linux** | Elke moderne distributie met Chrome, Chromium of Firefox | **Ondersteund** | Inclusief Raspberry Pi OS 64-bit en ARM64 single-board computers. |

- **Oplossing en aanbevelingen**:
  - **Gebruik een ondersteunde moderne browser**: Maak verbinding met Google Chrome, Microsoft Edge, Mozilla Firefox of Apple Safari op een ondersteund besturingssysteem (Android 9.0+, iOS 14+, Windows 7+, macOS of Linux).
  - **Oudere Windows-installatie (Win 7 / 8 / 8.1)**: Zorg bij gebruik van Windows 7 of 8 voor de installatie van **Google Chrome 109** of **Mozilla Firefox 115 ESR** in plaats van het verouderde Internet Explorer.
  - **Voordelige moderne tablets**: Betaalbare moderne tablets (bijv. Amazon Fire HD 8/10 of Android-tablets met Android 11–14) ondersteunen modern Chrome en leveren uitstekende prestaties tegen lage kosten.
  - **Scherm spiegelen / Extern bureaublad**: Voor oudere tablets kunt u de Race Coordinator AI-server op de hostcomputer draaien en het scherm spiegelen met behulp van lichte VNC- of externe bureaubladtoepassingen (zoals bVNC of AnyDesk).
