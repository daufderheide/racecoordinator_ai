# UI-Editor

## Overzicht

Met de UI-Editor kunt u aangepaste racedag-layouts ontwerpen, de kolommen van het klassement configureren, geluidseffecten en afbeeldingen aanpassen en modulaire [Aangepaste Widgets](custom-widgets.md) laden.

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
