# Race-editor

De **Race-editor** is de centrale configuratie-interface voor het ontwerpen, configureren en testen van uw slotcar-raceformaten, scoreregels, heat-rotaties, brandstofsimulaties en timerinstellingen.

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

## Raceconfiguratie & Opties

### Racenaam & Baankoppeling
- **Racenaam**: Unieke naam die het raceformaat identificeert.
- **Baan**: De gekoppelde fysieke baan bepaalt of analoge of digitale brandstofsimulatie beschikbaar is.
- **Thema**: Visueel UI-thema voor weergave op de racedag.

### Heat-rotatieformaat
- **Rotatietype**: Standaard rotaties (**Round Robin**, **Ladder**, **Toernooi**) of aangepaste reeksen.
- **Aantal heat-cycli**: Hoe vaak elke rijder de volledige heat-rotatie doorloopt.
- **Omgekeerde heats**: Draait de volgorde van de heats om.

### Score-opties
- **Heat-score**: Voltooiing op ronden of tijdslimiet, rangschikkingsmethode en tiebreakers.
- **Algemene score**: Algemene rangschikkingsmethode, tiebreaker-regels en schrapresultaten.
- **Seizoensscore**: Puntenverdeling per positie voor kampioenschappen.

### Timerinstellingen
- **Start- / Herstartvertraging**: Afteltijd in seconden voor de start.
- **Minimale rondetijd**: Minimale tijd om valse sensortriggers te filteren.
- **Drifttijd**: Detectievenster voor driftende auto's over de finishlijn.
- **Starten achter sensor**: Verplicht starten achter de finishsensor in ronde nul.

## Brandstofinstellingen

Race Coordinator AI ondersteunt een uitgebreide brandstofsimulatie voor zowel analoge als digitale banen, inclusief aanpasbare brandstoftankcapaciteit, startniveau, pitstopvertragingen, tanksnelheden, strafmaatregelen bij een lege tank en brandstofverbruiksmodellen.

### Baancompatibiliteit en selectie van het brandstofsysteem

De race-editor bevat twee specifieke configuratiesecties voor brandstof: **Analoge brandstof** en **Digitale brandstof**. Welk systeem beschikbaar en actief is, wordt automatisch bepaald door de gekozen baan voor de race:

- **Analoge banen**: Traditionele slotracebanen waar auto's rechtstreeks via de stroomrails van de sleuf worden gevoed, zonder digitale decoders of telemetrie tussen auto en baan. Wanneer een analoge baan is geselecteerd, is de sectie **Analoge brandstof** ingeschakeld en wordt de sectie **Digitale brandstof** automatisch uitgeschakeld.
- **Digitale banen**: Digitale slotracesystemen (zoals Carrera Digital, Scalextric Digital, Scorpius of oXigen) waarbij de interface digitale telemetrie communiceert (auto-ID, gaspercentage, sensoren in de pitstraat). Wanneer een digitale baan is geselecteerd, is de sectie **Digitale brandstof** ingeschakeld en wordt de sectie **Analoge brandstof** automatisch uitgeschakeld.

---

### Analoge brandstofsimulatie

Analoge brandstof simuleert het verbruik **per ronde**. Omdat analoge banen auto's detecteren wanneer ze over de start/finish-tijdmeting rijden, wordt brandstof berekend en afgetrokken bij elke voltooide ronde.

#### Configuratieopties

- **Analoge brandstof inschakelen**: Hoofdschakelaar voor analoge brandstofmeting. Indien uitgeschakeld rijden auto's zonder brandstofbeperkingen.
- **Type brandstofverbruik**: Bepaalt de wiskundige curve waarmee het verbruik wordt berekend op basis van de rondetijd:
    - **Lineair**: Het verbruik schaalt lineair met de rondetijd. Snellere ronden verbruiken meer brandstof, terwijl tweemaal zo langzame ronden de helft van de basisbrandstof verbruiken.
    - **Kwadratisch**: Het verbruik schaalt met het omgekeerde kwadraat van de rondetijd, wat zeer snelle ronden zwaar bestraft.
    - **Kubisch**: Het verbruik stijgt steil bij snelle ronden en straft coureurs die jagen op ronderecords agressief af.
    - **Aangepaste curve**: Maakt het mogelijk de verbruikscurve punt voor punt interactief vorm te geven op de SVG-grafiek.
- **Snelste tijd (s)**: De snelste verwachte rondetijd voor de baan en autoklasse (in seconden).
- **Max. verbruik**: De brandstofeenheden die per ronde worden verbruikt bij het rijden op of sneller dan de **Snelste tijd**.
- **Langzaamste tijd (s)**: De langzaamste rondetijd (in seconden) voor minimaal brandstofverbruik.
- **Min. verbruik**: De brandstofeenheden die per ronde worden verbruikt bij het rijden op of langzamer dan de **Langzaamste tijd**.
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

### Digitale brandstofsimulatie

Digitale brandstof simuleert het verbruik **continu in realtime** op basis van gastelemetrie die door digitale controllers en decoders wordt verzonden.

#### Continu gasgestuurd verbruik

In tegenstelling tot analoog (waarbij brandstof pas bij de finishlijn wordt berekend), berekent digitaal het verbruik bij elk ontvangen telemetriepakket:

$$\text{Verbruikte brandstof} = \text{Verbruik per seconde} \times \Delta t$$

Coureurs die vloeiend rijden of gas terugnemen in bochten verbruiken aanzienlijk minder brandstof dan coureurs die overal vol gas geven.

#### Configuratieopties

- **Digitale brandstof inschakelen**: Hoofdschakelaar voor digitale brandstofmeting.
- **Type brandstofverbruik**: Wiskundig model toegepast op de gasstand ($0\,\%$ tot $100\,\%$):
    - **Lineair**: Het verbruik is recht evenredig met de stand van de gashendel.
    - **Kwadratisch**: Het verbruik stijgt gematigd bij half gas en accelereert richting vol gas.
    - **Kubisch**: Vol gas verbruikt exponentieel meer brandstof dan rijden op deellast.
    - **Aangepaste curve**: Maakt een aangepaste gas-verbruiksrespons mogelijk over het bereik van 0% tot 100% gas.
- **Verbruikssnelheid**: Maximaal verbruik in eenheden per seconde bij **100% vol gas**.
- **Capaciteit**, **Startniveau (%)**, **Tanksnelheid (%/s)**, **Pitstopvertraging (s)**, **Brandstof resetten bij start heat**: Identieke werking als bij analoge brandstof.
- **Actie bij lege tank**:
    - **Ronden niet tellen**: Auto blijft bestuurbaar, maar ronden met een lege tank tellen niet mee.
    - **Heat beëindigen**: Coureur valt direct uit zodra de brandstoftank leeg is.

#### Grafische voorbeelden (Digitaal)

- **Gelijktijdige modelvergelijking**: Toont gelijktijdig lineaire, kwadratische en kubische responscurven met het actieve model gemarkeerd en de overige modellen als achtergrondreferentie.
- **Digitaal brandstofverbruik**: Zet het gaspercentage ($0\,\%$ tot $100\,\%$) uit tegen het verbruik per seconde voor alle modellen.
- **Tijd tot leeg**: Zet het gaspercentage uit tegen het aantal seconden continu rijden tot de tank volledig leeg is.
- **Interactieve legenda en dynamische schaling**: Schakel afzonderlijke curven in/uit via de legenda, waardoor de assen automatisch opnieuw worden geschaald.
- **Vergelijkende hover-kaarten**: Bij het bewegen over de grafiek worden de realtime meetwaarden van alle zichtbare curven bij dat specifieke gaspercentage getoond.

---

### Interactieve bewerking van de aangepaste curve

Wanneer **Aangepaste curve** is geselecteerd als verbruikstype (analoog of digitaal), verschijnen handgrepen direct op de SVG-verbruikscurve:

- **Initiële curve-generatie**: Bij de eerste overstap naar Aangepaste curve worden de eerste 5 punten rechtstreeks overgenomen van de actieve voorinstelling (Lineair, Kwadratisch of Kubisch) zonder visuele sprong.
- **Interactief slepen en neerzetten**: Klik en sleep een punt omhoog, omlaag, naar links of naar rechts om de curve te hervormen.
- **Afgedwongen monotonie**:
    - *Analoge brandstof*: Snellere rondetijden verbruiken altijd meer of evenveel brandstof als langzamere rondetijden (monotoon niet-stijgende curve). Slepen is begrensd zodat punten niet kunnen omkeren.
    - *Digitale brandstof*: Hogere gasstanden verbruiken altijd meer of evenveel brandstof als lagere gasstanden (monotoon niet-dalende curve).
- **Punten toevoegen**: Klik op de curvelijn om op de exacte geïnterpoleerde positie een nieuw controlepunt in te voegen.
- **Punten verwijderen**: Klik met de rechtermuisknop op een tussenpunt om het te verwijderen (minimaal 2 eindpunten blijven behouden).
- **Herstelknoppen voor voorinstellingen**: Herstel de aangepaste curve snel naar de standaarden Lineair, Kwadratisch of Kubisch met de knoppen boven de grafiek.
- **Achtergrond-persistentie**: Als u overschakelt naar een voorinstelling en later terugkeert naar de Aangepaste curve, blijven uw punten bewaard.
- **Gagheiligde serverberekeningen**: De server berekent het verbruik tijdens actieve heats met hetzelfde stuksgewijze lineaire interpolatie-algoritme, zodat de grafiekweergave identiek is aan de actieve race.
