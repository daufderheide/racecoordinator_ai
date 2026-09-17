# Baan-Editor

De **Baan-Editor** is de centrale configuratie-interface voor het modelleren van uw fysieke slotracebaan, het instellen van baanafmetingen en spoor-kleuren, en het configureren van de communicatie met tijdwaarnemingshardware, stroomrelais, sensoren en lichtsysteembediening.

Race Coordinator AI beschikt over een geavanceerde multi-interface-architectuur waarmee meerdere hardware-controllers (zoals Arduino, Trackmate, Phidget of BART) gelijktijdig op één enkele baan kunnen functioneren.

---

## Overzicht & Automatisch Opslaan

De Baan-Editor biedt een uniforme interface voor het selecteren, bekijken, configureren en testen van uw slotcar-banen:

- **Baankiezer**: Dit vervolgkeuzemenu in de bovenste koptekst naast de paginatitel toont alle geconfigureerde banen en stelt u in staat snel tussen banen te schakelen.
- **Alleen-lezen Modus**: Standaard worden bij het openen van de editor de baaneigenschappen, spoorindelingen en hardware-interfaces in de alleen-lezen modus weergegeven. Formuliervelden, spoorbeheer en interface-acties zijn vergrendeld om onbedoelde wijzigingen te voorkomen.
- **Bewerkingsmodus**: Als u op het pictogram **Bewerken** (potlood) op de werkbalk klikt, worden alle configuratieknoppen, spoorvolgordes en hardware-instellingen ontgrendeld. In de bewerkingsmodus blijft de baankiezer vergrendeld om te voorkomen dat u niet-opgeslagen wijzigingen per ongeluk verlaat.
- **Continu Automatisch Opslaan**: Terwijl u wijzigingen aanbrengt (hernoemen, spoorlengtes aanpassen, sporen herschikken of pintoewijzingen wijzigen), worden uw bewerkingen automatisch op de achtergrond op de server opgeslagen zonder de bewerkingsmodus te verlaten.
- **Bewerken Voltooien**: Als u op het pictogram **Bewerken voltooien** (vinkje) klikt, worden uw wijzigingen gevalideerd, definitief opgeslagen op de server en keert de editor terug naar de alleen-lezen modus.
- **Wijzigingen Verwerpen**: Als u probeert de editor te verlaten met niet-opgeslagen of ongeldige wijzigingen, vraagt een dialoogvenster om bevestiging. Bij verwerpen worden alle bewerkingen teruggedraaid naar de laatst opgeslagen versie en wordt de alleen-lezen modus hersteld.

Het werkgebied is opgedeeld in twee gesynchroniseerde werkpanelen:

- **Linkerpaneel (Algemene Baan- & Spooreigenschappen)**: Configureer baannaam, aantal baansekties, schaal en individuele spooreigenschappen (lengte, volgorde en kleuren). Onderaan dit paneel voegt u nieuwe hardware-interfaces toe.
- **Rechterpaneel (Hardware-Interfaces & Interactief Testen)**: Configureer aangesloten hardware, wijs pinnen en kanalen toe aan baanfuncties, stel adresseerbare RGB-LED-strips in en test sensoren en relais direct in real-time.

Alle wijzigingen in de Baan-Editor worden **automatisch gevalideerd en opgeslagen**. Wanneer een ongeldige configuratie wordt vastgesteld (zoals een lege of dubbele baannaam of een ontbrekende pin-toewijzing), wordt het opslaan tijdelijk gepauzeerd en wijzen waarschuwingsmarkeringen op de te corrigeren velden.

---

## Algemene Baanconfiguratie

Het bovenste gedeelte definieert de basiseigenschappen van uw circuit:

### Baannaam (Track Name)
De unieke aanduiding van uw baan in de Race Coordinator AI database. Elke baan moet een eigen naam hebben.

### Aantal Baansekties (Number of Track Sections)
Bepaalt in hoeveel segmenten uw baan is onderverdeeld. Dit heeft twee belangrijke toepassingen:

1. **Gedeeltelijke Rondetelling bij Heat-Einde**:
   - De standaardwaarde **100** staat voor een procentuele verdeling, waarmee wedstrijdleiders deelrondes met twee decimalen nauwkeurig kunnen toekennen (bijv. $14{,}65$ ronden) op basis van de stilstandpositie van de auto na afloop van een tijdheat.
   - Heeft u fysieke markeringspaaltjes of strepen langs de baan geplaatst, vul dan het exacte aantal markeringen in (bijv. 20 markeringen op een baan van 18 meter). Na de manche noteren baancommissarissen de laatst gepasseerde markering per auto.
2. **Sectortijden / Tussentijden**:
   - Indien tussentijdsensoren zijn geïnstalleerd, bepaalt deze waarde de logische sectorverdeling van het circuit.

### Baanschaal (Track Scale)
Selecteer de schaal van uw baan in het keuzemenu:

- **1:1 (Werkelijke Schaal)**
- **Schaal 1:24** (Grote commerciële slotcars / hard-body modellen)
- **Schaal 1:32** (Standaard club- en thuisbanen, Carrera, Scalextric, Policar)
- **Schaal 1:43** (Compacte analoge en digitale circuits)
- **Schaal 1:64 (HO)** (HO-slotcars, AFX, Auto World, Tyco)

!!! info "Schaalsnelheid-Telemetrie"
    Race Coordinator AI combineert de **Baanschaal** met de individuele **Spoorlengte** om authentieke schaalsnelheden (in km/u of mph) te berekenen voor weergave op schermen, rijdersstations en XLS-exports.

---

## Spoorconfiguratie (Lane Configuration)

In het onderdeel **Spoor-Editor (Lane Editor)** stelt u de geometrie, startvolgorde en kleuren van elk spoor in.

```
+---------------+-------------------+--------------------+-------------------+
| Volgorde / X  |  Spoor # & Lengte |  Achtergrondkleur  |  Tekstkleur       |
+---------------+-------------------+--------------------+-------------------+
|  [::]   [X]   |  #1  [ 48.50 ] ft |      [ Rood ]      |     [ Wit ]       |
|  [::]   [X]   |  #2  [ 50.25 ] ft |      [ Wit ]       |     [ Zwart ]     |
|  [::]   [X]   |  #3  [ 52.00 ] ft |     [ Blauw ]      |     [ Wit ]       |
|  [::]   [X]   |  #4  [ 53.75 ] ft |     [ Geel ]       |     [ Zwart ]     |
+---------------+-------------------+--------------------+-------------------+
```

### Sporen Toevoegen en Verwijderen
- **Spoor Toevoegen (`+`)**: Klik op **`+`** in de koptekst van de Spoor-Editor om een nieuw spoor toe te voegen. Race Coordinator AI kiest automatisch geschikte contrasterende kleuren.
- **Spoor Verwijderen (`X`)**: Klik op het rode kruisje **`X`** naast een spoor om het te wissen. Alle hardware-interfaces werken hun pin-toewijzingen automatisch bij.

### Volgorde Wijzigen via Verslepen (Drag-and-Drop)
Pak de handgreep (**`::`**) aan de linkerkant van een spoor vast om het omhoog of omlaag te slepen in de startopstelling. Het wijzigen van de volgorde werkt direct door in heat-rotatieschema's, rijdersposities en scoreborden.

### Spoorlengte (Voet / Meter)
Vul de fysieke lengte van de hartlijn van elk spoor in in **voet (ft)**.

Op circuits zonder spoorcompensatiebruggen zijn de binnensporen korter dan de buitensporen. Het nauwkeurig invoeren van de lengte per spoor zorgt ervoor dat:
- Schaalsnelheidsberekeningen (km/u) kloppen voor elk spoor afzonderlijk.
- Rondestatistieken en brandstofverbruik overeenkomen met de werkelijk gereden afstand.

!!! tip "Omrekenen van Meters naar Voet"
    Heeft u uw baan in meters opgemeten, reken dan om naar voet via:
    
    $$\text{Lengte (voet)} = \text{Lengte (meter)} \times 3{,}28084$$
    
    $$(1\text{ voet} = 0{,}3048\text{ meter})$$

### Spoorkleuren (Achtergrond en Tekst)
Elk spoor beschikt over twee kleurkiezers:

- **Achtergrondkleur**: De primaire herkenningskleur van het spoor (bijv. Rood, Wit, Blauw, Geel, Oranje, Groen, Paars, Zwart).
- **Tekstkleur / Voorgrond**: De contrastkleur voor teksten en nummers op de spoorbalken.

!!! note "Hardware-Kleursynchronisatie"
    Het wijzigen van de achtergrondkleur synchroniseert automatisch met geconfigureerde Arduino FastLED RGB-strips, waardoor statuslampen en tankindicaties aansluiten bij uw baan.

---

## Hardware-Interface Architectuur

Race Coordinator AI ondersteunt het gelijktijdig koppelen van meerdere hardware-systemen.

### Multi-Interface Ondersteuning
U kunt verschillende controllers op dezelfde baan combineren:
- Gebruik een **Trackmate**-module voor uiterst nauwkeurige optische rondetelling en baanstroomafsluiting.
- Sluit gelijktijdig een **Arduino** aan met de Race Coordinator AI sketch voor adresseerbare FastLED RGB-startlichten, pitstop-vulmeters en gelevlag-knipperlichten.
- Sluit een **Phidget**-module aan voor rijders-pauzetoetsen (chaos) of tussentijdsensoren.

### Interface-Tabbladen & Snelle Navigatie
Bovenaan het rechterpaneel vindt u tabknoppen voor elke geconfigureerde interface om direct naar de betreffende instellingen te scrollen.

### Live Verbindingsstatus
Elke interfacekaart toont een duidelijke statusindicator:

| Indicator | Betekenis | Actie |
| :--- | :--- | :--- |
| **Verbonden** (Groen) | Actieve verbinding tot stand gebracht; data stroomt bidirectioneel. | Gereed voor racen en interactieve tests. |
| **Geen Gegevens** (Oranje) | Apparaat op poort gedetecteerd, maar geen datastroom of heartbeat. | Controleer baudrate, USB-kabel of sketch-versie. |
| **Niet Verbonden** (Grijs / Rood) | Hardware niet gevonden, poort bezet of stroom ontbreekt. | Controleer COM-poort, USB-aansluiting en voeding. |

---

## Ondersteunde Hardware-Interfaces

### 1. Arduino-Interface

De **Arduino**-interface is de meest veelzijdige oplossing in Race Coordinator AI. Met een Arduino Uno, Mega of compatibele microcontroller stuurt u rondetelling, baanstroomrelais, baantoetsen, sectortijden, gaspedaaltelemetrie en FastLED adresseerbare RGB-verlichting aan.

#### Bordtypen
- **Arduino Uno**: Ideaal voor 2 tot 4 sporen (14 digitale pinnen 2–13 en 6 analoge ingangen A0–A5).
- **Arduino Mega 2560**: Aanbevolen voor 6 tot 8 sporen, meerdere tussentijdsectoren of uitgebreide LED-installaties (54 digitale pinnen 2–53 en 16 analoge ingangen A0–A15).

#### Verbinding & Firmware-Compatibiliteit
- **Seriële COM-Poort**: Selecteer de USB-poort van uw besturingssysteem.
- **Baudrate**: Snelle overdracht (standaard `115200` baud).
- **Sketch-Compatibiliteit**:
    - **Race Coordinator AI Sketch (`v2.1.0.x`)**: Ondersteunt alle moderne opties (FastLED RGB, spanningsdelers en uitgebreide telemetrie).
    - **Oorspronkelijke Race Coordinator 1.0 Sketch (`v1.0.0.x`)**: Volledig compatibel voor ronden, relais en toetsen. FastLED RGB-opties worden uitgeschakeld met een toelichting.

#### Debounce / Ontdendering ($\mu\text{s}$)
Stelt de ontdenderingstijd van ingangspinnen in in **microseconden** ($1\text{ ms} = 1000\,\mu\text{s}$). Snelle elektrische schommelingen worden genegeerd.
- Optische infrarood- of fototransistorsensoren: **100 tot 500 $\mu\text{s}$**.
- Mechanische reed-contacten of dead strips: **1000 tot 5000 $\mu\text{s}$**.

#### Inverteer-Opties (Ruststroom / Normally Closed)
- **Normally Closed Spoorsensoren**: Inschakelen indien de sensor in rust hoog is en naar laag zakt zodra een auto passeert (standaard bij lichtsluizen). Uitschakelen bij dead strips of reed-contacten.
- **Normally Closed Relais**: Inschakelen indien het relais bekrachtigt om stroom af te sluiten en in rust stroom doorlaat. Garandeert baanstroom, zelfs als de computer uitstaat.

#### Pitstop-Gedrag op Rondepin
Laat de start/finish-sensor fungeren als pitstop-detectie tijdens brandstofraces:
- **Geen (None)**: Alleen reguliere rondetelling.
- **Pit In**: Passage start het tanken.
- **Pit Out**: Passage beëindigt het tanken.
- **Pit In/Out**: Passage activeert tanken; na vertrek telt de eerstvolgende doorkomst weer als normale ronde.

#### Pin-Toewijzingen (Digitaal & Analoog)
- **Rondetelling**: Sensor per spoor.
- **Stroombediening**: Hoofdrelays (Master Relay) en relais per spoor (Lane Relays).
- **Baancontrole**: Baanknop (Track Call) en rijderstoetsen.
- **Tussentijden & Pits**: Sectorsensoren en aparte pit-in/pit-out sensoren.
- **RGB-Verlichting**: Datalijn voor adresseerbare LED-strips.

!!! tip "Interactief Hardware Testen"
    Naast elke pin-kiezer staat een **Live Statusindicator**:
    - **Ingangen (Sensoren/Knoppen)**: Bij activering licht de indicator 500 ms fel groen op.
    - **Uitgangen (Relais)**: Klik op de indicator om het fysieke relais direct in- en uit te schakelen.

#### Spanningsdelers & Gaspedaaltelemetrie
Meet de regelaarspanning ($0\text{--}5\text{V}$) voor digitale brandstofraces:
- **Live Indicator**: Huidige meetwaarde ($0\text{--}1023$).
- **Maximale Spanning**: Kalibratie voor 100% volgas.
- **„Max op Indicator Instellen”**: Neemt de piekwaarde direct over.
- **Sporen Koppelen**: Past de kalibratie in één keer toe op alle sporen.

#### Adresseerbare FastLED RGB-Verlichting
1. **Stripconfiguratie**: Signaalpin, aantal LED's, helderheid ($0\text{--}255$), knipperfrequentie en kleurvolgorde (`GRB`, `RGB`, etc.).
2. **Functies per LED**:
   - **Startlichten**: Aftellampen, Groen voor start, Rood bij valse start.
   - **Vlagstatus**: Groen (race bezig), Geel knipperend (chaos/onderbreking), Rood/Finishvlag.
   - **Spoorstatus**: Brandt in de spoorkleur wanneer er stroom op staat.
   - **Tankniveau**: Lichtbalk die zich vult tijdens het tanken.
   - **Koploper**: Toont de kleur van de actuele leider in de heat.
   - **Rondeflits**: Knippert in de spoorkleur bij elke finishdoorkomst.

---

### 2. Trackmate-Interface

Directe ondersteuning voor commerciële Trackmate-tijdwaarnemingskaarten via seriële COM-poorten (USB of RS-232).

- **Ontdenderfilter (Debounce niveaus 1–4)**: Hardwarefilter tegen dubbele pulsen (niveau 2 of 3 aanbevolen).
- **Normally Closed Logica**: Signaalinversie voor fotocellen en relais.
- **Aparte Relais per Spoor**: Inschakelen indien voorzien van relais per baan.
- **8 Sensorkanalen**: Toewijzing van de 8 ingangen aan sporen of pits.
- **Relaistest**: Schakel hoofd- en spoorrelais direct handmatig met knoppen in het scherm.
- **Baanknop (Call Button)**: Aparte ingang met live activiteitslampje.

---

### 3. Phidget-Interface

Aansturing van industriële Phidgets USB- en VINT-modules (o.a. InterfaceKit 0/16/16, 8/8/8, 1014 Relais en VINT-hubs).

- **Automatische Detectie**: Herkenning via Serienummer en Hubpoort.
- **Digitale Ingangen**: Snelle, optisch geïsoleerde ingangen voor ronden, knoppen en sectoren.
- **Digitale Uitgangen / Relais**: Schakelen van stroomrelais en externe sirenes.
- **Analoge Ingangen**: Spanningsmeting voor gaspedaalposities.
- **Inversie**: Onafhankelijke polariteitsinstelling voor sensoren en relais.

!!! warning "Phidget22-Drivers Vereist"
    Vereist de installatie van de officiële **Phidget22**-systeemstuurprogramma's op uw computer.

---

### 4. BART-Interface (Policar Bluetooth Timer)

Draadloze verbinding met Policar BART Bluetooth Low Energy (BLE) sensorbruggen en transponders.

- **Draadloze BLE-Detectie**: Automatische scan naar Bluetooth LE-apparaten zonder COM-poorten.
- **Hardware-Kanalen (tot 32)**: Dynamische kanaaltoewijzing aan sporen en pits.
- **Minimum Rondetijdfilter (ms)**: Hardwarefilter om spookpulsen te onderdrukken.
- **Live Activiteit**: Directe visuele bevestiging bij elke sensordoorgang.

---

### 5. Demo- / Simulatie-Interface

Ideaal om raceformats, rotaties, thema's, audio-oproepen en schermen te testen zonder aangesloten hardware.

- **Realistische Simulatie**: Berekent rondetijden, verschillen en pitstops op basis van uw geconfigureerde sporen.
- **Geen Installatie Nodig**: Werkt direct op elke baan.

---

## Bediening & Werkbalk

De bovenste werkbalk van de Baan-Editor biedt essentiële beheertools:

- **Terug**: Keert terug naar het vorige scherm of de Racedag Setup.
- **Baan toevoegen (+)**: Maakt een nieuw baansjabloon aan en activeert de bewerkingsmodus.
- **Baan dupliceren**: Maakt een identieke kopie onder een unieke naam om variaties te testen zonder vanaf nul te beginnen.
- **Bewerken / Bewerken voltooien**: Schakelt tussen alleen-lezen modus en bewerkingsmodus. Bij het verlaten van de bewerkingsmodus worden wijzigingen gevalideerd en opgeslagen.
- **Baan verwijderen**: Verwijdert de geselecteerde baan na bevestiging.
- **Ongedaan Maken (`Ctrl+Z`) / Opnieuw (`Ctrl+Y`)**: Eenvoudig herstellen van afmetingen, kleuren of pinnen.
- **Help (`?`)**: Start een interactieve rondleiding langs alle bedieningselementen op het scherm.

---

## Probleemoplossing voor Hardware

### Baanstroom Verkeerd Om (Relais Geïnverteerd)
- **Symptoom**: Baan heeft stroom bij geel en valt uit bij groen.
- **Oplossing**: Wijzig de instelling **Normally Closed Relais**.

### Oneindig Tanken
- **Symptoom**: Auto's blijven continu tanken zodra ze de baan opgaan.
- **Oplossing**: Wijzig de instelling **Normally Closed Spoorsensoren**.

### Dubbele Tellingen of Gemiste Ronden
- **Oplossing**: Verhoog de ontdendering (Debounce) bij dubbeltellingen; verlaag deze bij gemiste ronden van snelle auto's en controleer de uitlijning van de fotocellen.

### FastLED RGB-Strips Gaan Niet Aan
- **Oplossing**: Zorg dat de officiële **Race Coordinator AI sketch (`v2.1.0.x`)** is geladen, controleer het LED-type en de kleurvolgorde, en controleer of de massa (GND) van de externe 5V-voeding verbonden is met de massa van de Arduino.
