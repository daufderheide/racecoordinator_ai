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

### Microcontroller-resets en Onderspanning (Brownouts) {: #microcontroller-brownout-resets }

- **Symptoom**: Tijdens een race of trainingssessie verschijnt een waarschuwingsbanner op het racedagscherm: *"Microcontroller-reset gedetecteerd: De interface-microcontroller is tijdens bedrijf onverwachts gereset."* Als u op **Details** klikt, verschijnt een dialoogvenster met de interfacenaam, het aantal resets en het tijdstip van de laatste reset. Als er tijdens dezelfde sessie meerdere resets plaatsvinden, geeft een waarschuwing aan dat er frequente resets optreden.
- **Wat wordt gerapporteerd**: De timing-microcontroller (zoals een Arduino Uno, Nano, Mega of compatibele USB-microcontroller) heeft een onverwachte hardware-reset of onderspanning (brownout) ondergaan terwijl deze was verbonden met Race Coordinator AI. Dit betekent dat de processor op het bord een kortstondige spanningsdip of elektrische stoorpuls heeft ervaren die de interne resetlijn of het Brown-Out Detection (BOD)-circuit heeft geactiveerd.

#### Wat er gebeurt in Race Coordinator AI (RMS)
Wanneer een microcontroller tijdens de race onverwacht reset:
1. **Bootloader en Handshake**: De microcontroller herstart en stuurt een identificatie-handshake en status-pings naar Race Coordinator AI.
2. **Automatisch herstel van de status**: Race Coordinator AI detecteert dat het bord al verbonden en actief was. In plaats van de heat af te breken, herconfigureert het RMS de microcontroller onmiddellijk: ingangspinnen worden opnieuw toegewezen, polariteiten (actief-hoog/laag) ingesteld, ontspiegeltijden toegepast en relaisstatussen hersteld naar de huidige heatstatus (bijv. baanstroom AAN).
3. **Beschermingsschild-venster (250 ms)**: Bij het opstarten van een Arduino kunnen digitale pinnen kortstondig zweven of standaard pull-up-statussen melden voordat ze stabiliseren. Race Coordinator AI activeert direct na een onverwachte reset een beschermend venster van 250 ms. Gedurende dit venster worden statische pin-uitzendingen genegeerd om valse rondetellingen, spooktijden of onbedoelde baanoproepen door inschakelruis te voorkomen.
4. **Impact op het racen — Mogelijkheid van gemiste ronden**:
    - Hoewel Race Coordinator AI de verbinding en baanstroom automatisch herstelt zonder de heat af te breken, is de microcontroller tijdens zijn fysieke herstart, bootloader-uitvoering en handshake-onderhandeling (meestal 200–500 milliseconden) **volledig blind voor sensorsignalen**.
    - **Elke slotcar die tijdens dit resetvenster een optische sensor, dead strip of reed-schakelaar passeert, wordt NIET geregistreerd, wat resulteert in gemiste ronden.**
    - Als er herhaaldelijk resets optreden, worden de rondetelling en heatstanden onnauwkeurig en kunnen coureurs korte stroomonderbrekingen opmerken.

#### Veelvoorkomende Oorzaken
*Opmerking: Hoewel de onderstaande oorzaken de overgrote meerderheid van de problemen op slotcarbäaninstallaties vertegenwoordigen, is elke fysieke baan uniek en kunnen er andere elektrische of mechanische factoren meespelen.*

1. **Inductieve Relaispieken (Tegen-EMK)**:
    - **De belangrijkste oorzaak van microcontroller-brownouts bij slotracing.**
    - Baanstroomrelais bevatten elektromagnetische spoelen. Wanneer een relais uitschakelt (bij een baanstopt of einde heat), wekt het instortende magnetische veld in de spoel een enorme omgekeerde spanningspiek op (honderden volts tegen-EMK).
    - Als de relaisprint geen geschikte vrijloopdiodebescherming heeft of aarde/voeding rechtstreeks deelt met de Arduino, dringt deze hoogspanningspiek de microcontroller binnen, wat leidt tot een BOD-reset of het vastlopen van de processor.
2. **Bedrading van Baanstoptaknoppen en Lange Kabels als Antennes**:
    - Baanstoptaknoppen rondom de baan vereisen vaak lange stukken onafgeschermde kabel (3 tot meer dan 15 meter).
    - Deze lange kabels werken als antennes en vangen sterke elektromagnetische interferentie (EMI) op van motoren, sleepcontactvonken en railverbindingen.
    - Het indrukken of loslaten van mechanische schakelaars zonder externe pull-up-weerstanden of RC-ontdenderfilters kan spanningspieken direct op de ingangspinnen induceren.
3. **Spanningsdip op de 5V USB-Bus**:
    - Microcontrollers hebben een stabiele voeding van 4,5 V tot 5,2 V nodig om betrouwbaar te kunnen functioneren.
    - Als de Arduino is aangesloten op een passieve USB-hub, een USB-poort aan de voorzijde van de pc met een lange interne kabel of een zwaar belaste USB-controller, kan de spanning kortstondig onder de BOD-drempelwaarde zakken (doorgaans 2,7 V of 4,3 V), waardoor een onmiddellijke herstart wordt geforceerd.
4. **Elektromagnetische Storing van Baanstroom (EMI)**:
    - Slotcarmotoren trekken hoge stromen en vonken continu tussen de slepers en de baangeleiders.
    - Als sensorkabels, knopdraden of de microcontroller parallel en dicht bij baanstroomkabels of regelbare voedingen lopen, kunnen inductieve koppelingen spanningspieken in de timing-elektronica veroorzaken.
5. **Gedeelde 230V-Groepen en Gebrek aan Isolatie**:
    - Het aansluiten van de tijdwaarnemingscomputer, baanvoeding, bandenslijpmachines of gereedschap op hetzelfde ongefilterde stopcontact kan netstoringen via de computervoeding naar de USB-bus overbrengen.
6. **Elektrostatische Ontlading (ESD)**:
    - In droge ruimtes bouwen rijdende auto's op kunststof banen statische elektriciteit op. Wanneer een baancommissaris of coureur een knop of metalen rail aanraakt, kan de statische ontlading het bord resetten.

#### Mogelijke Oplossingen voor het Probleem

- **Monteer Vrijloopdiodes over Alle Relaisspoelen**:
    - Soldeer een standaard gelijkrichtdiode (zoals een **1N4001**, **1N4004** of **1N4007**) in sperrichting direct over de DC-aansluitingen van elke relaisspoel (kathode/streepzijde aan +DC, anode aan aarde/-DC). Dit absorbeert de tegen-EMK-energie veilig wanneer het relais afvalt.
- **Gebruik Opto-geïsoleerde Relaisprinten met Aparte Voeding**:
    - Veel 5V-relaismodules hebben een isolatiejumper met de aanduiding **JD-VCC / VCC / GND**.
    - Verwijder de `JD-VCC`-jumper. Sluit de 5V- en stuursignalen van de Arduino aan op de besturingsconnector, maar voed de relaisspoelen onafhankelijk door een aparte 5V DC-adapter aan te sluiten op `JD-VCC` en relais-`GND`. Hierdoor wordt het inductieve relaiscircuit volledig galvanisch gescheiden van de Arduino-voedingsbus.
- **Voeg Externe Pull-Up-Weerstanden en Condensatoren toe aan Knoppen**:
    - Vertrouw bij lange kabels niet uitsluitend op de zwakke interne pull-ups van de Arduino (~20 kΩ–50 kΩ). Monteer **externe pull-up-weerstanden van 1 kΩ tot 4,7 kΩ** tussen elke ingangspin en +5V op het klemmenblok van de Arduino.
    - Plaats daarnaast een kleine **keramische condensator van 0,1 µF (100 nF)** tussen elke knoppin en aarde om hoogfrequente storingen en contactdender te onderdrukken.
- **Gebruik een Gevoede USB-Hub met Externe Voedingsadapter**:
    - Sluit de microcontroller aan op een USB-hub met een eigen stopcontactadapter, in plaats van rechtstreeks op een pc- of laptop-USB-poort. Een gevoede hub garandeert stabiele 5V-stroomlevering, ongeacht de belasting van de computer.
- **Scheid Signaalkabels Fysiek van Baanstroomkabels**:
    - Leid sensorkabels (infrarood, fotocellen, reed) en knopbedrading op minimaal 15 tot 30 cm afstand van stroomrails en voedingskabels.
    - Als signaaldraden en baanstroomdraden elkaar moeten kruisen, kruis ze dan onder een **haakse hoek van 90 graden** en laat ze nooit parallel lopen.
- **Gebruik Afgeschermde Getwiste Kabels (Twisted-Pair)**:
    - Gebruik voor lange afstanden afgeschermde netwerkkabels (Cat5e/Cat6 STP) of afgeschermde instrumentatiekabel. Sluit de afscherming alleen aan de Arduino-zijde aan op aarde.
- **Aparte Stroomgroepen**:
    - Sluit de baanvoeding en de timing-computer aan op afzonderlijke stopcontacten of gebruik een hoogwaardige overspanningsbeveiliging met netfilter.

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
