# Racedag-Bediening

## Starten en Pauzeren

Tijdens de racedag doorloopt het systeem geautomatiseerde fasen die worden beheerd door de wedstrijdleider via sneltoetsen, de werkbalk of externe baanknoppen:

### Heats Starten
- **Opstelling & Aftellen**: Zodra een heat wordt gestart, activeert Race Coordinator AI een automatisch aftelproces (instelbaar via automatische start in de race-editor). Geluidstonen en startlichten bereiden de coureurs voor.
- **Groene Vlag**: Zodra de teller op nul staat, schakelt de baanstroom in en gaat de heat naar de status `Racing`.
- **Reactietijd**: Indien "Start achter sensor" actief is, meet de eerste sensordoorkomst de reactietijd bij de start in plaats van een volledige ronde.

### Pauzeren & Gele Vlaggen
- **Een Pauze Activeren**: Door op de spatiebalk te drukken, op het **Pauze**-pictogram te klikken of een externe noodknop in te drukken, wordt direct de gele vlag getoond (`Paused`).
- **Onmiddellijke Stroomonderbreking**: De relais openen ogenblikkelijk om alle auto's stil te zetten.
- **Vastleggen van Deeltijden**: In exact dezelfde milliseconde registreert de hardware de reeds verstreken deeltijd van elke actieve auto en slaat deze op in de openstaande tijd.
- **Uitrollen over de Finishlijn (Drift-rondes)**: Naderde een auto de finishlijn bij het wegvallen van de stroom, dan kan zijn vaart hem over de sensor dragen.
    - Wordt de sensor binnen het ingestelde **Drifttijd**-venster geactiveerd, dan wordt de doorkomst toegekend als **Drift-ronde** (`isDrift: true`). Er verschijnt een **`DRIFT`**-badge in de baanbalk, er klinkt een urgente spraakmelding en de ronde wordt toegekend.
    - Gebeurt dit na het verstrijken van de tijd, dan wordt de doorkomst genegeerd om te voorkomen dat baancommissarissen per ongeluk rondes toekennen.
    - Zie voor meer details [Race-editor: Driftmechanica & Timing van Uitrollen](race-editor.nl.md#drifting-and-drift-timing).

### De Race Hervatten
- **Herstart onder Groen**: Na het opheffen van de pauze start het aftellen opnieuw. Bij groen gaat de stroom weer aan en starten de hardware-timers op nul.
- **Ronde Voltooien (Rondes met Drift Erin)**: Wanneer een gestopte auto weer doorrijdt en onder stroom finisht, combineert zijn rondetijd het deel vóór de pauze met het deel na de herstart. Dit is een **Ronde met Drift Erin**. Als "Rondes met drift uitsluiten van records" is aangevinkt, telt de ronde mee voor de heat, maar kan deze geen records vestigen.

## Ronde- en Tijdaanpassingen

Wedstrijdleiders kunnen handmatig het aantal ronden en de heattijden van coureurs aanpassen rechtstreeks vanaf het racedag-scherm om baanincidenten, gemiste sensordoorkomsten of straffen op te lossen:

### Het Aanpassingsvenster Openen
- **Cel Klikken**: Klik met de linkermuisknop op een cel of kaart van **Rondenaantal** (`lapCount`, `physicalLapCount`) of **Totale Tijd** (`totalTime`, `overallTotalTime`) voor die baan.
- **Wedstrijdleidermenu**: Open het **Wedstrijdleidermenu** en kies **Rondesecties/tijd aanpassen** om coureurs over huidige, voorgaande of nog niet gestarte heats in batch te bewerken.
- **Resultatenschermen**: Tevens toegankelijk via de schermen **Heatresultaten** en **Raceresultaten** om verreden heats achteraf aan te passen.

### Snelle Sneltoetsen (Ronden)
Bij het klikken op een interactieve rondecel:
- **`Shift + Linksklikken`**: Voegt direct +0,25 ronden (+1/4 ronde) toe zonder het dialoogvenster te openen.
- **`Alt + Linksklikken`**: Trekt direct -0,25 ronden (-1/4 ronde) af zonder het dialoogvenster te openen.

### Bedieningselementen in het Dialoogvenster
1. **Baansecties**: Voer baansecties in (bijv. op basis van 100 secties per ronde) om het aantal ronden aan te passen. Een live voorvertoning toont de fractie van ronden (bijv. 25 secties = 0,25 ronden).
2. **Tijdaanpassing**: Voer positieve seconden (straftijd, bijv. `+5.000`) of negatieve seconden (tijdcompensatie, bijv. `-2.500`) in met millisecondeprecisie (`0.001s`).
3. **Live Totale Tijd Voorvertoning**: Het venster berekent en toont de aangepaste totale heattijd van de coureur in realtime voordat de wijzigingen worden toegepast.

### Effect op Standen en Statistieken
- **Aangepaste Ronden**: Verandert direct de positie in **Meeste Ronden**-klassementen en werkt de rondeverschillen (`gapLeader`, `gapPosition`) bij. Fysieke sensorronden, de snelste ronde, de mediaan-rondetijd en de fysieke gemiddelde pace blijven onveranderd.
- **Aangepaste Totale Tijd**: Verandert de positie in **Snelste Totale Tijd**-klassementen, fungeert als primaire tiebreaker bij een gelijk aantal ronden, en werkt de **Gemiddelde Rondetijd** ($\text{Aangepaste Totale Tijd} / \text{Fysieke Ronden}$) en tijdsverschillen bij.
- **Beschermde Statistieken**: De **Snelste Ronde** en de **Mediaan-Rondetijd** blijven strikt behouden op basis van echte sensordoorkomsten en worden nooit gewijzigd door tijdaanpassingen.

---

## Crash and Learn-Operaties {: #crash-and-learn-operations }

Wanneer een race wordt verreden met **Crash and Learn (CNL)** ingeschakeld, registreert Race Coordinator AI baanafgangen (crashes) in realtime, handhaaft crashlimieten, kent straffen toe en regelt diskwalificaties.

### Crashdetectie & Baanoproepknoppen
- **Automatische Crashdetectie**: Indien geconfigureerd en de rondetijd de drempelwaarde voor **Automatische Crashtijd** overschrijdt, detecteert het systeem een baanafgang en telt een crash voor die coureur.
- **Automatische Gele Vlaggen**: Indien **Heat pauzeren bij crash** is ingeschakeld, activeert een automatische crash onmiddellijk een baangele vlag en schakelt de baanvoeding uit.
- **Meerdere Crashes per Ronde**: Indien **Meerdere crashes per ronde toestaan** is ingeschakeld, verzamelt een gestrande auto telkens een extra crash wanneer de crashtijd opnieuw verstrijkt zonder de finishlijn te passeren.
- **Baanoproepknoppen per Baanvak**: Op banen met knoppen per spoor pauzeert het indrukken van een knop de heat en rekent een crash aan dat spoor toe. Het indrukken van andere knoppen tijdens de pauze kent geen extra crashes toe.

### Diskwalificatiemechaniek (DQ)
Overschrijdt een coureur de ingestelde limiet voor **Maximaal Aantal Crashes** (bijv. 4 crashes bij een limiet van 3):
- **Zwarte Vlag**: De status van het spoor schakelt onmiddellijk over naar de zwarte vlag (`flag.disqualified`).
- **Uitschakeling van Spoorvoeding**: Indien relais per spoor aanwezig zijn, wordt de stroom van dat spoor onmiddellijk uitgeschakeld.
- **Ronden Tellen Gestopt**: Sensordoorkomsten en ronden worden voor gediskwalificeerde rijders voor de rest van de heat genegeerd.
- **Directe Deelrondeberekening**: In races met automatische deelronden (`NoneAutoSegments` of `SingleLapAutoSegments`) worden de fracties van de gediskwalificeerde rijder berekend op het moment van diskwalificatie volgens de "niet toestaan te finishen"-methode ($\text{timeSinceLastLap} / \text{medianLapTime}$, gemaximeerd op $0,99$).
- **Positie in het Klassement**: Een gediskwalificeerde coureur kan in de heatstand nooit boven een niet-gediskwalificeerde coureur eindigen. Meerdere gediskwalificeerde rijders worden gerangschikt op basis van hun score aangepast met het **Scorepercentage na Diskwalificatie**.

### Crashes & Straffen Controleren en Aanpassen
Wedstrijdleiders behouden volledige handmatige controle:
- **Crash-Teller Widgets**: Spoor-kolommen tonen het actuele aantal crashes van de heat.
- **Handmatige Crash-Aanpassingen**: Via de knoppen of het dialoogvenster **Baansecties / Tijd Aanpassen** kunnen crashes worden toegevoegd of afgetrokken.
- **Diskwalificatie Terugdraaien**: Zakt het aantal crashes door aftrek weer tot of onder de limiet, dan wordt de diskwalificatie onmiddellijk opgeheven: de vlag wordt groen, de stroom wordt hersteld en straffen worden herberekend.
- **Zichtbaarheid van Straffen**: Straf-ronden en straftijd worden weergegeven in het aanpassingsvenster naast de invoervelden.
