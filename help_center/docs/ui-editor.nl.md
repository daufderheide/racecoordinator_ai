# UI-Editor

## Overzicht

Met de UI-Editor kunt u aangepaste racedag-layouts ontwerpen, de kolommen van het klassement configureren, geluidseffecten en afbeeldingen aanpassen en modulaire [Aangepaste Widgets](custom-widgets.md) laden.

## Aangepaste widgets en widget-map

Aangepaste widgets kunnen worden toegevoegd aan uw aangepaste UI-lay-outs:
- **Map voor aangepaste widgets**: Stel uw lokale widgetmap in via het gedeelte **Aangepaste gebruikersinterface** onderaan de editor.
- **Voorbeeldwidgets bijwerken**: Klik op **Voorbeeldwidgets bijwerken** om kant-en-klare voorbeeldwidgets te genereren of bij te werken in een map `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget-bibliotheekgroepen**: De widget-bibliotheek organiseert widgets in groepen (**Race Coordinator AI**, **Aangepaste hoofdmap** en eigen mappen zoals **sample**) met geneste subgroepen (zoals **Acties** en **Heatgegevens** met gecategoriseerde submappen) en een direct zoekfilter.
- **Dynamische configuratie**: Wanneer een aangepaste widget op het canvas wordt geselecteerd, verschijnen de aangepaste eigenschappen (kleuren, drempelwaarden, schakelaars, tekstvelden) dynamisch in de Widget-configuratie.

Raadpleeg de [Gids voor aangepaste widgets](custom-widgets.md) voor alle ontwikkelingsdetails.

## Layout- en kolomconfiguratie

- Sleep widgets van het palet naar het canvas.
- Pas grootte, positie en uitlijning van widgets aan op uw schermresolutie. Alle widgets blijven begrensd binnen het canvas.
- **Widget-configuratie bediening**:
  - **Positie & grootte**: Positioneer en dimensioneer de geselecteerde widget nauwkeurig met de numerieke velden voor **X**, **Y**, **Breedte** en **Hoogte**.
  - **Widget verwijderen**: Klik op het prullenbak-icoon in de koptekst van de configuratie.
- **Sneltoetsen**:
  - <kbd>Delete</kbd> of <kbd>Backspace</kbd>: Verwijdert de geselecteerde widget uit de layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verplaatst de geselecteerde widget met 1px (of 10px met <kbd>Shift</kbd>).
  - <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Vorige actie ongedaan maken.
  - <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>: Opnieuw uitvoeren.
- Configureer kolomvolgorde, zichtbaarheid, ankers en breedtevoorkeuren.

## Timer-Widget Configuratie

De **Timer**-widget toont de verstreken of resterende heat-/racetijd in verschillende instelbare stijlen:

- **Weergaveformaat**:
  - **Dynamisch (1:23 / 45s)**: Compacte weergave die voorloopnullen weglaat en minuten verbergt onder één minuut.
  - **Minuten & seconden (01:23 / 00:45)**: Vaste twee cijfers voor minuten en seconden, waardoor verspringing van tekstlengte en plotselinge vergroting van het lettertype bij automatisch schalen worden voorkomen.
  - **Minuten & seconden (1:23 / 0:45)**: Behoudt minuten onder één minuut (`0:45`), en gebruikt één cijfer voor minuten vanaf één minuut (`1:23`).
  - **Volledige klok (00:01:23 / 00:00:45)**: Vaste achtcijferige digitale klok (`HH:MM:SS`), ideaal voor langeafstandsraces.
  - **Totale seconden (83s / 45s)**: Toont de totale resterende of verstreken seconden zonder onderverdeling in minuten of uren.
- **Subseconden**:
  - **Onder drempelwaarde**: Toont decimalen (1 tot 3 cijfers) zodra de tijd onder de ingestelde drempelwaarde zakt (bijv. laatste 10 seconden).
  - **Altijd**: Toont continu decimalen gedurende de hele heat.
  - **Nooit**: Beperkt de timer uitsluitend tot hele seconden.
- **Live Voorbeeld**: Het configuratiepaneel bevat een direct voorbeeld waarin te zien is hoe de geselecteerde opmaak eruitziet op verschillende meetpunten (`> 1 hr`, `> 1 min`, `< 1 min` en `< 10s`).

> [!NOTE]
> Precies dezelfde tijdnotatie-opties (weergaveformaat-voorinstellingen, subseconde-modi, drempelwaarde en decimalenschuifregelaar met live voorbeeld) worden ook ondersteund voor **Totale Tijd**-widgets (Heat Totale Tijd en Race/Algemene Totale Tijd) en voor **Totale Tijd**-kolommen in de Baanweergave. Klik in de kolommenlijst van de Baanweergave op het pictogram voor tijdopties (<span class="material-icons">more_time</span>) naast een Totale Tijd-kolom om de tijdnotatie aan te passen.

## Camera QR-code widget

De widget **Camera QR-code** (beschikbaar in de groep **Media & Chrome**) toont een scannbare koppelings-QR-code rechtstreeks op uw racedagscherm:

- **Directe mobiele koppeling**: Hiermee kunnen baancommissarissen en coureurs een smartphone verbinden voor optische rondetijdwaarneming zonder naar de Baaneditor te hoeven navigeren.
- **Interactieve details**: Door in live-modus op de widget te klikken opent een modaal venster met de vergrote QR-code, volledige URL, kopieerknop en lokale testknop.
- **Flexibele netwerkdetectie**: Biedt automatisch een beveiligde Cloudflare HTTPS-tunnel-URL of het lokale IP-adres en poort op basis van uw configuratie.

## Aftel-widgetconfiguratie

De **Aftel-widget** toont de visuele startlichten en regelt de startgeluiden tijdens de startprocedure:

- **Maximaal aantal lampen**: Bepaalt het maximale aantal getoonde startlampen (standaard 5, bereik 1 tot 10). Wanneer de startduur dit aantal overschrijdt (bijvoorbeeld een start van 6 seconden met maximaal 5 lampen), blijven alle lampen tijdens het beginverschil (1 seconde) gedimd/uit voordat de lampen achtereenvolgens oplichten.
- **Infade-animatie**: Bepaalt of de startlichten-overlay en achtergrondvervaging vloeiend infaden bij het begin van de aftelling. Indien uitgeschakeld verschijnen de lichten en achtergrond direct.
- **Oriëntatie**: Schakel tussen **Horizontale** en **Verticale** opstelling van de lichten.
- **Gloed- en vervagingseffecten**: Pas de lichtkrans rondom de lampen, de schaalvergroting van rode/groene lichten en de sterkte of het bereik van de achtergrondvervaging aan.

## Baankolomwidgets & Dupliceren

De widget **Baankolom** maakt het mogelijk om individuele gegevenskolommen uit het baanoverzicht (zoals coureur-info, laatste rondetijd, beste ronde / persoonlijk record, brandstof %, rondehistorie, sectorsnelheden, positie enz.) overal op het canvas te plaatsen als zelfstandige modulaire kaarten.

- **Doelcoureur & Losse Kaarten**:
  - Losse kaarten buiten een raster kiezen welke coureur wordt weergegeven: op **Baan** (Baan 1 t/m Baan 8), op **Heat-positie** (1e, 2e, etc.), op positie in het **Algemeen Klassement** of op **Coureur Seed**.

### Raster Gegevensbronnen: Heat-gegevens vs. Algemene Racegegevens

Elk gegevensraster in de UI-editor beschikt op het tabblad Raster over de instelling **Gegevensbron**, die bepaalt welke coureurs de rijen vullen:

- **Heat-gegevens (`heat`)**:
  - **Coureurbereik**: Exclusief gekoppeld aan de coureurs die actief deelnemen aan de huidige heat op de baan (`heatDrivers`).
  - **Weergavegedrag**: Alleen coureurs die momenteel op de baan rijden in de actieve heat worden getoond. Coureurs die rusten of in andere heats zijn ingedeeld, worden weggelaten.
  - **Paginering & Scrollen**: Het aantal rijen is strikt begrensd door de coureurs van de actieve heat en de fysieke banen. Het raster scrollt nooit voorbij actieve deelnemers naar lege rijen.
- **Algemene Racegegevens (`overall`)**:
  - **Coureurbereik**: Gekoppeld aan **alle geregistreerde deelnemers** van het gehele toernooi of evenement (`participants`).
  - **Weergavegedrag**: Iedere geregistreerde deelnemer kan in het raster worden getoond, ongeacht of hij/zij actief op de baan rijdt of rust in de pits.
  - **Paginering & Scrollen**: Het aantal rijen weerspiegelt het gehele toernooiveld (bijv. 16, 24 of 32 coureurs over meerdere heats). Als het raster minder zichtbare rijen heeft dan het totale aantal deelnemers, ondersteunt het automatisch scrollen over meerdere pagina's om het volledige klassement te doorlopen.
  - **Coureurs Buiten de Baan**: Voor coureurs die momenteel niet op de baan rijden, worden cumulatieve deelnemerstatistieken automatisch aangeleverd.

### Widgets: Heat-gegevenswidgets vs. Algemene Gegevenswidgets

De Toolbox verdeelt gegevenskolommen en -kaarten in de groepen **Heat-gegevens** en **Algemene Gegevens**. De keuze van het widget bepaalt welke statistieken voor elke rij worden berekend en getoond:

- **Heat-gegevenswidgets** (bijv. *Rondeteller, Laatste Rondetijd, Beste Heat-rondetijd, Sectortijd, Reactietijd, Heat-positie / Stand, Heat-verschillen, Brandstof / Telemetrie, Ghost Pacing*):
  - Berekenen prestatiemetingen uitsluitend voor de **actieve heat**.
  - **In een Heat-gegevensraster**: Elke rij toont live realtime-telemetrie en rondetijden van de voertuigen die op de baan rijden.
  - **In een Algemeen Gegevensraster**: Coureurs op de baan tonen hun live heat-telemetrie; coureurs die rusten of inactief zijn tonen streepjes (`--`) of nullen voor heat-specifieke waarden, aangezien zij geen gegevens produceren in de lopende heat.
- **Algemene Gegevenswidgets** (bijv. *Algemene Stand / Positie, Totaal Aantal Ronden, Fysieke Ronden, Totale Tijd, Baanrecord, Algemeen Gemiddelde, Algemene Mediaan, Algemene Consistentie, Algemene Tijdsverschillen, Winkans / Voorspellingen, Heats Gereden / Heats Resterend*):
  - Berekenen cumulatieve prestatiemetingen over **alle voltooide heats** in het toernooi.
  - **In een Algemeen Gegevensraster**: Elke coureurrij (actief op de baan of rustend tussen heats) toont zijn volledige toernooidata, totaal gereden ronden, snelste toernooironde en positie in het algemeen klassement.
  - **In een Heat-gegevensraster**: De actieve heat-coureurs tonen hun algemene toernooistand en evenementstatistieken zij aan zij met hun actieve heat-ronden (bijv. het toernooiklassement volgen tijdens de actieve race).

#### Heats Gereden & Resterend Widget

Het widget **Heats Gereden** (`heatsRaced`) toont de voortgang van de deelname aan heats voor elke deelnemer:

- **Heats Gereden (Standaardmodus)**: Toont het aantal heats dat de coureur reeds heeft voltooid of momenteel rijdt in het toernooi.
- **Modus Heats Resterend**: Wanneer de instelling **Heat-weergavemodus** wordt omgeschakeld van *Gereden heats* naar *Resterende heats*, toont de kaart hoeveel geplande heats de coureur nog moet rijden. Als er geen aangepast kolomkoplabel is ingesteld, verandert de kop automatisch van `HEATS GEREDEN` naar `HEATS RESTEREND`.
- Deze configuratie is tevens beschikbaar voor insets op elke kolomkaart.

#### Verschil-Widgets (Gaps & Intervallen)

Race Coordinator AI ondersteunt **4 afzonderlijke verschil-widgets** voor zowel Heat-gegevens als Algemene Gegevens:

1. **Verschil met de Leider (`gapLeader` / `overallGapLeader`)**: Continue pace-projectie van het berekende tijdsverschil met de leider (P1).
2. **Verschil met de Voorligger (`gapPosition` / `overallGapPosition`)**: Continue pace-projectie van het berekende tijdsverschil met de directe voorligger.
3. **Formule 1-verschil met de Leider (`gapLeaderF1` / `overallGapLeaderF1`)**: Exact tijdsverschil aan de finishlijn in dezelfde ronde of rondenachterstand (`+1 Ronde`, `+N Ronden`) bij een dubbeling.
4. **Formule 1-verschil met de Voorligger (`gapPositionF1` / `overallGapPositionF1`)**: Exact tijdsverschil aan de finishlijn met de voorligger in dezelfde ronde of rondenachterstand (`+1 Ronde`, `+N Ronden`).

Voor gedetailleerde wiskundige formules en tijdmetingsspecificaties, zie de [Gids voor Verschilberekeningen](gap-calculations.md).

### Rastersortering & Interactiematrix

De keuzelijst **Raster Sortering** op het tabblad Raster bepaalt de rijenvolgorde. De werking hangt direct af van de gekozen **Gegevensbron** (**Heat-gegevens** of **Algemene Gegevens**):

| Sorteeroptie | In een Heat-gegevensraster (`gridType: heat`) | In een Algemeen Gegevensraster (`gridType: overall`) |
| :--- | :--- | :--- |
| **Baan** | Statische volgorde op fysieke baan (Baan 1, Baan 2, ...). Elke rij is gekoppeld aan een specifieke baan en de actieve coureur daarop. | Actieve coureurs op de baan verschijnen eerst op baannummer (Baan 1, Baan 2, ...), gevolgd door alle rustende deelnemers gesorteerd op positie in het algemeen klassement. |
| **Heat-positie** | Dynamische live hersortering op positie in de actieve heat (1e, 2e, 3e in de heat). Rijen wisselen direct van positie bij doorkomsten of inhaalacties. | Actieve coureurs verschijnen bovenaan gesorteerd op heat-positie (1e, 2e, ...), gevolgd door alle inactieve deelnemers gesorteerd op algemeen klassement. |
| **Algemeen Klassement** | Sorteert **uitsluitend de coureurs van de actieve heat** op basis van hun algemene toernooiklassement. (Rijden bijv. de nummers 2, 5, 8 en 14 van het klassement in de heat, dan sorteren de 4 rijen hen als #2, #5, #8, #14). Toont nooit deelnemers van buiten de heat en veroorzaakt geen lege rijen. | Sorteert het **volledige deelnemersveld** op basis van het algemeen raceklassement (1e algemeen, 2e algemeen, 3e algemeen, ...). Het gehele veld sorteert live opnieuw wanneer punten en ronden worden bijgewerkt. |
| **Coureur Seed** | Sorteert de actieve heat-coureurs op hun oorspronkelijke kwalificatie-/plaatsingsnummer (laagste seed eerst). | Sorteert alle toernooideelnemers op hun initiële plaatsingspositie (Seed 1, Seed 2, Seed 3, ...) over het gehele veld. |
- **Layout-oriëntatie**: Ondersteunt **Verticaal** (kop boven de waarde) en **Horizontaal** (kop en waarde naast elkaar).
- **Vormgeving & Aanpassing van de Titelbalk**:
  - De titelbalk is standaard vormgegeven volgens de kolomkop in de baanweergave (half-transparante donkere achtergrond `rgba(68, 68, 68, 0.7)`, vette witte tekst, afgeronde bovenhoeken en een scheidingsrand).
  - **Kolomkop Weergeven**: Schakelt de titelbalk in of uit. Indien uitgeschakeld wordt de titelbalk volledig verwijderd van de kaart, waardoor maximale ruimte vrijkomt voor de hoofdwaarden en inzetcellen.
  - **Aangepaste Kolomkop**: Overschrijf de standaardnaam van het datapunt met een eigen titellabel.
  - **Typografie & Uitlijning**: Pas het lettertype, de lettergrootte en de tekstuitlijning (Links, Gecentreerd, Rechts) van de titelbalk naar wens aan.
  - **Tekst- & Achtergrondkleur**: Pas de achtergrondkleur en tekstkleur van de titelbalk eenvoudig aan via kleurkiezers, met éénknops-herstel naar de standaardwaarden.
- **Kleur-overname & Aanpassingen**: Kaarten nemen standaard de toegewezen achtergrond- en tekstkleur van de betreffende baan over (`Baankleuren Gebruiken`), of kunnen worden voorzien van aangepaste kleuren en randen.
- **Dupliceren over Banen / Posities**:
  - In plaats van kaarten handmatig voor elke baan te maken en uit te lijnen, configureert u één baan of positie en klikt u in het configuratiepaneel op **Dupliceren over Banen / Posities...**.
  - Kies de richting (**Horizontaal** naast elkaar of **Verticaal** boven elkaar), het totale aantal doelbanen/posities (standaard het maximale aantal banen over alle circuits in de database), de afstandsmodus (**Automatisch Passend Maken** of **Afstand Behouden**) en eventueel het overschrijven van bestaande widgets.
  - **Realtime Duplicatiemodus**: Bij het dupliceren schakelt de editor over naar een interactieve blauwdrukmodus met visuele baanrasterlijnen en magnetisch uitlijnen. In deze modus plaatst, schaalt en bewerkt u widgets direct in Baan 1 (Master); wijzigingen worden onmiddellijk in realtime gespiegeld naar alle overige banen. Gespiegelde widgets in banen 2..N zijn alleen-lezen live previews; klikken op een gespiegeld widget verplaatst de focus automatisch naar de master van Baan 1.
  - **Slim Rasterbereik & Formaat Wijzigen**: Het duplicatiegebied breidt zich automatisch in alle vier de richtingen uit om de beschikbare canvasruimte te vullen totdat het tegen de grenzen van bestaande widgets buiten het raster botst. U kunt de totale grootte van het raster aanpassen via de 8 handgrepen op de omtrek van het raster.
  - Klik op **Voltooid** om het raster vast te leggen als onafhankelijke widgets.
  - **Sjabloon Opnieuw Bewerken & Loskoppelen**: Als u later een widget van het raster selecteert, toont de Widget-configuratie een kaart waarmee u op **Rastersjabloon Bewerken** kunt klikken (om op elk moment weer naar realtime duplicatiemodus terug te keren) of **Loskoppelen van Raster** (om de koppeling permanent te verbreken).

### Rastersynchronisatie: Kolommen koppelen vs. Rijen spiegelen

Een raster in Race Coordinator AI is een tweedimensionale matrix bestaande uit:

- **Rijen (Deelnemersposities)**: Vertegenwoordigen elke fysieke circuitbaan (**Baan 1, Baan 2, ...**) of racepositie (**Positie 1, Positie 2, ...**). Bij een horizontale rasterrichting worden deze posities als verticale kolommen weergegeven.
- **Kolommen (Gegevensvelden)**: Vertegenwoordigen afzonderlijke gegevensstatistieken binnen een positie (bijv. *Coureurnaam, Heat-rondenaantal, Laatste Rondetijd, Beste Ronde, Verschil, Autobewijzing*).

De Raster-inspector biedt twee essentiële synchronisatieknoppen in de sectie **Rasterstructuur & Layout**: **Kolommen koppelen** en **Rijen spiegelen** (aangeduid als **Kolommen spiegelen** bij een horizontale layout).

#### Kolommen koppelen

**Kolommen koppelen** regelt de synchronisatie van de visuele stijl over alle verschillende gegevenskolommen in het raster.

- **Ingeschakeld (Standaard)**:
  - Alle gegevenskolommen delen een identieke visuele stijl.
  - Het wijzigen van een stijleigenschap op een willekeurige kolom wordt onmiddellijk en automatisch gesynchroniseerd naar alle kolommen in het raster.
  - **Gesynchroniseerde Eigenschappen**:
    - **Kopstijl**: Lettertype, lettergrootte, tekstkleur, achtergrondkleur, tekstuitlijning en kophoogte.
    - **Gegevenscelstijl**: Lettertype, lettergrootte, tekstkleur, achtergrondkleur, wisselen van baankleuren (`useLaneColors`) en waarde-uitlijning.
    - **Randstijl**: Randweergave, randkleur, randbreedte en hoekafronding.
    - **Tijdnotatie**: Aantal decimalen, weergaveformaat en subseconde-precisiedrempels.
    - **Telemetrie-accent**: Rijmarkering bij doorkomst/ronde.
  - **Interactie met niet-gespiegelde rijen**: Wanneer **Rijen spiegelen** is uitgeschakeld, zijn de rijen van elkaar ontkoppeld. Als **Kolommen koppelen** is ingeschakeld, worden visuele stijlwijzigingen (zoals achtergrondkleur, tekstkleur of lettertypen) op een kolom doorgevoerd naar alle kolommen *binnen die specifieke rij*, zonder andere rijen te beïnvloeden.
- **Uitgeschakeld**:
  - Ontkoppelt de stijl van de kolommen. Elke kolom kan een eigen lettergrootte, kleur, rand en uitlijning krijgen (bijv. een grote, vette gele tekst met kader voor de *Coureurnaam*, terwijl het *Rondenaantal* een kleine witte tekst zonder rand behoudt).
  - Indien uitgeschakeld verschijnen er in de inspector onder elk stijlgedeelte knoppen (**Kopstijl / Waardestijl / Randstijl / Formaat toepassen op alle kolommen**) om selectief en op aanvraag een specifieke stijlcategorie naar alle kolommen door te voeren.
- **Gedrag bij Uitschakelen**:
  - Wordt direct in de configuratie opgeslagen.
  - **Visuele Toestand van het Raster**: Bestaande kolomstijlen veranderen **niet** direct bij het uitschakelen; het raster behoudt zijn huidige uiterlijk.
  - **Gebruikersactie Vereist**: Om visuele verschillen te zien, moet de gebruiker een specifieke kolom selecteren en de stijlinstellingen aanpassen. Alleen de bewerkte kolom past zich aan.
- **Gedrag bij Opnieuw Inschakelen**:
  - Activeert de automatische synchronisatie voor toekomstige bewerkingen.
  - **Visuele Toestand van het Raster**: Het opnieuw aanvinken van het selectievakje overschrijft andere kolommen **niet** direct met de stijlen van de actieve kolom; bestaande stijlen blijven ongewijzigd.
  - **Gebruikersactie Vereist**: De gebruiker moet een stijleigenschap wijzigen (bijv. de lettergrootte met 1px aanpassen, een kleur wijzigen of een rand in-/uitschakelen) op een willekeurige kolom. Zodra deze bewerking plaatsvindt, wordt de nieuwe eigenschap direct naar alle kolommen in het raster verspreid. Men kan ook op een van de expliciete knoppen «Toepassen op alle kolommen» klikken.

#### Rijen spiegelen (of Kolommen spiegelen)

**Rijen spiegelen** beheert de duplicatie en geometrische synchronisatie van rij naar rij, uitgaande van de **Hoofdrij (Baan 1 / Positie 1 Master)** naar alle overige rijen (**Banen 2..N**).

- **Ingeschakeld (Standaard)**:
  - Alle niet-master rijen spiegelen exact de hoofdrij.
  - Elke verschuiving, formaataanpassing, layoutwijziging of eigenschapsverandering in de master-cel wordt onmiddellijk in realtime gerepliceerd naar alle overige banen of posities.
  - Niet-master widgets in het raster zijn gekoppeld aan de master en tonen de status **Gespiegeld** (bijv. `Baan 2 (Gespiegeld)`).
- **Uitgeschakeld**:
  - Ontkoppelt de niet-master rijen van het mastersjabloon.
  - Niet-master widgets tonen de status **Onafhankelijk** (bijv. `Baan 2 (Onafhankelijk)`).
  - De gebruiker kan op elke afzonderlijke rij klikken (bijv. Baan 2 of Positie 3) en de eigenschappen, tekstkleuren, achtergrondkleuren of datatoewijzingen onafhankelijk aanpassen, zonder de master of andere banen te beïnvloeden.
  - Onder het selectievakje in de inspector verschijnt de knop **Opnieuw spiegelen naar alle rijen**.
- **Gedrag bij Uitschakelen**:
  - Treedt direct in werking in de configuratie.
  - **Visuele Toestand van het Raster**: De layout en celposities verschuiven of veranderen **niet** direct; de huidige posities en stijlen blijven behouden.
  - **Gebruikersactie Vereist**: De gebruiker moet een niet-master cel selecteren en bewerken om baanspecifieke aanpassingen door te voeren.
- **Gedrag bij Opnieuw Inschakelen**:
  - Schakelt de master-replicatie in het raster weer in.
  - **Onmiddellijke Update**:
    - Vinkt de gebruiker het selectievakje **Rijen spiegelen** opnieuw aan terwijl een **master-widget** is geselecteerd, dan wordt de master-layout direct opnieuw naar alle gespiegelde banen doorgevoerd, waardoor individuele rij-aanpassingen worden overschreven.
    - Klikt de gebruiker op de knop **Opnieuw spiegelen naar alle rijen**, dan voert de editor onmiddellijk een volledige rastersynchronisatie uit (`syncAllMasterWidgetsToLanes`), legt het raster vast en werkt zowel het canvas van de UI-editor als de live racepreview direct bij zonder verdere handelingen.

#### Vergelijkingstabel

| Bediening | Richting / Bereik | Wat wordt gesynchroniseerd | Gedrag bij Uitschakelen | Gedrag bij Opnieuw Inschakelen | Direct vs. Gebruikersactie Vereist |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kolommen koppelen** | Horizontaal (Tussen Kolommen) | Visuele stijl: lettertypen, groottes, tekst-/achtergrondkleuren, randen, koppen, tijdnotaties, markeringen | Kolommen worden onafhankelijk; bestaande stijlen blijven bewaard; knoppen «Toepassen op alle kolommen» verschijnen | Activeert auto-sync voor toekomstige aanpassingen; overschrijft andere kolommen niet direct | **Gebruikersactie Vereist**: Het omzetten van het vinkje wijzigt bestaande stijlen niet. De gebruiker moet een stijleigenschap bewerken om de koppeling actief te maken. |
| **Rijen spiegelen** | Verticaal (Tussen Rijen / Banen) | Geometrie en instellingen: celbreedte/-hoogte, marges, bindingen gekopieerd van Baan 1 Master naar Banen 2..N | Rijen worden onafhankelijk; inspector toont status `Onafhankelijk`; banen individueel aanpasbaar; knop `Opnieuw spiegelen` verschijnt | Herstelt master-replicatie; master-sjabloon overschrijft individuele baanaanpassingen | **Direct bij Master-selectie of klik op knop**: Klikken op `Opnieuw spiegelen naar alle rijen` of opnieuw activeren op de Master lijnt alle rijen direct uit. Uitschakelen behoudt layout tot bewerking. |

