# Databasebeheer

Het scherm **Databasebeheer** stelt u in staat om geïsoleerde SQLite-databases in Race Coordinator te organiseren, back-ups te maken, te herstellen en ertussen te schakelen. Elke database bevat een onafhankelijke verzameling coureurs, teams, banen, races, evenementen, seizoenen, gebruikersinterfaces en multimediamaterialen.

---

## Overzicht {: #overview }

Het scherm Databasebeheer is onderverdeeld in twee hoofdsecties:

1. **Databaselijst (Linkerzijbalk)**: Toont alle beschikbare databasebestanden die zijn opgeslagen in uw lokale applicatiemap. De actieve database wordt aangeduid met een **ACTIEF**-badge. Door een database in de lijst te selecteren, worden de details en statistieken in het rechterpaneel geladen.
2. **Detailpaneel (Rechterzijde)**: Toont uitgebreide statistieken, opslagstatistieken en de activeringsknop voor de geselecteerde database.
3. **Beheerwerkbalk (Bovenste koptekst)**: Biedt acties om databases aan te maken, te importeren, te exporteren, te dupliceren, te resetten of te verwijderen.

---

## Databasestatistieken {: #database-statistics }

Wanneer een database uit de lijst is geselecteerd, toont het paneel **Databaseoverzicht** realtime statistieken en het schijfruimtegebruik:

| Statistiek | Beschrijving |
| :--- | :--- |
| **Coureurs** | Totaal aantal geconfigureerde coureursprofielen. |
| **Teams** | Totaal aantal raceteams. |
| **Banen** | Totaal aantal baanconfiguraties en hardware-aansluitingen. |
| **Races** | Totaal aantal geconfigureerde raceformaten en heat-rotaties. |
| **Evenementen** | Totaal aantal meerdelige evenementen. |
| **Seizoenen** | Totaal aantal seizoenskampioenschappen en puntensystemen. |
| **Assets** | Totaal aantal afbeeldingen, audioclips, afbeeldingssets, audiosets en rotaties. |
| **Racerecords** | Aantal voltooide race-uitslagen en hun schijfopslag (in MB). |
| **Opgeslagen Races** | Aantal lopende of gepauzeerde opgeslagen racesessies en hun schijfopslag (in MB). |
| **Totale Grootte** | De fysieke bestandsgrootte van de SQLite-database op de schijf (in MB). |

---

## Schakelen tussen Databases {: #switching-databases }

Race Coordinator werkt met één actieve database tegelijk. De status van de geselecteerde database wordt direct naast de naam in de detailkop weergegeven:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Actieve Database (Groen vinkje)**: Geeft aan dat de database momenteel door het systeem wordt gebruikt voor tijdwaarneming, racebeheer en gegevensopslag.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Inactieve Database (Grijs vinkje)**: Geeft een alternatieve database aan die op dit moment niet actief is.

### Hoe te schakelen

1. Klik op een inactieve database in de linkerzijbalk.
2. Klik in de detailkop op het **Grijze Vinkje**.
3. Bevestig de wissel in het dialoogvenster.

> [!WARNING]
> Het wisselen van database reset onmiddellijk de actieve racesessiestatus en herlaadt alle gecachete assets, coureurs en baanconfiguraties vanuit de zojuist geactiveerde database.

---

## Een Database Aanmaken {: #creating-a-database }

Om een nieuwe database aan te maken:

1. Klik op de knop **Toevoegen** (<span class="material-icons" style="vertical-align: middle;">add</span>) op de bovenste werkbalk.
2. Voer een unieke naam in voor de nieuwe database in het dialoogvenster.
3. Klik op **OK**. Race Coordinator maakt een schone SQLite-database aan die is geïnitialiseerd met het standaardschema en basisassets.

---

## Een Database Kopiëren {: #copying-a-database }

Om een bestaande database te dupliceren:

1. Selecteer de gewenste database in de zijbalklijst.
2. Klik op de knop **Kopiëren** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) op de werkbalk.
3. Voer een unieke naam in voor het duplicaat.
4. Klik op **OK**. Alle coureurs, banen, races, seizoenen, assets en racehistorie worden naar het nieuwe bestand gekloond.

---

## Een Database Verwijderen {: #deleting-a-database }

Om een database definitief te verwijderen:

1. Selecteer de te verwijderen database in de zijbalklijst.
2. Klik op de knop **Verwijderen** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) op de werkbalk.
3. Bevestig de verwijdering in het dialoogvenster.

> [!NOTE]
> De momenteel actieve database kan niet worden verwijderd. Schakel eerst over naar een andere database om deze te kunnen verwijderen.

---

## Fabrieksinstellingen Herstellen {: #factory-reset }

De actie **Resetten** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) wist alle aangepaste gegevens uit de momenteel actieve database en herstelt de fabrieksinstellingen:

1. Selecteer de actieve database en klik op de knop **Resetten** op de werkbalk.
2. Lees de waarschuwingsberichten aandachtig door en bevestig de reset.
3. Alle aangepaste coureurs, banen, races en assets worden vervangen door schone fabrieksinstellingen.

---

## Back-up en Herstel / Importeren en Exporteren {: #import-and-export }

### Exporteren (Back-up)

Om een draagbaar back-uparchief van een database te maken:

1. Selecteer de gewenste database.
2. Klik op de knop **Exporteren** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) op de werkbalk.
3. Race Coordinator genereert een `.zip`-archief met tijdstempel dat het SQLite-bestand en alle opgeslagen binaire assets bevat.

### Importeren (Herstel)

Om een eerder geëxporteerd database-archief te importeren:

1. Klik op de knop **Importeren** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) op de werkbalk.
2. Selecteer een `.zip`-archief vanaf uw computer.
3. Voer een unieke naam in voor de geïmporteerde database.
4. Race Coordinator pakt de database uit en registreert deze in uw lokale installatie.
