# Race-editor

Met de **Race-editor** kunt u raceconfiguraties maken, aanpassen en beheren. Hier kunt u scoringsregels, heat-rotaties, brandstofsimulaties en race-opties instellen.

---

## Overzicht & Automatisch opslaan

De Race-editor biedt een geïntegreerde interface voor het selecteren, bekijken, configureren en testen van uw raceformaten:

- **Raceselector**: Deze dropdown bovenaan naast de paginatitel toont alle geconfigureerde races en maakt snel wisselen mogelijk.
- **Alleen-lezenmodus**: Standaard toont de editor race-eigenschappen, scoreregels en instellingen in alleen-lezenmodus. Formuliervelden zijn vergrendeld om onbedoelde wijzigingen te voorkomen, terwijl accordeons en heat-voorbeelden interactief blijven.
- **Bewerkingsmodus**: Door op het **Bewerken**-icoon (potlood) op de werkbalk te klikken worden alle invoervelden ontgrendeld. Tijdens het bewerken is de raceselector vergrendeld.
- **Continu automatisch opslaan**: Alle wijzigingen worden automatisch op de achtergrond op de server opgeslagen zonder de bewerkingsmodus te verlaten.
- **Bewerkingsmodus verlaten**: Door op het **Klaar**-icoon (vinkje) te klikken worden wijzigingen gevalideerd en keert u terug naar de alleen-lezenmodus.
- **Wijzigingen verwerpen**: Door op Verwerpen te klikken worden alle wijzigingen hersteld naar de laatst opgeslagen versie en verlaat u de bewerkingsmodus.

De werkruimte is verdeeld in twee gesynchroniseerde panelen:

- **Linkerpaneel (Raceconfiguratie)**: Algemene race-eigenschappen, formaat, scoremethoden, rotatietype, groepsopties en analoge/digitale brandstofsimulatie.
- **Rechterpaneel (Live heat-voorbeeld)**: Genereert dynamisch de volledige lijst met heats op basis van het actieve rotatietype en het aantal rijders.

---

---

## Race-instellingen {: #race-setup }

Het linkerpaneel configureert het basisformaat en de bijbehorende baan voor uw race:

- **Racenaam**: Unieke naam om het raceformaat te identificeren op de racedag en in statistieken.
- **Baan**: De fysieke baan die aan deze race is gekoppeld. Bepaalt of analoge of digitale brandstofsimulatie beschikbaar is.
- **Thema**: Visueel thema voor het scherm op de racedag.
- **Heat-rotatieformaat**: Kies tussen standaard rotaties (**Round Robin**, **Ladder**, **Toernooi**) of aangepaste reeksen.
- **Aantal heat-doorgangen**: Geeft aan hoe vaak elke coureur de complete heat-rotatie doorloopt.
- **Omgekeerde heats**: Draait de volgorde van de heats om zodat coureurs in omgekeerde volgorde rijden.
- **Voorbeeld coureursaantal**: Toont een dynamisch voorbeeld van de gegenereerde heatlijst op basis van het ingestelde coureursaantal.

Het rechterpaneel toont het **Live heat-voorbeeld**, dat de volledige lijst met heats, coureursrotaties en baantoewijzingen in realtime bijwerkt terwijl u instellingen aanpast.

---

## Navigatietabbladen {: #navigation-tabs }

De tabbladenbalk bovenaan de race-editor biedt snelkoppelingen om direct naar elk configuratiegedeelte te springen:

- **Algemeen**: Thema's, spraakmeldingen, rondetijdfilters en interfacevoorkeuren.
- **Heats**: Tijden voor automatisch starten en doorgaan, heat-herhalingen en omgekeerde volgorde.
- **Scoring**: Rangschikkingsmethoden voor heats en eindstand, finishvoorwaarden, tiebreakers en schrapresultaten.
- **Groepen**: Toernooifasen, kwalificatierondes en coureurspromotie.
- **Startmethoden**: Start- en herstarttijden, startposities op de baan, vliegende starts en valse-startstraffen.
- **Teamopties**: Duurzaamheidsraces voor teams, coureurswissels en stintlimieten.
- **Analoge brandstof**: Verbruik per ronde, tankinhoud en bijtanksnelheden.
- **Digitale brandstof**: Continu verbruik op basis van gashendel en aangepaste curven.
- **Seizoenspunten**: Kampioenschapspuntentabel, heat-punten en bonuspunten.

Door op een tabblad te klikken, scrolt de weergave direct naar dat uitklapgedeelte en opent het.

---

## Algemene instellingen {: #general-settings }

Het uitklapgedeelte Algemene instellingen regelt de presentatie, tijdfilters en het gedrag van de wedstrijdleider:

- **Themaselectie**: Wijs aangepaste kleurenschema's en scorebordindelingen toe.
- **Spraakmeldingen**: Automatische gesproken meldingen voor positiewisselingen, snelste rondes, pitstops en finishes.
- **Minimale rondetijd (s)**: Minimale toegestane rondetijd om sensorstoringen of valse triggers weg te filteren.
- **Drifttijd (s)**: Detectievenster voor driftende of glijdende auto's over de finishlijn.
- **Rondes met drift uitsluiten van records**: Indien ingeschakeld, worden rondes met drift uitgesloten van race-, heat- en coureurrecords.
- **Gele-vlagregels**: Automatische of handmatige onderbrekingen met stroomonderbreking op de baan.
- **Aangepaste UI-opties**: Selecteer gespecialiseerde ranglijsten en telemetrie-widgets.

### Driftmechanica & Timing van Uitrollen {: #drifting-and-drift-timing }

Bij slotcar-racen worden de auto's aangedreven door elektrische spanning via geleidende strips of stroomrails in de baan. Wanneer de baanbaanvoeding wordt onderbroken – zoals bij een gele vlag (pauze), aan het einde van een heat (**Heat Over**) of bij het einde van de race (**Race Over**) –, komen de auto's niet ogenblikkelijk met nulsnelheid tot stilstand. Door traagheid, massa, motormagneten en baanwrijving blijven rijdende auto's na het uitschakelen van de stroom nog een stukje voorwaarts uitrollen.

In Race Coordinator AI en in het slotrace-jargon wordt dit stroomloze uitrollen aangeduid als **"driften"**.

!!! note "Driften Gedefinieerd"
    Bij slotcar-racen betekent "driften" **niet** het zijdelings dwarsgooien van de achterkant, powersliden door bochten of stunten. Het verwijst uitsluitend naar het voorwaarts uitrollen van een auto door restbeweging nadat de stroom van de baan is uitgeschakeld.

Wanneer een auto de start/finishlijn of sensorgantry nadert precies op het moment dat de stroom uitvalt, kan zijn vaart hem over de sensor dragen voordat hij volledig stilstaat. Race Coordinator AI biedt uiterst nauwkeurige hardwaretiming en speciale regelinstellingen om deze situaties volkomen eerlijk en betrouwbaar af te handelen.

#### Het Cruciale Verschil: "Drift-ronde" vs. "Ronde met Drift Erin"

Er bestaat een fundamenteel onderscheid in Race Coordinator AI tussen een **Drift-ronde** (`isDrift = true`) en een **Ronde met Drift Erin** (`driftInvolved = true`):

##### 1. Een "Drift-ronde" (`isDrift = true`)
Een **Drift-ronde** is een ronde die fysiek wordt geregistreerd en geteld wanneer een auto de start/finishlijn of sensor passeert **TERWIJL de baanstroom is UITGESCHAKELD** (concreet tijdens de statussen `Paused` / gele vlag, `HeatOver` of `RaceOver`), binnen het ingestelde **Drifttijd**-venster.

- **Fysieke Gebeurtenis**: De auto passeert de lijn puur op eigen uitrolsnelheid zonder baanstroom.
- **Visuele Indicator**: De baankolom op het hoofdscherm van de racedag en het ronde-inspectievenster tonen een duidelijke **`DRIFT`**-badge naast de rondetijd.
- **Gesproken Melding**: Triggert het ingestelde **Drift-ronde geluid** (`driftLapAudio`) van de coureur met de hoogste urgente prioriteit (`urgent`) (bijv. *"Drift lap for {driver.nickname}"*).
- **Rondetoekenning**: De ronde wordt toegekend aan het rondetotaal van de coureur voor de heat en het algemeen klassement. De geregistreerde rondetijd combineert de opgebouwde deeltijd van vóór de onderbreking met de fractie van de uitrol over de sensor.
- **Statistieken**: Verhoogt de teller van drift-rondes in de racestatistieken (`driftLapCount`). Automatisch berekende deelsegmenten worden gereset.

##### 2. Een "Ronde met Drift Erin" (`driftInvolved = true`, maar `isDrift = false`)
Een **Ronde met Drift Erin** is een ronde die onder **normale GROENE-VLAG-omstandigheden met ingeschakelde stroom** is voltooid en geregistreerd, maar waarvan de totale verstreken tijd een onderbreking of overgedragen tijd bevat als gevolg van een pauze of heat-wissel.

- **Fysieke Gebeurtenis**: De auto passeert de finishlijn met **ingeschakelde** stroom op volle racesnelheid. Tijdens het verloop van diezelfde ronde werd de stroom echter tussentijds onderbroken en later weer hersteld.
- **Typische Scenario's**:
    - **Pauze bij Gele Vlag & Hervatting Halverwege een Ronde**: Een coureur heeft 3,2 seconden van een ronde van 5,0 seconden gereden wanneer geel wordt gezwaaid. De stroom valt weg en de auto rolt uit op het achterste rechte stuk (hij passeert de sensor *niet*, dus het is geen drift-ronde). De hardware-timer stopt en de 3,2 seconden worden opgeslagen in de openstaande tijd van de coureur, met een interne markering voor drifttijd (`markDriftTime()`). Bij de herstart onder groen starten de timers weer vanaf nul. De auto rijdt de resterende 1,8 seconde onder stroom en passeert de finish. De rondetijd is 5,0 seconden ($3{,}2\,\text{s} + 1{,}8\,\text{s}$). Omdat de auto onder groen over de streep kwam, is dit **geen Drift-ronde** (geen `DRIFT`-badge, normaal rondetoongeluid), maar het is wel een **Ronde met Drift Erin** omdat de duur werd gesplitst door een onderbreking.
    - **Doorlopend Rijden over Meerdere Heats (`Start at Current`)**: Bij continue heat-formats (`start_at_current = true`), waarbij auto's aan het einde van een heat blijven staan waar ze zijn en in de volgende heat vanaf die exacte positie verder rijden, wordt de onvoltooide deeltijd van de vorige heat meegenomen. Wanneer de coureur zijn eerste ronde van de nieuwe heat onder groen voltooit, bevat die ronde de tijd van de vorige heat: het is een **Ronde met Drift Erin**.

---

#### De Twee Race-instellingen

In het uitklapgedeelte **Algemene instellingen** biedt Race Coordinator AI twee specifieke opties om het driften en de geldigheid voor records in te stellen:

```
+---------------------------------------------------------------------------------+
| Minimale rondetijd (s): [ 2.0 ]      Drifttijd (s): [ 0.5 ]                     |
|                                                                                 |
| [ ] Oefenmodus   [X] Rondes met drift uitsluiten van records                    |
+---------------------------------------------------------------------------------+
```

##### Optie 1: Drifttijd (`drift_time`)
- **Type Instelling**: Decimaal getal in seconden (bijv. `0.0`, `0.5`, `1.0`, `2.0`).
- **Standaardwaarde**: `0.5` seconden.
- **Omschrijving**: Bepaalt het maximale tijdsvenster onmiddellijk na een stroomonderbreking (gele vlag, heat-einde, race-einde) waarin een sensorpassage wordt geaccepteerd als een geldige uitrolronde.

!!! warning "Banen zonder Relais voor Stroombediening"
    Indien uw baan niet beschikt over hardware-relais om de baanstroom te onderbreken, blijft de baan onder stroom tijdens pauzes, heat-eindes en race-eindes. Op dergelijke banen **moet de drifttijd worden ingesteld op `0` (geen drift-rondes)**. Wordt dit niet gedaan, dan zouden coureurs die tijdens een pauze blijven doorrijden met ingedrukte regelaar ten onrechte drift-rondes kunnen toegekend krijgen.

Zodra de stroom uitvalt, legt het systeem het exacte milliseconde-tijdstempel vast. Wordt er tijdens baanstilstand een sensorpuls gedetecteerd, dan geldt:

$$\Delta t = \text{Tijdstip van Detectie} - \text{Tijdstip van Stop}$$

$$\begin{aligned}
\text{Als } \Delta t \le \text{Drifttijd} &\implies \textbf{Geaccepteerd als Drift-ronde } (\text{isDrift} = \text{true}) \\
\text{Als } \Delta t > \text{Drifttijd} &\implies \textbf{Geweigerd en genegeerd}
\end{aligned}$$

- **Waarom een Drifttijd-limiet Noodzakelijk Is**:
    - **Eerlijkheid voor Uitrollende Auto's**: Een auto die zich centimeters voor de finish bevond toen de gele vlag viel, verdient de ronde als zijn vaart hem een fractie van een seconde later over de streep draagt.
    - **Voorkomen van Valse Rondes door Baancommissarissen**: Zonder tijdslimiet zou een baancommissaris die een gecrashte auto terugzet, de auto per ongeluk seconden of minuten later over de sensor kunnen duwen en zo een onverdiende ronde toekennen.
- **Insteladvies voor de Praktijk**:
    - **Banen zonder Stroomrelais**: Indien uw baan geen relais heeft om de baanstroom uit te schakelen, **moet de Drifttijd op `0` (0.0s) worden ingesteld** (geen drift-rondes). Omdat de stroom nooit wegvalt, kunnen auto's onder stroom blijven rijden; een drifttijdvenster groter dan nul zou deze gemotoriseerde rondes onterecht als drift-rondes meetellen.
    - **Magneetauto's (HO, 1/32 met magneet)**: De sterke magnetische remwerking tegen stalen rails stopt auto's zeer snel. Aanbevolen: `0.3` tot `0.8` seconden.
    - **Zonder Magneet / Zwaardere Klassen (1/24, houten banen)**: Auto's hebben een grote traagheid en geen magneetrem, waardoor ze aanzienlijk verder uitrollen. Aanbevolen: `1.0` tot `2.5` seconden.
    - **Uitgeschakeld (`0.0s`)**: Schakelt drift-rondes volledig uit; elke sensorpuls bij stroomloze baan wordt genegeerd.

##### Optie 2: Rondes met drift uitsluiten van records (`adjust_drift_laps`)
- **Type Instelling**: Selectievakje (`true` / `false`).
- **Standaardwaarde**: Uitgeschakeld (`false`).
- **Omschrijving**: Bepaalt of rondes waarbij op enigerlei wijze drift betrokken was, mogen meetellen voor persoonlijke, heat-, race- of baanrecords.

Bij het voltooien van een ronde controleert de software:

$$\text{driftInvolved} = \text{isDrift} \lor \text{hasDriftTime}$$

$$\text{countTowardsRecords} = \neg(\text{adjust\_drift\_laps} \land \text{driftInvolved})$$

- **Indien Ingeschakeld (`true`)**:
    - Elke ronde met drift-betrokkenheid – of het nu een **Drift-ronde** is (`isDrift = true`) OF een **Ronde met Drift Erin** (pauze of heat-overdracht) – wordt gediskwalificeerd voor records (`countTowardsRecords = false`).
    - De ronde wordt uitgesloten van:
        1. **Persoonlijke Beste Rondetijd van Coureur (`bestLapTime`)**: De persoonlijke toptijd wordt niet bijgewerkt.
        2. **Beste Rondetijd van de Heat**: Telt niet mee als snelste ronde van de huidige heat.
        3. **Beste Rondetijd van de Race**: Telt niet mee als snelste ronde van de race.
        4. **Baan- en Baanvakrecords**: Komt niet in de historische recordtabellen van de baan.
        5. **Gesproken Recordmeldingen**: Feestelijke aankondigingen voor records worden onderdrukt.
    - **Cruciaal Principe**: De ronde **telt voor de volle 100% mee voor het rondetotaal van de coureur, de positie in de heat en de eindstand**. Alleen de vermelding in het recordboek wordt geweigerd.
- **Indien Uitgeschakeld (`false`)**:
    - Elke ronde die voldoet aan het minimale rondetijdfilter kan records vestigen, zelfs als de ronde door een pauze werd onderbroken of stroomloos uitrollend werd voltooid.
- **Waarom Officiële Competities Dit Inschakelen**:
    - Onderbroken rondes beïnvloeden de temperatuur van banden en motoren; optrekken vanuit stilstand wijkt wezenlijk af van een vliegende ronde op vol vermogen onder groen.
    - Ook uitrollen over de finish weerspiegelt geen echt racetempo.
    - Deze optie waarborgt dat baanrecords uitsluitend worden gevestigd door pure, ononderbroken rondes op topsnelheid.

---

#### Samenvattende Vergelijkingstabel

| Kenmerk / Gedrag | Reguliere Ronde onder Groen | Drift-ronde (`isDrift = true`) | Ronde met Drift Erin (`hasDriftTime = true`, `isDrift = false`) |
| :--- | :--- | :--- | :--- |
| **Baanstroom bij Finishsensor** | **AAN** (Groene Vlag) | **UIT** (Gele Vlag, Einde Heat/Race) | **AAN** (Groene Vlag) |
| **Sensordetectie-omstandigheid** | Onder stroom op racesnelheid | Uitrollend binnen `drift_time` | Onder stroom na pauze of heat-overdracht |
| **Data-vlag `isDrift`** | `false` | `true` | `false` |
| **Interne Status `driftInvolved`** | `false` | `true` | `true` |
| **Badge op Racedag-scherm** | Geen | **`DRIFT`**-badge in baankolom | Geen |
| **Geluidsmelding** | Standaard ronde-/recordsound | **Drift-ronde geluid** (`urgent`) | Standaard geluid (geen drift-melding) |
| **Telt voor Rondetotaal & Klassement** | **Ja** (volledig) | **Ja** (volledig) | **Ja** (volledig) |
| **Geldig voor Records (`adjust_drift_laps` = UIT)** | **Ja** | **Ja** (indien sneller) | **Ja** (indien sneller) |
| **Geldig voor Records (`adjust_drift_laps` = AAN)** | **Ja** | **Uitgesloten / Gediskwalificeerd** | **Uitgesloten / Gediskwalificeerd** |

---

## Heat-opties {: #heat-options }

Het uitklapgedeelte Heat-opties regelt geautomatiseerde timing, herhalingscycli en de heat-volgorde:

- **Automatische doorlooptijd (s)**: Aantal seconden wachten na het einde van een heat voordat automatisch naar de volgende heat wordt gegaan.
- **Opwarmtijd voor doorlopen (s)**: Wachttijd voordat het automatisch doorgaan actief wordt.
- **Automatische starttijd (s)**: Aftelvertraging voordat de volgende heat automatisch van start gaat.
- **Opwarmtijd voor start (s)**: Opwarmduur voorafgaand aan de automatische startaftelling.
- **Aantal heat-doorgangen**: Bepaalt hoe vaak elke coureur de complete heat-rotatie doorloopt.
- **Omgekeerde heats**: Draait de volgorde van de heats om zodat coureurs in omgekeerde volgorde rijden.
---

## Scoringsregels {: #scoring-rules }

#### Ronde- en Tijdaanpassingen (Impact op Rangschikking en Statistieken)

- **Rangschikkingsmethode heats**: Rangschik coureurs in elke heat op basis van **Meeste ronden**, **Snelste ronde** of **Snelste totale tijd**, met instelbare tiebreakers.
- **Finishmethode**: Bepaalt hoe het einde van een heat wordt vastgesteld (op basis van **Rondenaantal** of verstreken **Tijd** in seconden).
- **Finish toestaan**: Kies hoe auto's hun rondes voltooien wanneer de leider finisht of de tijd verstrijkt (bijv. direct einde, iedereen laten finishen, enkele ronde of automatische segmenten).
- **Rangschikkingsmethode eindstand**: Rangschik de algemene race-eindstand over alle voltooide heats met aanpasbare tiebreakers en schrapresultaten.

## Groepen en fases {: #groups-and-stages }

Het uitklapgedeelte Groepen en fases scheidt coureurs in afzonderlijke groepen die op de baan niet tegen elkaar racen:

- **Groepsscheiding**: Coureurs worden ingedeeld in geïsoleerde groepen en rijden hun heats onafhankelijk volgens de ingestelde rotatie.
- **Maximaal aantal groepen**: Bepaalt het maximale aantal toegestane groepen voor de race.
- **Groepen balanceren**: Verdeelt coureurs automatisch gelijkmatig over alle groepen.
- **Lege banen toestaan**: Staat heats met onbezette banen toe wanneer groepen niet precies overeenkomen met het aantal banen.
- **Veelvoud van maximum forceren**: Zorgt ervoor dat het totale aantal heats in veelvouden van de maximale groepscapaciteit wordt gereden.
- **Groepsheats afwisselen**: Wisselt heats tussen verschillende groepen af in plaats van eerst één groep volledig af te ronden.
- **Minimaal aantal doorstromers**: Plaatst de beste coureurs van elke groep automatisch bovenaan het algemene klassement.
- **Groepsnamen**: Wijst aangepaste namen toe aan elke groep (bijv. Pro, Semi-Pro, Groep A/B/C).
---

## Startmethoden {: #start-methods }

Het uitklapgedeelte Startmethoden regelt de start van heats, autoposities op de baan en startstraffen:

- **Start- / herstarttijd (s)**: Aftelduur voordat een heat start of herstart na een onderbreking.
- **Willekeurige vertraging (s)**: Willekeurige vertraging toegevoegd aan het aftellen om anticiperen te voorkomen.
- **Starten achter sensor**: Vereist dat auto's op ronde nul achter de start-/finishsensor worden opgesteld.
- **Starten op huidige positie**: Laat auto's na een onderbreking herstarten vanaf hun huidige positie op de baan.
- **Vliegende starts**: Houdt baanvoeding actief zodat auto's direct kunnen optrekken bij het startsignaal.
- **Herstarten bij valse start**: Stopt en herstart het aftellen automatisch wanneer een valse start optreedt.
- **Valse-startstraffen**: Stelt rondenaftrek of tijdstraffen in voor coureurs die te vroeg starten.
---

## Teamrace-opties {: #team-racing }

Het uitklapgedeelte Teamrace-opties maakt duurzaamheidsraces met meerdere coureurs per team mogelijk:

- **Teamracemodus**: Schakelt teamscoring in waarbij teamleden gezamenlijk heats rijden.
- **Wisselstrategie coureurs**: Wisselt coureurs automatisch in een round-robinvolgorde over opeenvolgende heats.
- **Wissels tijdens de heat**: Laat coureurs wisselen tijdens pitstops of bij bepaalde rondenaantallen.
- **Stintlimieten**: Minimale en maximale rijtijd per coureur om evenredige deelname te waarborgen.
- **Verplichte wissels**: Verplicht een minimumaantal pitstops en coureurswissels per heat of race.

---

## Race-editor - Analoge brandstofsimulatie {: #analog-fuel-simulation }

Analoge brandstof simuleert het verbruik **per ronde**. Omdat analoge banen auto's detecteren wanneer ze over de start/finish-tijdmeting rijden, wordt brandstof berekend en afgetrokken bij elke voltooide ronde.

#### Configuratieopties

- **Analoge brandstof inschakelen**: Hoofdschakelaar voor analoge brandstofmeting. Indien uitgeschakeld rijden auto's zonder brandstofbeperkingen.
- **Type brandstofverbruik**: Bepaalt de wiskundige curve waarmee het verbruik wordt berekend op basis van de rondetijd:
    - **Lineair**: Het verbruik schaalt lineair met de rondetijd. Snellere ronden verbruiken meer brandstof, terwijl tweemaal zo langzame ronden de helft van de basisbrandstof verbruiken.
    - **Kwadratisch**: Het verbruik schaalt met het omgekeerde kwadraat van de rondetijd, wat zeer snelle ronden zwaar bestraft.
    - **Kubisch**: Het verbruik stijgt steil bij snelle ronden en straft coureurs die jagen op ronderecords agressief af.
    - **Aangepaste curve**: Maakt het mogelijk de verbruikscurve punt voor punt interactief vorm te geven op de SVG-grafiek.
- **Snelste tijd (s)**: De snelste verwachte rondetijd voor de baan en autoklasse (in seconden).
- **Langzaamste tijd (s)**: De langzaamste rondetijd (in seconden) voor minimaal brandstofverbruik.
- **Max. brandstofverbruik per snelste ronde**: De brandstofeenheden die per ronde worden verbruikt bij het rijden op of sneller dan de **Snelste tijd**.
- **Min. brandstofverbruik per langzaamste ronde**: De brandstofeenheden die per ronde worden verbruikt bij het rijden op of langzamer dan de **Langzaamste tijd**.
    - Voor rondetijden tussen de snelste en langzaamste tijd verloopt het verbruik vloeiend volgens het geselecteerde **Verbruikstype** (Lineair, Kwadratisch, Kubisch of Aangepaste curve).
- **Capaciteit**: Het totale volume van de brandstoftank in willekeurige eenheden (bijv. 100).
- **Startniveau (%)**: Het percentage van de maximale brandstofcapaciteit bij de start van een heat (bijv. 100% voor een volle tank, of minder voor sprint-/handicap-heats).
- **Tanksnelheid (%/s)**: De snelheid waarmee brandstof wordt bijgetankt tijdens een pitstop, uitgedrukt als percentage van de totale capaciteit per seconde.
- **Pitstopvertraging (s)**: De verplichte stilstandtijd in seconden voordat het tanken begint nadat een auto de pitstraat is binnengereden.
- **Brandstof resetten bij start heat**:
    - **Aangevinkt**: Het brandstofniveau van elke coureur wordt aan het begin van elke heat teruggezet naar het geconfigureerde **Startniveau**.
    - **Uitgevinkt**: Resterende brandstof wordt meegenomen naar volgende heats tussen wissels, wat strategisch beheer over de hele race vereist.
- **Actie bij lege tank**: De strafmaatregel wanneer een coureur zonder brandstof komt te zitten (niveau bereikt 0):
    - **Ronden niet tellen**: De auto blijft rijden, maar ronden die met een lege tank worden gereden tellen niet mee tot er in de pits is getankt.
    - **Heat beëindigen**: De heat stopt onmiddellijk voor deze auto, de baanverlichting/stroom wordt uitgeschakeld en de coureur wordt als gefinisht aangemerkt.
    - **Vermogensstotteren (Power Stutter)**: Simuleert een sputterende motor bij brandstofgebrek door de stroom op de baan snel aan en uit te pulseren.
        - *Vereist baanrelais*: Alleen selecteerbaar als de baaninterface afzonderlijke stroomrelais per baan/sleuf heeft.
        - **Stroom aan-tijd (s)**: Duur waarin de stroom tijdens elke puls aan blijft.
        - **Stroom uit-tijd (s)**: Duur waarin de stroom tijdens elke puls wordt onderbroken.

#### Pitstops en racetijd bij analoge brandstof

Om te voorkomen dat tijd in de pitstraat wordt gezien als een extreem langzame ronde (wat het berekende verbruik onterecht zou verlagen), houdt Race Coordinator AI de **opgebouwde tanktijd** bij. De tijd die stilstaand in de pits wordt doorgebracht, wordt van de totale rondetijd afgetrokken vóór de berekening:

$$\text{Racetijd} = \text{Rondetijd} - \text{Opgebouwde tanktijd}$$

#### Grafische voorbeelden (Analoog)

- **Gelijktijdige modelvergelijking**: Alle 3 vooraf ingestelde wiskundige modellen (**Lineair**, **Kwadratisch** en **Kubisch**) worden gelijktijdig op beide grafieken weergegeven. Het geselecteerde type is vet gemarkeerd met een opvallende gloed, terwijl de overige modellen zichtbaar blijven als gedempte referentielijnen (~40% dekking).
- **Brandstofverbruik per ronde**: Toont het exacte verbruik over het hele rondetijdspectrum (van Snelste tijd tot Langzaamste tijd). In de modus Aangepaste curve maken handgrepen en herstelknoppen directe aanpassingen mogelijk terwijl de 3 basismodellen zichtbaar blijven ter referentie.
- **Tijd tot pitstop**: Schat de totale racetijd (of aantal ronden) tot de tank leeg is bij een constant rondetempo voor alle modellen.
- **Interactieve legenda en zichtbaarheid**: Klik met de linkermuisknop op een curve in de legenda om deze in of uit te schakelen. Het verbergen van een curve schaalt de grafiekassen dynamisch opnieuw, zodat u resterende curven gedetailleerder kunt inspecteren.
- **Vergelijkende hover-kaarten**: Beweeg over de grafieken om vergelijkende telemetrie te zien voor alle zichtbare curven op het aangewezen punt, compleet met kleurmarkeringen, waarden en een `(Actief)`-indicator op het geselecteerde model.

---

---

## Race-editor - Digitale brandstofsimulatie {: #digital-fuel-simulation }

Digitale brandstof simuleert het verbruik **continu in realtime** op basis van gastelemetrie die door digitale controllers en decoders wordt ver

---

## Seizoensscore {: #season-scoring }

Het uitklapgedeelte Seizoensscore definieert de toekenning van kampioenschapspunten:

- **Punten per positie**: Wijs kampioenschapspunten toe voor elke finishpositie (bijv. 25 voor 1e, 18 voor 2e, etc.).
- **Heat-punten**: Optioneel punten toekennen voor individuele heat-resultaten naast de eindstand.
- **Bonuspunten**:
    - *Snelste ronde*: Extra punten voor de coureur met de snelste ronde van de race.
    - *Pole position*: Bonuspunten voor de beste kwalificatiepositie.
    - *Meeste ronden aan de leiding*: Bonuspunten voor de coureur die de meeste ronden aan kop lag.
- **Kampioenschapsaggregatie**: Automatische puntentelling over het hele seizoen met ondersteuning voor schrapresultaten.
