# Slotcar-editor

De **Slotcar-editor** houdt een lijst bij van je slotcars: wat ze zijn, in welke klasse ze rijden, hun schaal en hun afstelling. Open hem vanuit Race Day Setup met **Beheren → Slotcars**.

!!! note
    Kies in Race Day Setup een auto voor elke coureur en wissel auto's tussen de heats. Elke heat bewaart de auto zoals hij op de baan stond, dus de uitslagen houden de juiste auto, ook als je hem later aanpast.

    Het label **Preview** naast de titel betekent dat deze functie nog vorm krijgt. Ze kan nog flink veranderen, of zelfs verdwijnen, terwijl we feedback verzamelen. Laat ons weten wat je ervan vindt op GitHub of SlotForum.

## Overzicht

De Slotcar-editor werkt zoals de Team Editor:

- **Autokeuze**: De keuzelijst naast de paginatitel toont al je auto's, gesorteerd op naam.
- **Alleen-lezen**: Bij het openen zie je de gekozen auto met alle velden vergrendeld.
- **Bewerkmodus**: Klik op het **Bewerken**-icoon (potlood) om de velden te ontgrendelen. Tijdens het bewerken is de autokeuze vergrendeld.
- **Automatisch opslaan**: Wijzigingen worden op de achtergrond opgeslagen terwijl je ze maakt.
- **Wijzigingen verwerpen**: Verlaat je de editor met niet-opgeslagen of ongeldige wijzigingen, dan wordt om bevestiging gevraagd. Verwerpen zet de auto terug naar de laatst opgeslagen versie.

## Werkbalkacties

- **Terug**: Terug naar Race Day Setup.
- **Slotcar toevoegen (+)**: Maakt een nieuwe auto en opent hem om te bewerken.
- **Dupliceren**: Kopieert de gekozen auto onder een nieuwe, unieke naam. Handig voor een tweede auto van hetzelfde type.
- **Bewerken / Klaar**: Wisselt tussen alleen-lezen en bewerkmodus.
- **Verwijderen**: Verwijdert de gekozen auto na bevestiging.
- **Ongedaan maken / Opnieuw**: Stapt terug of vooruit door je recente wijzigingen.
- **Help (?)**: Start de rondleiding.

## De auto {: #car-profile }

Het linkerpaneel bevat wat de auto is:

- **Foto**: Kies een afbeelding of upload een foto van de auto.
- **Naam**: Verplicht en uniek onder je auto's (bijvoorbeeld "Porsche 911 RSR #92").
- **Merk / fabrikant**: Bijvoorbeeld Scalextric, Carrera, Slot.it of NSR.
- **Klasse**: De klasse waarin de auto rijdt, zoals GT3 of Classic. Tijdens het typen worden de klassen van je andere auto's voorgesteld, zodat dezelfde klasse altijd hetzelfde gespeld wordt.
- **Schaal**: 1/24, 1/32, 1/43, 1/64 (HO), Anders of Niet ingesteld.

## Afstelling {: #car-setup }

Het rechterpaneel bevat hoe de auto is afgesteld. Elk veld is vrije tekst, zodat je het kunt beschrijven zoals jouw club dat doet:

- **Motor**: Bijvoorbeeld "Slot.it V12/4 21.5k", of pancake / inline voor HO.
- **Magneet**: Type en sterkte, of "geen" voor racen zonder magneet.
- **Chassis**, **Overbrenging** (bijvoorbeeld 9/27) en **Banden**.
- **Aangepast**: Vink aan als de auto anders is dan uit de doos; laat leeg voor een standaard auto.
- **Notities**: Alles wat verder over de auto te zeggen is.

## Je eigen velden {: #car-custom-fields }

Onder de afstelling kun je eigen velden toevoegen, voor alles wat je club bijhoudt (bijvoorbeeld gewicht, rondsel of gids). Klik in de bewerkmodus op **Velden beheren**:

- **Nieuw veld**: geef het een naam en kies een type: **Tekst**, **Getal**, **Ja / nee** of **Keuze uit een lijst** (één keuze per regel).
- **Bewerken**: hernoem een veld of pas de keuzes aan. Het type kan niet meer veranderen nadat het veld is toegevoegd.
- **Omhoog / omlaag**: verandert de volgorde van de velden.
- **Verwijderen**: verwijdert het veld, en de waarde bij elke auto, na bevestiging.

Elke auto krijgt dezelfde velden en houdt zijn eigen waarden. Een veld dat je leeg laat, blijft leeg.

## Slotcars in een race {: #car-in-race }

- **Race Day Setup**: klik in de lijst met coureurs die meedoen op het auto-icoon van een rij om een slotcar te kiezen. Een team kiest **Eén auto voor het team** of **Een auto per coureur**. RC AI onthoudt je keuze voor de volgende race.
- **Wisselen tussen de heats**: open op de racedag **Race Directeur → Slotcars…**. Daar staat de volgende heat baan voor baan; kies een andere auto en hij wordt meteen gewisseld. Tijdens een heat zijn de lijsten op slot.
- **Heats wijzigen**: het auto-icoon bij een coureur verandert zijn auto voor alle heats die nog niet gereden zijn.
- **Uitslagen**: elke heat bewaart een kopie van de auto zoals hij reed, dus een auto later aanpassen of verwijderen verandert oude uitslagen niet.

Het auto-icoon en de menuoptie Slotcars… verschijnen pas als er slotcars in de database staan.

## Auto's blijven in hun baan (IROC) {: #cars-in-lanes }

In een IROC-race blijven de auto's de hele race in hun baan en rouleren de coureurs door de banen, zodat elke coureur met elke auto rijdt.

- **Race-editor**: vink **Auto's blijven in hun baan (IROC)** aan in het onderdeel **Heats**.
- **Race Day Setup**: onder de lijst **Racende Coureurs** staat een vak **Auto's per baan**. Klik erop om de auto voor elke baan te kiezen. RC AI onthoudt de auto's per circuit. De auto-iconen bij de coureurs zijn verborgen, want de auto hoort bij de baan.
- **Wisselen tussen heats**: **Race Directeur → Slotcars…** toont elke baan met zijn auto. Een nieuwe auto telt vanaf de volgende heat die nog niet gereden is.
- **Uitslagen**: elke heat bewaart de auto van elke baan, dus je ziet welke coureur met welke auto reed.

## Slotcars in de resultaten {: #cars-in-results }

De resultaten tonen de auto waarmee elke rijder reed, zoals die in die heat was. Als je een auto later aanpast, blijven oude resultaten gelijk.

- **Heatresultaten** en de resultatenpagina van een rijder: elke heatkaart toont de auto naast de baan. Wijs hem aan om klasse, schaal en afstelling te zien.
- **Raceresultaten**: elke rijder toont zijn auto onder zijn naam. Reed hij met meer dan één auto (een IROC-race of een wissel), dan staat er hoeveel; wijs het aan om de lijst te zien.
