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

### Inset-widgets & uitlijning

Elke baankolomkaart ondersteunt tot 8 secundaire **inset-slots** langs de rand van de primaire meetwaarde (Linksboven, Middenboven, Rechtsboven, Middenlinks, Middenrechts, Linksonder, Middenonder, Rechtsonder):

- **Gegevenskoppeling**: Insets kunnen secundaire meetwaarden weergeven (bijv. beste ronde, rondenaantal, brandstof %, verreden heats, coureurnaam), afbeeldingen/avatars of ingesloten aangepaste widgets.
- **Horizontale & verticale uitlijning**:
  - Op het Inset-tabblad van de inspector biedt elke geplaatste inset opties voor **Horizontale uitlijning** (**Links**, **Midden**, **Rechts**) en **Verticale uitlijning** (**Boven**, **Midden**, **Onder**).
  - Insets gebruiken standaard hun natuurlijke randpositie (bijv. `Linksboven` gebruikt standaard Links/Boven, `Rechtsonder` gebruikt Rechts/Onder), waardoor volledige visuele compatibiliteit met bestaande lay-outs behouden blijft terwijl nauwkeurige afstemming binnen elk slot mogelijk is.
- **Aangepaste stijlen**: Insets kunnen kolomlettertypen en -kleuren overnemen of aangepaste typografie, tekstkleuren, decimalen en opmaakdrempels configureren.

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

Race Coordinator AI biedt **2 configureerbare verschil-widgets** voor Heat-gegevens en Algemene Gegevens:

1. **Heat-verschil (`gap`)**: Berekent intervallen in realtime uitsluitend tussen auto's die actief racen in de huidige heat.
2. **Algemeen verschil (`overallGap`)**: Berekent cumulatieve intervallen over alle deelnemers aan het evenement.

Elke verschil-widget kan in de Kolom-inspector worden aangepast met twee kernopties:
- **Doel**:
  - **Leider**: Verschil ten opzichte van de huidige raceleider (P1).
  - **Voorgaande positie**: Verschil ten opzichte van de directe voorligger in de stand (bijv. P3 t.o.v. P2).
- **Berekeningsmodus**:
  - **Altijd tijd**: Continue pace-projectie van het tijdsverschil in seconden (`+X.XXX`).
  - **Tijd en ronden achterstand**: Formule 1-weergave met tijdsverschil in dezelfde ronde of rondenachterstand (`+1 Ronde`, `+N Ronden`) bij een dubbeling.
  - **Altijd ronden**: Exact rondenverschil berekend bij finishdoorkomst, inclusief de partiële rondevoortgang van de vergeleken coureur.

> [!NOTE]
> Meerdere verschil-widgets met verschillende configuraties (bijvoorbeeld een Leider-verschilkolom en een Voorligger-verschilkolom) kunnen gelijktijdig op hetzelfde raster of layout worden geplaatst.

Voor gedetailleerde wiskundige formules en tijdmetingsspecificaties, zie de [Gids voor Verschilberekeningen](gap-calculations.md).

#### Laatste Ronden Widget (`lastLaps`)

De widget **Laatste Ronden** (`lastLaps`) toont de recent gereden rondetijden van de coureur in de actieve heat:

- **Weer te geven laatste ronden**: Bepaalt hoeveel recente ronden in de widget worden getoond (schuifregelaar 1–20, numeriek invoerveld 1–50). De standaardwaarde is `5`.
- **Dynamische schaling en pasvorm**: De kaart schaalt lettergroottes en regelafstanden automatisch om het geconfigureerde aantal ronden netjes in de kolomgeometrie te passen.
- **Grid-synchronisatie**: In banengrids synchroniseert het configureren of toepassen van tijdopmaken het aantal weergegeven ronden over alle deelnemende banen.

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

### Rastersynchronisatie: Kolommen spiegelen vs. Rijen spiegelen

Een raster in Race Coordinator AI is een tweedimensionale matrix georganiseerd in deelnemersposities en gegevensstatistieken:

- **Verticale Richting (Standaard)**:
  - **Rijen (Deelnemersposities)**: Vertegenwoordigen elke fysieke circuitbaan (**Baan 1, Baan 2, ...**) of racepositie (**Positie 1, Positie 2, ...**).
  - **Kolommen (Gegevensvelden)**: Vertegenwoordigen afzonderlijke gegevensstatistieken binnen een positie (bijv. *Coureurnaam, Heat-rondenaantal, Laatste Rondetijd, Beste Ronde, Verschil, Autobewijzing*).
  - **Kolommen spiegelen**: Regelt de synchronisatie van de visuele stijl over alle verschillende gegevenskolommen.
  - **Rijen spiegelen**: Beheert de duplicatie en geometrische synchronisatie van rij naar rij, uitgaande van de **Hoofdrij (Baan 1 / Positie 1 Master)** naar alle overige rijen (**Banen 2..N**).
- **Horizontale Richting**:
  - **Kolommen (Deelnemersposities)**: Vertegenwoordigen elke fysieke circuitbaan (**Baan 1, Baan 2, ...**) of racepositie (**Positie 1, Positie 2, ...**). Elke baan in een heat-weergave is een kolom.
  - **Rijen (Gegevensvelden)**: Vertegenwoordigen verticaal onder elkaar gestapelde gegevensstatistieken binnen elke baan.
  - **Kolommen spiegelen**: Beheert de duplicatie van kolom naar kolom, geometrie en stijl, uitgaande van de **Hoofdkolom (Baan 1 / Positie 1 Master)** naar alle overige kolommen (**Banen 2..N**). Bij uitschakeling worden kolommen (banen) onafhankelijk en verschijnt de knop **Opnieuw spiegelen naar alle kolommen**.
  - **Rijen spiegelen**: Regelt de synchronisatie van de visuele stijl over alle gegevensrijen (statistieken).

De Raster-inspector biedt twee essentiële synchronisatieknoppen in de sectie **Rasterstructuur & Layout**: **Kolommen spiegelen** en **Rijen spiegelen**.

#### Kolommen spiegelen

**Kolommen spiegelen** synchroniseert kolommen over het hele raster:
- Bij **Verticale Richting** vertegenwoordigen kolommen verschillende gegevensvelden/statistieken. Kolommen spiegelen harmoniseert de visuele stijl over deze gegevenskolommen.
- Bij **Horizontale Richting** vertegenwoordigen kolommen individuele circuitbanen of raceposities. Kolommen spiegelen regelt de duplicatie, dimensionering en stijl vanaf de **Hoofdkolom (Baan 1 / Positie 1)** naar alle overige circuitbanen.

- **Ingeschakeld (Standaard)**:
  - Kolommen delen gekoppelde stijlen (in verticale richting) of volledige replicatie van het mastersjabloon (in horizontale richting).
  - Elke aanpassing aan de master wordt direct doorgevoerd naar alle kolommen.
  - **Gesynchroniseerde Eigenschappen**:
    - **Kopstijl**: Lettertype, lettergrootte, tekstkleur, achtergrondkleur, tekstuitlijning en kopafmetingen.
    - **Gegevenscelstijl**: Lettertype, lettergrootte, tekstkleur, achtergrondkleur, wisselen van baankleuren (`useLaneColors`) en waarde-uitlijning.
    - **Randstijl**: Randweergave, randkleur, randbreedte en hoekafronding.
    - **Tijdnotatie**: Aantal decimalen, weergaveformaat en subseconde-precisiedrempels.
    - **Telemetrie-accent**: Rijmarkering bij doorkomst/ronde.
- **Uitgeschakeld**:
  - Ontkoppelt de kolomsynchronisatie.
  - Bij verticale richting kan elke gegevenskolom eigen lettergroottes, kleuren en randen krijgen, en verschijnen er knoppen om stijlen handmatig naar alle kolommen door te voeren.
  - Bij horizontale richting wordt elke baankolom onafhankelijk, tonen widgets de status **Onafhankelijk** (bijv. `Baan 2 (Onafhankelijk)`), en verschijnt de knop **Opnieuw spiegelen naar alle kolommen**.
- **Gedrag bij Opnieuw Inschakelen**:
  - Activeert de kolomsynchronisatie weer. Bij horizontale richting synchroniseert het opnieuw aanvinken van het selectievakje of het klikken op **Opnieuw spiegelen naar alle kolommen** direct alle kolommen opnieuw met de master-baan.

#### Rijen spiegelen

**Rijen spiegelen** synchroniseert rijen over het hele raster:
- Bij **Verticale Richting** vertegenwoordigen rijen individuele circuitbanen of posities. Rijen spiegelen regelt de duplicatie en geometrische synchronisatie van rij naar rij vanaf de **Hoofdrij (Baan 1 / Positie 1)** naar alle overige rijen (**Banen 2..N**).
- Bij **Horizontale Richting** vertegenwoordigen rijen de verschillende gegevensvelden of statistieken binnen elke baan. Rijen spiegelen regelt de visuele stijlsynchronisatie tussen de statistiekrijen.

- **Ingeschakeld (Standaard)**:
  - Rijen volgen strikt het mastersjabloon (in verticale richting) of delen gesynchroniseerde stijlen (in horizontale richting).
  - Elke verschuiving, formaataanpassing of instellingswijziging in de mastercel wordt direct in realtime gerepliceerd naar alle overige banen of posities.
  - Bij verticale richting tonen niet-master widgets de status **Gespiegeld** (bijv. `Baan 2 (Gespiegeld)`).
- **Uitgeschakeld**:
  - Ontkoppelt rijen.
  - Bij verticale richting tonen niet-master rijen de status **Onafhankelijk** (bijv. `Baan 2 (Onafhankelijk)`), kunnen banen individueel worden aangepast en verschijnt de knop **Opnieuw spiegelen naar alle rijen**.
  - Bij horizontale richting kan elke gegevensrij eigen stijlen krijgen zonder andere rijen te beïnvloeden.
- **Gedrag bij Opnieuw Inschakelen**:
  - Activeert de rijduplicatie en -synchronisatie weer. Bij verticale richting lijnt het klikken op **Opnieuw spiegelen naar alle rijen** of opnieuw aanvinken van het vakje direct alle rijen uit met de master.

#### Extra rijen

Wanneer een raster onbezette rijen bevat (bijvoorbeeld wanneer er minder coureurs deelnemen aan een race of heat dan er rijen/banen zijn geconfigureerd), bepaalt de instelling **Extra rijen** in de Raster-inspector het gedrag:

- **Verwijderen**: Verwijdert automatisch overtollige onbezette rijen en kolommen, zodat het raster exact aansluit op het werkelijke aantal deelnemers. (Standaard voor rasters met **Algemeen Klassement** en **Coureur Seed**).
- **Leeg weergeven**: Behoudt de extra rijen en toont `--` voor alle waarden en insets, met behoud van kaartstructuren en kolomkoppen. (Standaard voor rasters met **Heat** en **Baan**).
- **Blanco weergeven**: Behoudt de extra rijen en toont alleen de randen en achtergrond van de kaarten, zonder waarden of koppen.

#### Vergelijkingstabel

| Bediening | Richting | Bereik | Wat wordt gesynchroniseerd | Gedrag bij Uitschakelen | Gedrag bij Opnieuw Inschakelen |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kolommen spiegelen** | Verticaal | Kolommen (Gegevensstatistieken) | Visuele stijl: lettertypen, groottes, kleuren, randen, koppen, formaten | Kolommen worden onafhankelijk; bestaande stijlen blijven behouden; knoppen «Toepassen op alle kolommen» verschijnen | Activeert automatische synchronisatie voor toekomstige bewerkingen |
| **Kolommen spiegelen** | Horizontaal | Kolommen (Banen / Deelnemers) | Geometrie, replicatie en stijlen van Baan 1 Master naar alle baankolommen | Baankolommen worden onafhankelijk; status `Onafhankelijk` verschijnt; knop `Opnieuw spiegelen naar alle kolommen` verschijnt | Herstelt master-replicatie; lijnt alle kolommen direct uit met de Master |
| **Rijen spiegelen** | Verticaal | Rijen (Banen / Deelnemers) | Geometrie, replicatie en instellingen van Baan 1 Master naar alle baanrijen | Baanrijen worden onafhankelijk; status `Onafhankelijk` verschijnt; knop `Opnieuw spiegelen naar alle rijen` verschijnt | Herstelt master-replicatie; lijnt alle rijen direct uit met de Master |
| **Rijen spiegelen** | Horizontaal | Rijen (Gegevensstatistieken) | Visuele stijl: lettertypen, groottes, kleuren, randen tussen statistiekrijen | Statistiekrijen worden onafhankelijk; bestaande stijlen blijven behouden | Activeert automatische synchronisatie voor toekomstige bewerkingen |


