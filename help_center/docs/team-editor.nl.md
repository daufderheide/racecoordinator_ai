# Team Editor

Met de **Team Editor** kunt u teamprofielen aanmaken, bekijken en aanpassen, coureurs toewijzen, teamlogo's uploaden en teamopstellingen beheren.

## Overzicht

De Team Editor integreert teamselectie en -bewerking in één uniforme interface:

- **Teamkiezer**: Bevindt zich in de bovenste werkbalk naast de paginatitel. Dit dropdownmenu toont alle bestaande teams en maakt snel schakelen mogelijk.
- **Alleen-Lezen Modus**: Standaard toont de editor de teamgegevens en toegewezen coureurs in de alleen-lezen modus. Formuliervelden, logoselectie en toewijzingsacties zijn vergrendeld om onbedoelde wijzigingen te voorkomen.
- **Bewerkingsmodus**: Door op het pictogram **Bewerken** (potlood) in de werkbalk te klikken, worden de invoervelden en toewijzingsknoppen ontgrendeld. In de bewerkingsmodus is het selectiemenu vergrendeld om onbedoeld navigeren met niet-opgeslagen wijzigingen te voorkomen.
- **Continu Automatisch Opslaan**: Terwijl u wijzigingen aanbrengt (teamnaam bewerken, logo kiezen of coureurs toewijzen/herschikken), worden uw bewerkingen automatisch op de achtergrond op de server opgeslagen zonder de bewerkingsmodus te verlaten.
- **Bewerken Voltooien**: Door op het pictogram **Bewerken voltooien** (vinkje) te klikken, worden uw wijzigingen gevalideerd, definitief opgeslagen en keert de editor terug naar de alleen-lezen modus.
- **Wijzigingen Negeren**: Als u de editor probeert te verlaten met niet-opgeslagen of ongeldige wijzigingen, vraagt het dialoogvenster om bevestiging. Bij negeren worden alle wijzigingen hersteld naar de laatst opgeslagen versie.

## Werkbalkacties

De bovenste werkbalk biedt de volgende acties:

- **Terug**: Keert terug naar het vorige scherm of de Racedag Setup.
- **Team toevoegen (+)**: Maakt een nieuw teamsjabloon aan en activeert de bewerkingsmodus.
- **Team dupliceren**: Maakt een kopie van het geselecteerde team met een unieke naam.
- **Bewerken / Bewerken voltooien**: Schakelt tussen de alleen-lezen modus en de bewerkingsmodus (sneltoets: Cmd/Ctrl+E).
- **Team verwijderen**: Verwijdert het geselecteerde team na bevestiging.
- **Ongedaan maken / Opnieuw**: Maakt recente wijzigingen tijdens de sessie ongedaan of past ze opnieuw toe.
- **Help (?)**: Start de interactieve rondleiding die elk onderdeel van de editor toelicht.

## Teamprofiel {: #team-profile }

Het linkerpaneel bevat de belangrijkste identiteits- en indelingsinstellingen voor het team:

- **Teamnaam**: De unieke naam van het team die wordt weergegeven op ranglijsten, scoreborden en schermen van de racedag.
- **Teamlogo / Afbeelding**: Kies een vooraf ingesteld pictogram of upload een eigen logo voor het team.
- **Teamlabels**: Wijs kleurgecodeerde labels toe (vergelijkbaar met GitHub-labels) om teams in categorieën te organiseren (zoals "GT3", "Pro" of "Amateur"). Teams kunnen aan meerdere labels worden gekoppeld. Klik in de bewerkingsmodus op **Labels beheren** om labels te maken, bewerken, herkleuren, verwijderen of toe te wijzen. Op het scherm Racedag Setup kunt u beschikbare teams op label filteren om snel teamopstellingen samen te stellen.

## Teamleden & Opstelling {: #team-members }

Het bovenste deel van het rechterpaneel toont de coureurs die momenteel aan dit team zijn toegewezen:

- **Opstellingsbeheer**: In de bewerkingsmodus kunt u coureurs met de handgreep (`☰`) slepen en neerzetten om de startvolgorde aan te passen, of op de verwijderknop (<span class="material-icons">delete</span>) klikken om een coureur uit het team te halen.
- **Round-Robin Rotatie**: Wanneer een team deelneemt aan een race, worden de toegewezen coureurs automatisch volgens een round-robin volgorde verdeeld over de heats van het team op basis van deze volgorde.
- **Coureurswissel Halverwege de Heat**: Afhankelijk van de teamraceconfiguratie kunnen teamcoureurs ook halverwege een heat worden gewisseld, tijdens een pitstop of op ieder willekeurig punt op de baan.
- **Coureurlabels**: Elke coureur toont de toegekende labels als badges naast de naam om kwalificaties en niveaus eenvoudig te controleren.

## Beschikbare Coureurs {: #available-drivers }

Het onderste deel van het rechterpaneel toont alle geregistreerde coureurs die momenteel niet aan dit team zijn toegewezen:

- **Coureurs Toevoegen**: Klik in de bewerkingsmodus op de kaart van een coureur of op de toevoegknop (<span class="material-icons">add</span>) om deze direct aan de teamopstelling toe te voegen.
- **Lidmaatschap van Meerdere Teams**: Een coureur kan in uw database lid zijn van meerdere verschillende teams.
- **Voorkomen van Deelnameconflicten**: Hoewel een coureur lid kan zijn van meerdere teams, mag geen enkele coureur vaker dan één keer deelnemen aan dezelfde race — noch bij twee concurrerende teams, noch gelijktijdig individueel en in teamverband.
