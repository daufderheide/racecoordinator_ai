# UI-Editor

## Overzicht

Met de UI-Editor kunt u aangepaste racedag-layouts ontwerpen, de kolommen van het klassement configureren, geluidseffecten en afbeeldingen aanpassen en modulaire [Aangepaste Widgets](custom-widgets.md) laden.

## Aangepaste widgets en widget-map

Aangepaste widgets kunnen worden toegevoegd aan uw aangepaste UI-lay-outs:
- **Map voor aangepaste widgets**: Stel uw lokale widgetmap in via het gedeelte **Aangepaste gebruikersinterface** onderaan de editor.
- **Voorbeeldwidgets bijwerken**: Klik op **Voorbeeldwidgets bijwerken** om kant-en-klare voorbeeldwidgets te genereren of bij te werken in een map `sample/` (`sample-telemetry-gauge`, `sample-lap-delta`, `sample-sponsor-banner`, `sample-detailed-leaderboard`).
- **Widget-toolboxgroepen**: De widget-toolbox organiseert widgets in groepen (**Race Coordinator AI**, **Aangepaste hoofdmap** en eigen mappen zoals **sample**) met geneste subgroepen (zoals **Acties** en **Heatgegevens** met gecategoriseerde submappen) en een direct zoekfilter.
- **Dynamische inspecteur**: Wanneer een aangepaste widget op het canvas wordt geselecteerd, verschijnen de aangepaste eigenschappen (kleuren, drempelwaarden, schakelaars, tekstvelden) dynamisch in de Widget-inspecteur.

Raadpleeg de [Gids voor aangepaste widgets](custom-widgets.md) voor alle ontwikkelingsdetails.

## Layout- en kolomconfiguratie

- Sleep widgets van het palet naar het canvas.
- Pas grootte, positie en uitlijning van widgets aan op uw schermresolutie. Alle widgets blijven begrensd binnen het canvas.
- **Widget-inspector bediening**:
  - **Positie & grootte**: Positioneer en dimensioneer de geselecteerde widget nauwkeurig met de numerieke velden voor **X**, **Y**, **Breedte** en **Hoogte**.
  - **Widget verwijderen**: Klik op het prullenbak-icoon in de koptekst van de inspector of op de knop **Widget verwijderen** in de zijbalk.
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
- **Live Voorbeeld**: De inspecteur bevat een direct voorbeeld waarin te zien is hoe de geselecteerde opmaak eruitziet op verschillende meetpunten (`> 1 hr`, `> 1 min`, `< 1 min` en `< 10s`).

## Baankolomwidgets & Dupliceren

De widget **Baankolom** maakt het mogelijk om individuele gegevenskolommen uit het baanoverzicht (zoals coureur-info, laatste rondetijd, beste ronde / persoonlijk record, brandstof %, rondehistorie, sectorsnelheden, positie enz.) overal op het canvas te plaatsen als zelfstandige modulaire kaarten.

- **Koppelingsmodi**:
  - **Fysieke Baan**: Koppelt de kaart aan een specifieke baan van het circuit (Baan 1 t/m Baan 8). De kaart toont gedurende de hele race de gegevens van die baan.
  - **Positie in Stand**: Koppelt de kaart aan een huidige positie in het klassement (1e plaats, 2e plaats, enz.). De kaart volgt automatisch positiewisselingen en inhaalacties en past de achtergrond- en tekstkleur aan de baan van de betreffende coureur aan.
- **Layout-oriëntatie**: Ondersteunt **Verticaal** (kop boven de waarde) en **Horizontaal** (kop en waarde naast elkaar).
- **Kleur-overname & Aanpassingen**: Kaarten nemen standaard de toegewezen achtergrond- en tekstkleur van de betreffende baan over (`Baankleuren Gebruiken`), of kunnen worden voorzien van aangepaste kleuren en randen.
- **Dupliceren over Banen / Posities**:
  - In plaats van kaarten handmatig voor elke baan te maken en uit te lijnen, configureert u één baan of positie en klikt u in de inspecteur op **Dupliceren over Banen / Posities...**.
  - Kies de richting (**Horizontaal** naast elkaar of **Verticaal** boven elkaar), het totale aantal doelbanen/posities (standaard het maximale aantal banen over alle circuits in de database), de afstandsmodus (**Automatisch Passend Maken** of **Afstand Behouden**) en eventueel het overschrijven van bestaande widgets.
  - **Realtime Duplicatiemodus**: Bij het dupliceren schakelt de editor over naar een interactieve blauwdrukmodus met visuele baanrasterlijnen en magnetisch uitlijnen. In deze modus plaatst, schaalt en bewerkt u widgets direct in Baan 1 (Master); wijzigingen worden onmiddellijk in realtime gespiegeld naar alle overige banen. Gespiegelde widgets in banen 2..N zijn alleen-lezen live previews; klikken op een gespiegeld widget verplaatst de focus automatisch naar de master van Baan 1.
  - **Slim Rasterbereik & Formaat Wijzigen**: Het duplicatiegebied breidt zich automatisch in alle vier de richtingen uit om de beschikbare canvasruimte te vullen totdat het tegen de grenzen van bestaande widgets buiten het raster botst. U kunt de totale grootte van het raster aanpassen via de 8 handgrepen op de omtrek van het raster.
  - Klik op **Voltooid** om het raster vast te leggen als onafhankelijke widgets.
  - **Sjabloon Opnieuw Bewerken & Loskoppelen**: Als u later een widget van het raster selecteert, toont de inspecteur een kaart waarmee u op **Rastersjabloon Bewerken** kunt klikken (om op elk moment weer naar realtime duplicatiemodus terug te keren) of **Loskoppelen van Raster** (om de koppeling permanent te verbreken).

