# Race-editor

## Brandstofinstellingen

Race Coordinator AI ondersteunt een uitgebreide brandstofsimulatie voor zowel analoge als digitale banen, inclusief aanpasbare brandstoftankcapaciteit, startniveau, pitstopvertragingen, tanksnelheden, strafmaatregelen bij een lege tank en brandstofverbruiksmodellen.

### Brandstofverbruiksmodellen

Het brandstofverbruik per ronde (analoog) of per seconde (digitaal) kan worden geregeld via wiskundige voorinstellingen of een interactief aangepast profiel:

- **Lineair**: Het brandstofverbruik schaalt lineair met de snelheid of het gasniveau.
- **Kwadratisch**: Het brandstofverbruik stijgt kwadratisch bij snellere rondetijden of hogere gasstanden.
- **Kubisch**: Het brandstofverbruik stijgt steil bij extreme snelheden en vol gas.
- **Aangepaste curve**: Biedt fijne controle over het brandstofverbruik door interactieve controlepunten rechtstreeks op de verbruiksgrafiek te verslepen.

### Interactieve bewerking van de aangepaste curve

Wanneer **Aangepaste curve** is geselecteerd als verbruikstype, verschijnen handgrepen direct op de SVG-curve:

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
