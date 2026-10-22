# UI-Editor

## Overzicht

Met de UI-Editor kunt u aangepaste racedag-layouts ontwerpen, de kolommen van het klassement configureren, geluidseffecten en afbeeldingen aanpassen en modulaire [Aangepaste Widgets](custom-widgets.md) laden.

## Layout- en kolomconfiguratie

- Sleep widgets van het palet naar het canvas.
- Pas grootte, positie en uitlijning van widgets aan op uw schermresolutie. Alle widgets blijven begrensd binnen het canvas.
- **Widget-inspector bediening**:
  - **Positie & grootte**: Positioneer en dimensioneer de geselecteerde widget nauwkeurig met de numerieke velden voor **X**, **Y**, **Breedte** en **Hoogte**.
  - **Widget verwijderen**: Klik op het prullenbak-icoon in de koptekst van de inspector.
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
- **Live Voorbeeld**: De inspecteur bevat een direct voorbeeld waarin te zien is hoe de geselecteerde opmaak eruitziet op verschillende meetpunten (`> 1 hr`, `> 1 min`, `< 1 min` en `< 10s`).

## Aftel-widgetconfiguratie

De **Aftel-widget** toont de visuele startlichten en regelt de startgeluiden tijdens de startprocedure:

- **Maximaal aantal lampen**: Bepaalt het maximale aantal getoonde startlampen (standaard 5, bereik 1 tot 10). Wanneer de startduur dit aantal overschrijdt (bijvoorbeeld een start van 6 seconden met maximaal 5 lampen), blijven alle lampen tijdens het beginverschil (1 seconde) gedimd/uit voordat de lampen achtereenvolgens oplichten.
- **Infade-animatie**: Bepaalt of de startlichten-overlay en achtergrondvervaging vloeiend infaden bij het begin van de aftelling. Indien uitgeschakeld verschijnen de lichten en achtergrond direct.
- **Oriëntatie**: Schakel tussen **Horizontale** en **Verticale** opstelling van de lichten.
- **Gloed- en vervagingseffecten**: Pas de lichtkrans rondom de lampen, de schaalvergroting van rode/groene lichten en de sterkte of het bereik van de achtergrondvervaging aan.

