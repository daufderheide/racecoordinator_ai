# Lay-out Editor

De **Lay-out Editor** biedt een speciale canvas-interface op volledig scherm voor het aanpassen, organiseren en ontwerpen van visuele schermlay-outs voor Race Coordinator AI. Deze deelt dezelfde uniforme werkbalk, objectselectie, alleen-lezen beveiliging en bewerkingsmodus-levenscyclus als de Coureur-, Baan- en Race-editors.

---

## Overzicht en Navigatie

De Lay-out Editor is toegankelijk vanaf verschillende locaties binnen de applicatie:

- **Racedag Instellingen Werkbalk**: Selecteer **Config > Lay-out Editor** (`/layout-editor` of `/layout-manager`).
- **UI Editor**: Klik op **Lay-out Editor openen** in het onderdeel UI Lay-outs in de UI Editor (`/ui-editor`).

### Alleen-lezen en Bewerkingsmodus

- **Alleen-lezen Modus (Standaard)**: Lay-outeigenschappen, canvaswidgets, afmetingen en inspectievelden zijn beveiligd tegen onbedoelde wijzigingen.
- **Bewerkingsmodus**: Door op het potloodpictogram (**Bewerken**) in de werkbalk te klikken, ontgrendelt u het lay-outcanvas, zoomknoppen, verplaatsen/formaat wijzigen van widgets en bewerking in de inspector.
- **Automatisch Opslaan en Validatie**: Bij het verlaten van de bewerkingsmodus worden wijzigingen gevalideerd (bijv. zorgen voor een unieke, niet-lege naam) en opgeslagen. Ongeldige configuraties tonen een melding en houden de editor in de bewerkingsmodus.
- **Wijzigingen Verwerpen**: Bij het verlaten of navigeren met niet-opgeslagen wijzigingen verschijnt het standaard bevestigingsvenster om gegevensverlies te voorkomen.
- **Ongedaan Maken / Opnieuw**: Volledig geïntegreerd met standaardsneltoetsen (<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd> en <kbd>Ctrl</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>).

---

## Werkbalkacties

De bovenste werkbalk biedt gestandaardiseerde beheeracties:

- **Lay-out Kiezer**: Vervolgkeuzemenu om elke systeem- of aangepaste lay-out te selecteren, natuurlijk gesorteerd met vertaalde standaardnamen (*Standaard Racedag UI*, *Standaard Training UI*, *Standaard Rijderspost UI*).
- **Bewerken / Gereed**: Schakelt tussen alleen-lezen en bewerkingsmodus.
- **Lay-out Toevoegen (<span class="material-icons">add</span>)**: Maakt een nieuwe lay-outsjabloon op basis van de standaardsysteemlay-out.
- **Lay-out Kopiëren (<span class="material-icons">content_copy</span>)**: Dupliceert de momenteel geselecteerde lay-out onder een unieke naam (bijv. *Lay-out Naam (Kopie)*).
- **Lay-out Verwijderen (<span class="material-icons">delete</span>)**: Verwijdert de huidige aangepaste lay-out na bevestiging. Standaardsysteemlay-outs zijn beveiligd en kunnen niet worden verwijderd.
- **Rondleiding (<span class="material-icons">help_outline</span>)**: Start een interactieve rondleiding die de lay-outkiezer, acties in de header, het canvas, de widgetbibliotheek en de widget-inspector toelicht.

---

## Canvas & Resolutiebediening

Gelegen in de bedieningsbalk onder de werkbalk:

### Beeldverhouding & Resolutie Voorinstellingen
Kies een beeldverhouding (**16:9**, **16:10**, **4:3**, **21:9**, **Aangepast**) om de basisafmetingen van het canvas automatisch te schalen (bijv. 1920×1080, 1920×1200, 1440×1080).

### Schaalmodi
- **Automatisch Passend (Uniform Schalen)**: Behoudt de beeldverhouding van widgets en past ze in het doelscherm.
- **Uitrekken naar Scherm**: Rekt widgets onafhankelijk uit in breedte en hoogte.
- **Vast / 1:1 Pixelverhouding**: Behoudt exacte pixelcoördinaten zonder schaling.

### Zoombediening
- Pas de zoom vloeiend aan van **25%** tot **400%** met de knoppen **-** en **+** of typ rechtstreeks een percentage.
- Klik op **Zoom Resetten** om 100% zoom te herstellen.
- Zoominstellingen worden per lay-out lokaal in de browser opgeslagen.

### Startlichten Voorvertoning
- Klik op **Startlichten Voorvertoning** (<span class="material-icons">timer</span>) om een live voorvertoning van de startlichtenvolgorde op het canvas te bekijken zonder een race te starten.

### Widgetbibliotheek & gereedschapskist
- **Widgetbibliotheek (<span class="material-icons">widgets</span>)**: Schakelt de weergave van de zwevende gereedschapskist in of uit. Een klik herstelt de gereedschapskist ook als deze geminimaliseerd is of buiten het zichtbare scherm is verplaatst.
- **Positie resetten (<span class="material-icons">restart_alt</span>)**: Geplaatst in de koptekst van de zwevende gereedschapskist om deze direct terug te zetten naar de standaardpositie linksboven `(0, 0)`.
- **Minimaliseren (<span class="material-icons">keyboard_arrow_up</span> / <span class="material-icons">keyboard_arrow_down</span>)**: Klapt de gereedschapskist in tot een compacte titelbalk om werkruimte op het canvas vrij te maken.

---

## Widget Canvas & Inspector

- **Plaatsing & Selectie**: Klik op een willekeurige widget op het canvas of selecteer deze uit de vervolgkeuzelijst.
- **Verplaatsen & Grootte Wijzigen**: Sleep widgets vrij binnen de canvasgrenzen. Gebruik de inspector om exacte numerieke waarden in te voeren voor **X**, **Y**, **Breedte** en **Hoogte**.
- **Toetsenbordverplaatsing**:
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verplaatst de geselecteerde widget met 1px.
  - <kbd>Shift</kbd> + Pijltjestoetsen: Verplaatst de geselecteerde widget met 10px.
  - <kbd>Delete</kbd> of <kbd>Backspace</kbd>: Verwijdert de geselecteerde widget.
- **Banen Repliceren**: Repliceer een geselecteerde baankolomkaart over alle actieve banen, posities, tussenstanden of coureurkwalificaties.
- **Gestapelde Kolommen Detectie & Reparatie**:
  - De editor detecteert automatisch dubbele of overlappende kolommen in baangrids.
  - Een waarschuwingsbalk biedt een **Snelle Oplossing** met één klik of **Problemen Beoordelen** in een interactief venster.

---

## Importeren, Exporteren & Migratie

- **Lay-out Importeren**: Importeer een bestaand lay-out JSON-bestand via bestandsselectie.
- **Lay-out Exporteren**: Download de actieve lay-out als een zelfstandig JSON-bestand.
- **Back-ups Vóór Migratie**: Herstel back-upsnapshots van vóór migratie voor lay-outs die vanuit eerdere versies zijn bijgewerkt, of exporteer migratiediagnostiek.
