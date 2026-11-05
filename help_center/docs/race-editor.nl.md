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
