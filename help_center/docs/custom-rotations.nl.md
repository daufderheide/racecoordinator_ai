# Aangepaste Rotatiesets

## Overzicht {: #overview }

Met de **Editor voor Aangepaste Rotatiesets** kunt u op maat gemaakte heatrotatieschema's voor uw baan ontwerpen, bewerken en organiseren. Waar Race Coordinator AI standaard algoritmische rotaties biedt—zoals **Round Robin**, **Europees Round Robin**, **Enkele Heat** en **Step Up Races**—bieden aangepaste rotatiesets wedstrijdleiders volledige handmatige controle, baan voor baan, over de planning van rijders, de volgorde van heats en de baantoewijzingen.

Een **Aangepast Rotatieset-Asset** vertegenwoordigt een verzameling (of set) van individuele rotatieconfiguraties die specifiek zijn afgestemd op het fysieke baanaantal van een circuit (zoals 2, 4, 6 of 8 banen). Binnen één enkel aangepast rotatieset-asset kunt u meerdere rotatiepatronen definiëren die zijn geoptimaliseerd voor verschillende aantallen deelnemers.

Aangepaste rotatiesets zijn ideaal voor:

- **Afwijkende Baanconfiguraties:** Banen met specifieke baankenmerken, handicapinstellingen of pitstraatvereisten.
- **Clubformaten en Huisregels:** Traditionele clubrotatieschema's waarbij specifieke rijderskoppels of baanvolgordes strikt moeten worden gehandhaafd.
- **Vaste Fasen- en Stintreeksen:** Speciale demonstratieraces, derby's of teamformaten waarbij algoritmische Round Robin-schema's niet overeenkomen met het wedstrijdreglement.

---

## Hoe Aangepaste Rotatiesets Werken {: #how-custom-rotations-work }

### Maximale Rijderscapaciteit per Rotatie {: #maximum-driver-capacity }

Een aangepast rotatieset-asset definieert niet slechts één enkel statisch schema; het bevat een **set van rotaties**, waarbij **elke rotatie een rotatie voor een maximaal aantal rijders** (`numDrivers`) specificeert.

Binnen elke rotatie:

- **Virtuele Rijders-Plaatsingsnummers:** Rijders worden aangeduid met plaatsingsnummers: `Rijder 1`, `Rijder 2`, ... tot en met `Rijder N` (waarbij `N` de maximale rijderscapaciteit van de rotatie is).
- **Baantoewijzingen:** Voor elke heat krijgt elke fysieke baan een specifiek virtueel plaatsingsnummer toegewezen (bijv. Baan 1: Rijder 1, Baan 2: Rijder 2), of blijft deze leeg/niet-toegewezen.
- **Deelnemersindeling:** Wanneer een race begint, worden de geregistreerde rijders toegewezen aan de plaatsingen 1 tot en met $M$ volgens hun kwalificatievolgorde (of willekeurige loting).

Een asset "4-Bans Club Sprint" kan bijvoorbeeld bevatten:

- Een **4-Rijders Rotatie:** Een schema van 4 heats waarin 4 rijders elk eenmaal op elk van de 4 banen rijden.
- Een **5-Rijders Rotatie:** Een schema van 5 heats waarbij 5 rijders roteren over de 4 banen, met in elke heat één rustende rijder.
- Een **6-Rijders Rotatie:** Een schema van 6 heats dat een evenwichtige baantijd garandeert.
- Een **8-Rijders Rotatie:** Een schema van 8 heats voor grotere deelnemersvelden.

---

### Algoritme voor Rotatieselectie {: #rotation-selection-algorithm }

Wanneer een race met een aangepast rotatieformaat start (of tijdens het genereren van het live heatoverzicht in de race-editor), bepaalt Race Coordinator AI automatisch welke rotatie uit de set van het asset wordt gebruikt.

Het systeem telt het aantal actieve deelnemende rijders (`driverCount`) en kiest de optimale rotatie via een strikte **prioriteringsstrategie met drie niveaus**:

#### 1. Niveau 1: Exacte Overeenkomst {: #selection-tier-1 }
Het systeem zoekt eerst naar een rotatie waarvan het geconfigureerde maximum aantal rijders (`numDrivers`) **exact gelijk is** aan het actieve aantal rijders (`numDrivers == driverCount`).

- **Resultaat:** De exact passende rotatie wordt geselecteerd.
- **Baantoewijzing:** Elke deelnemende rijder komt 1:1 overeen met diens virtuele plaatsingsnummer (Rijder 1 rijdt als Plaatsing 1, Rijder 2 als Plaatsing 2, enz.). Er zijn geen lege banen, tenzij de rotatie zelf expliciet met onbezette banen is ontworpen.

#### 2. Niveau 2: Dichtstbijzijnde Bovenliggende (Kleinste Rotatie Groter dan Aantal Rijders) {: #selection-tier-2 }
Als geen enkele rotatie overeenkomt met het exacte rijdersaantal, zoekt het systeem naar alle rotaties in de set met een capaciteit **groter dan** het actieve rijdersaantal (`numDrivers > driverCount`). Hieruit selecteert het de rotatie met het **kleinste verschil**:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Resultaat:** De dichtstbijzijnde grotere rotatie wordt gekozen om te garanderen dat alle aanwezige rijders kunnen racen.
- **Afhandeling van Lege Banen:** Omdat er minder rijders aanwezig zijn dan waarvoor de rotatie is ontworpen, wordt elke baanplek die is toegewezen aan een plaatsingsnummer hoger dan het actieve rijdersaantal (`Plaatsing > driverCount`) automatisch ingevuld met een **lege rijdersplek** (`Driver.EMPTY_DRIVER`). Die baan blijft in die heat onbezet, terwijl alle deelnemende rijders op hun geplande posities rijden.

#### 3. Niveau 3: Dichtstbijzijnde Onderliggende (Grootste Rotatie Kleiner dan Aantal Rijders) {: #selection-tier-3 }
Indien het actieve rijdersaantal de maximale capaciteit van **elke** rotatie in de set overschrijdt (bijvoorbeeld als er 9 rijders meedoen, maar de grootste rotatie in de set maximaal 8 rijders ondersteunt), valt het systeem terug op de rotatie met de **grootste capaciteit onder het actieve rijdersaantal**:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Resultaat:** De dichtstbijzijnde kleinere rotatie wordt geselecteerd.
- **Capaciteitsbeperking:** Alleen rijders van wie het plaatsingsnummer binnen de capaciteit van de geselecteerde rotatie valt (Rijders 1 tot en met `numDrivers`), worden in heats ingedeeld. Rijders met hogere plaatsingsnummers worden niet ingepland.

!!! tip "Ontwerptip: Dek Alle Deelnemersaantallen Af"
    Om te waarborgen dat alle rijders racen zonder niet-ingeplande deelnemers of onverwachte lege banen, maakt u binnen hetzelfde aangepaste rotatieset-asset voor elke verwachte veldgrootte (bijv. 4, 5, 6, 7 en 8 rijders) een eigen rotatie aan.

---

### Praktijkvoorbeelden van Selectie {: #selection-examples }

Stel dat uw aangepaste rotatieset-asset drie rotaties bevat: **4 Rijders**, **6 Rijders** en **8 Rijders**. De onderstaande tabel toont welke rotatie Race Coordinator AI selecteert afhankelijk van het deelnemersaantal:

| Geregistreerde Rijders | Beschikbaar in Set | Geselecteerde Rotatie | Selectieregel | Gedrag Baan & Lege Banen |
| :---: | :---: | :---: | :---: | :--- |
| **4 Rijders** | 4, 6, 8 | **4-Rijders Rotatie** | **Niveau 1 (Exacte Overeenkomst)** | Perfecte aansluiting. Alle banen bezet; alle 4 rijders racen. |
| **5 Rijders** | 4, 6, 8 | **6-Rijders Rotatie** | **Niveau 2 (Dichtstbijzijnde Bovenliggende)** | Plaatsing 6-posities zijn lege banen. Rijders 1–5 racen. |
| **6 Rijders** | 4, 6, 8 | **6-Rijders Rotatie** | **Niveau 1 (Exacte Overeenkomst)** | Perfecte aansluiting. Alle banen bezet; alle 6 rijders racen. |
| **7 Rijders** | 4, 6, 8 | **8-Rijders Rotatie** | **Niveau 2 (Dichtstbijzijnde Bovenliggende)** | Plaatsing 8-posities zijn lege banen. Rijders 1–7 racen. |
| **8 Rijders** | 4, 6, 8 | **8-Rijders Rotatie** | **Niveau 1 (Exacte Overeenkomst)** | Perfecte aansluiting. Alle banen bezet; alle 8 rijders racen. |
| **9 Rijders** | 4, 6, 8 | **8-Rijders Rotatie** | **Niveau 3 (Dichtstbijzijnde Onderliggende)** | Rijders 1–8 racen. Rijder 9 wordt niet ingepland. |

---

## Een Aangepaste Rotatieset Aanmaken {: #creating-custom-rotations }

Om een nieuw aangepast rotatieset-asset aan te maken:

1. Open **Assetbeheer** vanuit het hoofdmenu of instellingenscherm.
2. Klik in het linkerpaneel op de knop **Nieuwe Aangepaste Rotatieset** (of filter op **Aangepaste Rotatiesets** en klik op een bestaande kaart om deze te bewerken).
3. De **Rotatie-editor** wordt geopend:
   - Bij het aanmaken van een nieuw asset toont de editor eerst een lege statuskaart met uitleg en een link **Meer informatie over aangepaste rotatiesets** naar deze documentatie.
   - Voer een unieke **Assetnaam** in het configuratiepaneel in.
   - Selecteer uw gewenste **Baan**. Deze selectie stelt automatisch het aantal banen in voor alle rotaties binnen de set.

---

## Heats & Banen Ontwerpen {: #designing-heats }

### Rotaties aan de Set Toevoegen {: #adding-rotations }

1. Klik op de knop **Rotatie Toevoegen** (`+`) in de bovenste werkbalk om uw eerste rotatiekaart te maken.
2. Stel het veld **Aantal Rijders** in de kop van de kaart in. Dit definieert de maximale rijderscapaciteit voor die specifieke rotatie.
3. Voer desgewenst een **Beschrijving** (label) in de kop in om de rotatie te identificeren (bijv. `EURO D18 G3-666 X>1`, `Sprintformaat` of `Exhibitie`). Bij het aanmaken van een nieuwe rotatie is dit veld leeg; bij het importeren van een bestand krijgt het standaard automatisch de bestandsnaam van het geïmporteerde bestand.
4. De kaart wordt automatisch gevuld met een eerste heat met baanposities voor uw circuit.

### Heats Toevoegen en Herschikken {: #adding-heats }

- **Heat Toevoegen:** Klik op het `+`-icoon in de rotatiekop om extra heats toe te voegen.
- **Heats Herschikken:** Versleep heatkaarten binnen het raster om de volgorde van heats te wijzigen.
- **Heat Verwijderen:** Klik op het prullenbakicoon van een heatkaart om deze te verwijderen.

### Rijders aan Banen Toewijzen {: #assigning-drivers }

- **Pool van Virtuele Rijders:** Het linkerpaneel biedt een verzameling virtuele rijders (`Rijder 1`, `Rijder 2`, enz.). U kunt het aantal rijders in de pool aanpassen om zoveel plaatsingen te maken als nodig is.
- **Pool van Promotiecoureurs:** Bevindt zich direct onder de virtuele rijders; biedt dynamische doorstroomfiches voor Step Up races (zie [Step Up Races & Promotieladders](#step-up-races) hieronder).
- **Slepen en Neerzetten:** Sleep rijdersfiches vanuit de pool direct naar de baanposities van een heatkaart.
- **Banen Wisselen:** Sleep een rijdersfiche van de ene baan naar de andere om hun toewijzingen om te wisselen.
- **Baan Legen:** Sleep een rijder uit een baan om deze onbezet (leeg) te laten.

### Groepstoewijzingen {: #group-assignments }

Elke heatkaart bevat een invoerveld voor de **Groep**:

- Wijs heats toe aan verschillende groepsnummers (bijv. Groep 1, Groep 2) bij races met meerdere groepen of fasen.
- Rijders in verschillende groepen racen onafhankelijk van elkaar, en klassementen kunnen in de raceconfiguratie per groep worden gescheiden.

### Controle op Baangelijkheid {: #lane-equality-validation }

Eerlijkheid is cruciaal bij slotcar-racing. Race Coordinator AI controleert continu de baanverdeling voor elke rotatie:

- **Groen Vinkje:** Geeft aan dat elke rijder binnen de rotatie even vaak op elke baan rijdt.
- **Oranje Waarschuwingsbadge:** Geeft aan dat de baantoewijzingen onevenwichtig zijn (bijv. Rijder 1 rijdt tweemaal op Baan 1, maar nooit op Baan 4).
- **Gelijkheidsrapport:** Klik op de gelijkheidsbadge om het gedetailleerde **Baangelijkheidsrapport** te openen. Dit toont een matrix met het exacte aantal ritten van elke rijder op elke baan.

### Rotaties Sorteren {: #sorting-rotations }

Klik op de knop **Rotaties Sorteren** (`swap_vert`) in de titelwerkbalk om alle rotatiekaarten automatisch oplopend te rangschikken op hun maximale aantal rijders.

---

## Step Up Races & Promotieladders {: #step-up-races }

Race Coordinator AI biedt volledige ondersteuning voor **Step Up races** (ook bekend als ladder-, hoofdrace-progressie of bump-up races) binnen aangepaste rotatiesets. In een step up-formaat is de competitie opgedeeld in oplopende treden of rondes—zoals **D-Finale $\rightarrow$ C-Finale $\rightarrow$ B-Finale $\rightarrow$ A-Finale**. Lager geplaatste deelnemers starten in de eerdere treden en de beste rijders promoveren ("Step Up") naar volgende rondes om het op te nemen tegen de reeds hoger geplaatste coureurs.

### Pool van Promotiecoureurs {: #step-up-driver-pool }

De linkerzijbalk bevat een speciale pool voor **Promotie**, direct onder de lijst met virtuele rijders:

- **Aantal Promotieplaatsen Instellen:** Vul het gewenste aantal promotieplaatsen in bij het invoerveld **Aantal rijders**. Standaard wordt dit ingesteld op het aantal banen min één ($\text{numLanes} - 1$), maar dit kan flexibel worden aangepast tussen 1 en 99.
- **Promotiefiches:** Virtuele promotiecoureurs worden aangeduid met een pijl omhoog (`arrow_upward`) en genummerde labels (`Promotie 1`, `Promotie 2`, enz.).
- **Toewijzen aan Banen:** Sleep promotiefiches naar baanposities van heats in Trede 2 of hoger. Tijdens de race worden deze tijdelijke posities automatisch ingevuld door de gekwalificeerde rijders uit de voorafgaande trede.

### Promotiegrenzen & Treden {: #step-up-boundaries }

De overgang tussen treden wordt geregeld door **Promotiegrenzen**:

- **Grenzen Inschakelen:** Elke heatkop bevat een knop **Promotiegrens**. Klik hierop om die heat aan te merken als de beslissende slotheat van die trede.
- **Visuele Aanduiding:** Grensheats worden duidelijk gemarkeerd met een actieve grensbadge en een opvallende rand om scharnierpunten in het schema direct herkenbaar te maken.
- **Automatische Tredeberekening:** Het markeren van een heat als grens schuift alle volgende heats binnen die groep automatisch door naar de volgende trede op de ladder (bijv. heats in Trede 1 gaan over naar **Trede 2**, vervolgens **Trede 3**, enz.). De actieve trede wordt getoond in de heatkop (`- Trede N`).
- **Dynamische Promotie op de Racedag:** Zodra de aangewezen grensheat op de racedag is voltooid, berekent de race-engine het tussenklassement van die trede en plaatst de best geklasseerde rijders direct op de startposities `Promotie 1`, `Promotie 2`, enz. van de volgende trede.

### Variabele Promoties per Trede {: #variable-step-ups }

Waar standaard algoritmische step up races een vast promotieaantal hanteren voor elke ronde (bijv. telkens precies 2 rijders die doorstromen), ondersteunen aangepaste rotatiesets **variabele promoties per trede**:

- **Aangepaste Doorstroomschema's:** U kunt per trede een afwijkend aantal doorstromers instellen. Bijvoorbeeld:
  - **Trede 1 (D-Finale):** De beste 2 rijders stromen door naar Trede 2 (`Promotie 1` en `Promotie 2`).
  - **Trede 2 (C-Finale):** De beste 3 rijders stromen door naar Trede 3 (`Promotie 1`, `Promotie 2` en `Promotie 3`).
  - **Trede 3 (B-Finale):** Slechts de beste 1 rijder stroomt door naar de A-Finale (`Promotie 1`).
- De race-engine analyseert de geplaatste promotiefiches in elke trede en promoveert exact het benodigde aantal deelnemers.

### Promotieregels & Validatie {: #step-up-validation }

De editor handhaaft strenge regels om een eerlijk en correct wedstrijdverloop te garanderen:

- **Geen Promotiecoureurs in Trede 1:** Trede 1 is de openingsronde waarin alle deelnemers regulier ingeschreven rijders moeten zijn. Een promotiecoureur toewijzen in Trede 1 is ongeldig omdat er geen voorafgaande ronde bestaat om uit te kwalificeren. De editor toont een waarschuwingsicoon (`warning`) met de melding *"Trede 1 mag geen promotiecoureurs bevatten."*, en het opslaan van ongeldige toewijzingen in trede 1 wordt door de server geweigerd.
- **Onafhankelijke Groepen:** Wanneer meerdere groepen worden gebruikt (bijv. Groep 1 en Groep 2), verlopen de ladders en promoties binnen elke groep geheel onafhankelijk van elkaar.
- **Bescherming van Volgorde:** Step Up races vereisen een strikt chronologische afhandeling van heats zodat doorstromende rijders bekend zijn voordat de volgende trede start. Daarom worden opties zoals **Volledige Heatcycli** ($> 1$) en **Heats Omkeren** bij step up races automatisch uitgeschakeld om het klassement te waarborgen.

---

## Rotaties Importeren & Exporteren {: #importing-exporting }

U kunt rotaties uitwisselen tussen computers of archiveren:

- **Volledig Asset Exporteren:** Klik op **Exporteren** in de bovenste werkbalk om het volledige aangepaste rotatieset-asset als `.json`-bestand te downloaden.
- **Enkele Rotatie Exporteren:** Klik op het exporticoon (`upload`) op een individuele rotatiekaart om alleen die specifieke configuratie te exporteren.
- **Rotaties Importeren:** Klik op **Importeren** om `.json`-rotatiebestanden of oudere Race Coordinator-bestanden (`.txt` in RC1-formaat) in uw asset te laden. De beschrijving van de rotatie krijgt automatisch de geïmporteerde bestandsnaam als standaardwaarde.

---

## Aangepaste Rotatiesets in Races Gebruiken {: #using-in-races }

Nadat uw aangepaste rotatieset-asset is opgeslagen:

1. Open de [Race-editor](race-editor.md).
2. Stel in de sectie **Race-instellingen** in het linkerpaneel het **Heatrotatieformaat** in op **Aangepaste rotatieset**.
3. Selecteer uw aangepaste rotatieset-asset in het dropdownmenu **Aangepaste rotatieset**.
4. Pas de race-instellingen naar wens aan:
   - **Volledige Heatcycli:** Herhaalt de gehele aangepaste rotatiereeks $N$ keer (uitgeschakeld bij step up races).
   - **Heats Omkeren:** Keert de heatvolgorde om (uitgeschakeld bij step up races).
5. **Integratie met Step Up:** Bevat uw aangepaste rotatieset promotiegrenzen en promotiecoureurs, dan verzorgt Race Coordinator AI de promoties tijdens de wedstrijd geheel automatisch. In het **Live Heatoverzicht** tonen de begintreden de regulier geplaatste rijders, terwijl hogere treden promotiefiches bevatten die op de wedstrijddag dynamisch worden ingevuld.
6. Gebruik de schuifregelaar voor het **Voorbeeld Aantal Rijders** en inspecteer het **Live Heatoverzicht** in het rechterpaneel om de baantoewijzingen vóór de racedag te controleren.
