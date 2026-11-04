# Interface aanpassen

Op de pagina **Interface aanpassen** kunt u systeembrede interface-instellingen, maplocaties voor aangepaste UI-bestanden en modulaire widgets, Excel-exportsjablonen na de race, schermovergangsanimaties en parameters voor het hoofdvolume en tekst-naar-spraak (TTS) configureren.

> [!NOTE]
> Om visueel aangepaste racedagschermen en ranglijsten te ontwerpen, bezoekt u de [Layout-editor](layout-editor.nl.md). Om afbeeldingssets voor vlaggen, startlichten en brandstofmeters of racegeluidseffecten te configureren, bezoekt u de [Thema-editor](theme-editor.nl.md).

---

## Overzicht {: #overview }

De pagina Interface aanpassen biedt centrale controle over algemeen interfacegedrag en audio-instellingen op applicatieniveau:

- **Globaal bereik**: Wijzigingen op deze pagina zijn van toepassing op de hele applicatie en alle racesessies.
- **Continu automatisch opslaan**: Aanpassingen aan volume, stemhoogte, wachttijden, mapselecties en overgangen worden direct van kracht en automatisch opgeslagen.
- **Uitklapbare instellingensecties**: Instellingen zijn onderverdeeld in overzichtelijke, inklapbare secties voor **Instellingen voor interface-aanpassing** en **Audio-instellingen**.
- **Ondersteuning voor Ongedaan maken / Opnieuw**: Wijzigingen die tijdens uw huidige sessie zijn aangebracht, kunnen snel ongedaan worden gemaakt of opnieuw worden toegepast via de werkbalkknoppen.

---

## Werkbalkacties {: #toolbar-actions }

De bovenste werkbalk biedt essentiële navigatie- en sessieacties:

- **Terug**: Keert terug naar het vorige scherm of navigatiemenu.
- **Ongedaan maken / Opnieuw**: Maakt recente wijzigingen in de huidige bewerkingssessie ongedaan of past ze opnieuw toe.
- **Help (?)**: Start de interactieve rondleiding die elk gedeelte en expanderpaneel op de pagina markeert.

---

## Instellingen voor interface-aanpassing {: #customize-ui-settings }

De sectie **Instellingen voor interface-aanpassing** configureert lokale bestandssysteemmappen, aangepaste Excel-exportsjablonen en schermovergangsanimaties:

### Map voor aangepaste interface

Bepaalt een lokale map die wordt gebruikt om ingebouwde applicatiesjablonen te overschrijven en indien nodig clientlogboeken op te slaan:

- **Mappad**: Toont de actieve mapnaam en het absolute bestandspad. Indien niet ingesteld, gebruikt de applicatie standaard interne locaties.
- **Map selecteren**: Opent een systeemeigen dialoogvenster om een lokale map te zoeken en te selecteren.
- **Pad invoeren**: Opent een modaal venster om handmatig een absoluut bestandssysteempad in te voeren of te plakken.
- **Standaardinstellingen herstellen**: Wist het aangepaste mappad en herstelt de standaardwaarden.

> [!WARNING]
> Het instellen van een aangepaste UI-map overschrijft standaardsjablonen van de applicatie en is uitsluitend bedoeld voor gevorderde gebruikers die aangepaste interfaces ontwikkelen of logboeken analyseren.

### Map voor aangepaste widgets

Configureert de hoofdmap waarin Race Coordinator AI zoekt naar modulaire [aangepaste widgets](custom-widgets.nl.md):

- **Mappad**: Toont de geselecteerde mapnaam en het pad voor aangepaste widgets.
- **Map selecteren**: Opent een mapkiezer om een lokale map met widgetpakketten te kiezen.
- **Pad invoeren**: Voer handmatig een absoluut mappad in.
- **Starter-widgets exporteren**: Kopieert kant-en-klare voorbeeld-widgetpakketten naar een submap `sample/` binnen uw geselecteerde widgetmap (inclusief `sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner` en `sample-detailed-leaderboard`). Deze knop wordt actief zodra een geldige widgetmap is geselecteerd.
- **Standaardinstellingen herstellen**: Wist het mappad voor aangepaste widgets.

Voor volledige technische specificaties over het maken van aangepaste widgets, zie de [Gids voor aangepaste widgets](custom-widgets.nl.md).

### Aangepast exportsjabloon

Beheert het aangepaste Microsoft Excel-sjabloon (`.xlsx`) dat wordt gebruikt bij het exporteren van raceresultaten en -statistieken:

- **Sjabloonstatus**: Toont de bestandsnaam van het momenteel actieve Excel-werksjabloon of geeft aan wanneer het standaardsjabloon van het systeem actief is.
- **Sjabloon selecteren**: Uploadt een aangepast `.xlsx`-werkmapbestand vanaf uw computer om in te sluiten als exportsjabloon.
- **Sjabloon downloaden**: Downloadt het momenteel actieve sjabloonbestand naar uw computer om te bekijken of te bewerken in Microsoft Excel.
- **Testexport**: Genereert en downloadt een voorbeeld-`.xlsx`-exportbestand gevuld met gesimuleerde racegegevens om sjabloonopmaak, formules en grafieken te testen.
- **Sjabloonvariabelen**: Opent een interactief referentievenster met alle ondersteunde vervangingstags (zoals `{{RACE_NAME}}`, `{{HEAT_NUMBER}}`, `{{DRIVER_NAME}}`, `{{LAP_TIME}}`, enz.) die u in Excel-cellen kunt plaatsen om dynamisch racegegevens in te voegen.
- **Standaardinstellingen herstellen**: Keert terug naar het ingebouwde standaard Excel-exportsjabloon.

> [!TIP]
> Als u uw Excel-sjabloonbestand extern bewerkt in Microsoft Excel of een ander spreadsheetprogramma, upload het dan opnieuw via **Sjabloon selecteren** zodat de bijgewerkte werkmap wordt opgeslagen in Race Coordinator AI. Voor details over vervangingstokens, zie de [Gids voor aangepaste XLS-export](custom-xls-export.nl.md).

### Pagina-overgangen

Bepaalt de visuele animatiestijl die wordt gebruikt bij het navigeren tussen schermen en weergaven in de applicatie:

- **Schuiven (Slide)** (Standaard): Vloeiende horizontale schuifovergang tussen pagina's.
- **Vervagen (Fade)**: Vloeiende overvloeiing van dekking tussen weergaven.
- **Zoomen (Zoom)**: Moderne zoomschaalovergang.
- **Omdraaien (Flip)**: 3D-kaartomdraaieffect.
- **Geen (None)**: Onmiddellijke paginawisseling zonder animatie (aanbevolen voor minder krachtige apparaten of kiosken).

---

## Audio-instellingen {: #audio-settings }

De sectie **Audio-instellingen** beheert het algehele hoofdvolumeniveau, het gedrag van de audiowachtrij en tekst-naar-spraak (TTS):

### Hoofdvolume

Bepaalt het algehele hoofdvolume (0% tot 100%) voor alle audioweergave in Race Coordinator AI. Het aanpassen van deze schuifregelaar schaalt alle geluidseffecten, aftelsignalen, waarschuwingssignalen en gesproken aankondigingen gelijktijdig.

### Time-out urgente wachtrij

Bepaalt hoelang urgente meldingen met hoge prioriteit (zoals *Gele vlag*, *Heat afgelopen* of *Valse start*) in de audiowachtrij wachten als er al een ander dringend bericht wordt uitgesproken:

- **3 seconden**: Korte time-out; verwijdert wachtende meldingen snel zodat gesproken meldingen nauw synchroon blijven met de actie op de baan.
- **5 seconden** (Standaard): Gebalanceerde duur die ervoor zorgt dat urgente meldingen worden gehoord zonder achter te lopen op live-gebeurtenissen.
- **10 seconden**: Ruime time-out; laat langere aankondigingen uitspreken voordat volgende urgente meldingen worden overgeslagen.

Verlopen meldingen die de tijdslimiet overschrijden, worden automatisch genegeerd.

### Tussenruimte voor oproepen

Configureert de minimale stiltepauze tussen opeenvolgende gesproken aankondigingen om overlap of afkapping te voorkomen:

- **Geen (0 ms)**: Opeenvolgende aankondigingen worden direct achter elkaar afgespeeld.
- **Kort (500 ms)** (Standaard): Korte pauze van een halve seconde tussen aankondigingen voor een natuurlijk tempo.
- **Normaal (1000 ms)**: 1 seconde pauze tussen aankondigingen voor een duidelijkere scheiding.
- **Ontspannen (1500 ms)**: 1,5 seconde pauze tussen aankondigingen voor een rustig commentaartempo.

### Tekst-naar-spraak (TTS) stem

Selecteert welke synthetische stem wordt gebruikt voor gesproken rondetijden, posities, leidersaankondigingen en brandstofmeldingen:

- **Systeemstandaard**: Gebruikt de standaard spraaksynthesestem van uw besturingssysteem of browser.
- **Geïnstalleerde stemmen**: Geeft een overzicht van alle op uw systeem of browser gedetecteerde stemmen met hun naam en taalcode (bijv. `nl-NL`, `en-US`).

### Spraaksnelheid

Bepaalt de afspeelsnelheid van gesproken TTS-aankondigingen via een schuifregelaar van **0,1x** (zeer langzaam) tot **2,0x** (dubbele snelheid) in stappen van 0,05. De standaardsnelheid is **1,0x**.

### Toonhoogte (Pitch)

Bepaalt de vocale toonhoogte/frequentie van TTS-aankondigingen via een schuifregelaar van **0,0x** (lage toon) tot **2,0x** (hoge toon) in stappen van 0,05. De standaardtoonhoogte is **1,0x**.

### Stemvolume

Onafhankelijke schuifregelaar (0% tot 100%) specifiek voor TTS-spraakaankondigingen. Hiermee kunt u het volume van gesproken commentaar afstemmen ten opzichte van achtergrondgeluidseffecten.

### Stem testen

Klik op de knop **Stem testen** om een voorbeeldzin te horen die wordt uitgesproken met uw huidige instellingen voor stem, snelheid, toonhoogte en volume.
