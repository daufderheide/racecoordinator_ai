# Coureureditor

Met de **Coureureditor** kunt u coureurprofielen, bijnamen, avatars en gepersonaliseerde audiomeldingen aanmaken, bekijken en aanpassen.

## Overzicht

De Coureureditor combineert het selecteren en bewerken van coureurs in één overzichtelijke interface:

- **Coureurkiezer**: Dit dropdown-menu bovenaan naast de paginatitel toont alle bestaande coureurs en maakt het eenvoudig om tussen hen te wisselen.
- **Alleen-lezen modus**: Standaard opent de editor in een alleen-lezen modus. De velden zijn vergrendeld om onbedoelde wijzigingen te voorkomen, terwijl geluidsfragmenten wel kunnen worden afgespeeld.
- **Bewerkingsmodus**: Door op het **Bewerken**-icoon (potlood) op de werkbalk te klikken, worden de invoervelden ontgrendeld. Tijdens de bewerkingsmodus is de coureurkiezer vergrendeld om gegevensverlies te voorkomen.
- **Wijzigingen opslaan**: Door op het icoon **Klaar met bewerken** (vinkje) te klikken, worden de wijzigingen gevalideerd, opgeslagen op de server en keert de editor terug naar de alleen-lezen modus.
- **Wijzigingen verwerpen**: Als u de editor verlaat met niet-opgeslagen wijzigingen, vraagt het bevestigingsvenster om akkoord. Bij verwerpen keren alle gegevens terug naar de laatst opgeslagen versie.

## Werkbalkacties

De bovenste werkbalk biedt de volgende opties:

- **Terug**: Keert terug naar het vorige scherm of de racedaginstellingen.
- **Coureur toevoegen (+)**: Maakt een nieuw coureurprofiel aan en activeert de bewerkingsmodus.
- **Coureur kopiëren**: Dupliceert het geselecteerde profiel naar een nieuwe sjabloon.
- **Bewerken / Klaar**: Schakelt tussen alleen-lezen modus en bewerkingsmodus (sneltoets: Cmd/Ctrl+E).
- **Coureurs importeren**: Opent het dialoogvenster om coureurprofielen, avatars en audio-instellingen te importeren uit externe bestanden.
- **Alles uitvouwen / samenvouwen**: Vouwt alle accordeonsecties in één keer uit of samen.
- **Coureur verwijderen**: Verwijdert het geselecteerde coureurprofiel na bevestiging.
- **Help (?)**: Start de interactieve rondleiding door de verschillende onderdelen van de editor.

## Coureurgegevens

- **Naam**: De volledige naam van de coureur zoals getoond op scoreborden en rapporten.
- **Bijnaam**: Een korte of gesproken naam voor tekst-naar-spraak (TTS) meldingen.
- **Koppel naam & bijnaam**: Indien ingeschakeld, wordt de ingevoerde naam automatisch overgenomen als bijnaam.
- **Avatar**: Kies een afbeelding of pictogram voor de coureur.

## Audiomeldingen & geluidseffecten

Configureer aangepaste geluidseffecten of TTS-meldingen voor deze coureur:

- **Rondemelding**: Wordt afgespeeld bij het voltooien van een standaardronde.
- **Persoonlijk ronderecord**: Wordt afgespeeld wanneer de coureur zijn beste ronde rijdt.
- **Mijlpalen & records**: Aangepaste geluiden voor baanrecords, manche-records en wisselingen van de leider.
- **Geluiden beluisteren**: De afspeelknop blijft altijd actief om geluiden te testen.

## Coureurs importeren

Race Coordinator AI ondersteunt het batchgewijs importeren van coureurs uit externe bestanden, inclusief bulkaanmaak, conflictoplossing, aangepaste media en standaardinstellingen voor lege audioslots.

### Ondersteunde bestandsindelingen

- **CSV (`.csv`)**: Door komma's, puntkomma's of tabs gescheiden tekstbestanden. Kolomkoppen worden flexibel gekoppeld (ongevoelig voor hoofdletters, spaties en liggende streepjes).
- **Excel (`.xlsx`, `.xls`)**: Microsoft Excel-werkbladen. Het eerste blad wordt verwerkt op basis van de kolomkoppen.
- **JSON (`.json`)**: Een array van coureurobjecten of een object met een `"drivers"`-array.
- **ZIP-pakket (`.zip`)**: Een ZIP-archief met een gegevensbestand (`drivers.csv`, `drivers.xlsx` of `drivers.json`) samen met bijbehorende audio- (`.wav`, `.mp3`, `.ogg`) en avatar-afbeeldingsbestanden (`.png`, `.jpg`, `.jpeg`).

### Kolom- en veldtoewijzing

De volgende kolommen en JSON-velden worden herkend:

| Veld | Herkende kolomaliassen | Beschrijving | Standaard / Terugval |
| :--- | :--- | :--- | :--- |
| **Naam** | `Name`, `Driver`, `Driver Name`, `Full Name` | Volledige naam van de coureur (verplicht). | Geen (rij-fout indien leeg) |
| **Bijnaam** | `Nickname`, `Nick`, `Callout`, `Display Name` | Korte of gesproken naam voor omroep. | Neemt de **Naam** over indien leeg. Gecontroleerd op duplicaten. |
| **Avatar** | `Avatar`, `Image`, `Avatar URL`, `Photo` | Relatieve bestandsnaam (bijv. `john.png`), mediatitel of URL. | Geen |
| **Standaard audio** | `Default Audio`, `Blank Audio`, `Audio Default` | Instructie voor lege slots: `none` / `muted` of `system` / `default`. | Van bestandsinstructie of modale kiezer |
| **Rondemelding** | `Lap Audio`, `Lap Sound`, `Lap`, `Lap Callout` | Geluid afgespeeld bij het voltooien van een ronde. | Standaard volgens audiomodus |
| **Persoonlijk record** | `Personal Best Audio`, `PB Audio`, `Personal Best`, `PB` | Geluid bij een nieuw persoonlijk ronderecord. | Standaard volgens audiomodus |
| **Baanrecord** | `Track Record Audio`, `Track Record`, `Record Audio` | Geluid bij het verbreken van het baanrecord. | Standaard volgens audiomodus |
| **Leider in de race** | `Race Lead Audio`, `Race Leader`, `Leader Audio` | Geluid bij het overnemen van de leiding in de race. | Standaard volgens audiomodus |
| **Minimale rondetijd**| `Min Lap Time Audio`, `Min Lap`, `Under Min Lap` | Geluid bij rijden onder de minimale rondetijd. | Standaard volgens audiomodus |
| **Driftronde** | `Drift Lap Audio`, `Drift Audio`, `Drift Sound` | Geluid tijdens een driftronde. | Standaard volgens audiomodus |
| **Valse start** | `False Start Audio`, `False Start`, `Penalty Audio` | Geluid bij een valse start of tijdstraf. | Standaard volgens audiomodus |
| **Pitstraat in** | `Pit In Audio`, `Pit In`, `Pit Stop` | Geluid bij binnenrijden van de pitstraat. | Standaard volgens audiomodus |
| **Brandstofwaarschuwing** | `Fuel Warning Audio`, `Fuel Warning`, `Low Fuel` | Geluid bij laag brandstofpeil. | Standaard volgens audiomodus |
| **Brandstof op** | `Fuel Out Audio`, `Fuel Out`, `Out of Fuel` | Geluid wanneer het voertuig zonder brandstof stilvalt. | Standaard volgens audiomodus |

### Syntaxis voor audioslots

Audiowaarden kunnen in de volgende indelingen worden opgegeven:
- **`none`** of **`off`** / **`mute`**: Slot is gedempt (geen geluid).
- **`tts:<tekst>`** of **`${nickname} neemt de leiding`**: Tekst-naar-spraakmelding (TTS). Accolades `{nickname}` en `${driver}` worden ondersteund.
- **`preset:<geluid>`**: Ingebouwd systeemgeluid (bijv. `preset:beep`, `preset:driveby`, `preset:cheer`).
- **Bestandsnaam (bijv. `cheer.wav`, `v8_rev.mp3`)**: Verwijst naar een meegestuurd mediabestand via upload of ZIP-pakket.

### Bestandsinstructies voor lege audioslots

U kunt direct in het bestand aangeven hoe met lege audioslots moet worden omgegaan:
- In CSV: `# default-audio: none` of `# default-audio: system` in commentaarkoppen.
- In JSON: `"default_audio": "none"` op hoofdobjectniveau.
- In Excel/CSV: Geef een kolom `Default Audio` op per coureurrij.
- In de interface: Gebruik het dropdown-menu **Lege audioslots** in het importvenster.

### Automatische import van media en bestanden

Bij het importeren van coureurs met aangepaste avatars of geluiden:
1. **Meerdere bestanden slepen**: Sleep uw `.csv`- of `.xlsx`-bestand tegelijkertijd met de bijbehorende `.wav`-, `.mp3`-, `.png`- of `.jpg`-bestanden naar het uploadgebied.
2. **ZIP-pakket**: Bundel uw gegevensbestand en mediabestanden in een `.zip`-archief en upload dit archief.
3. **Automatische registratie**: De server neemt de mediabestanden op in het Mediabeheer, berekent SHA-256-hashes en koppelt de bestanden automatisch aan de juiste coureuravatars en audioslots.

### Conflictoplossing

Wanneer een coureur in het bestand overeenkomt met een bestaande naam of bijnaam in de database, toont de interactieve voorvertoningstabel het conflict met drie keuzes:
- **Automatisch hernoemen**: Hernoemt de nieuwe coureur (bijv. `Alice Walker (1)`), zodat bestaande profielen behouden blijven.
- **Bestaande overschrijven**: Werkt het bestaande profiel bij met de nieuw geïmporteerde gegevens, avatars en audioconfiguraties.
- **Overslaan**: Slaat de betreffende rij over tijdens de import.

U kunt de actie per rij bepalen, op alle rijen tegelijk toepassen of namen en bijnamen direct in de tabel bewerken.
