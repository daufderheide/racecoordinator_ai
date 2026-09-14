# Variabele-interpolatie in Tekst-naar-Spraak (TTS)

Race Coordinator AI ondersteunt dynamische vervanging van variabelen in tekst-naar-spraakberichten voor gepersonaliseerde gesproken meldingen over rijders, rondetijden en racestatistieken.

## Syntaxis

TTS-variabelen ondersteunen een uniforme syntaxis met accolades: `{variable.path}` of `${variable.path}`. Deze syntaxis sluit naadloos aan op de **Excel-exportsjablonen** en de **aangepaste UI-widgets**.

Vervanging is **niet hoofdlettergevoelig** (bijvoorbeeld `{driver.lastLapTime}` en `{DRIVER.LASTLAPTIME}`). Spaties binnen de accolades (bijv. `{ driver.nickname }` of `${ driver.nickname }`) worden eveneens ondersteund.

## Beschikbare Variabelen

| Variabelenpad | Beschrijving |
| :--- | :--- |
| `{driver.name}` | Volledige naam van de rijder. |
| `{driver.nickname}` | Bijnaam van de rijder (valt terug op naam indien niet ingesteld). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Totaal aantal voltooide ronden. |
| `{driver.totalTime}` | Totale verstreken racetijd in seconden. |
| `{driver.lastLapTime}` | Tijd van de laatst voltooide ronde. |
| `{driver.bestLapTime}` | Snelste ronde van de rijder in de huidige heat. |
| `{driver.averageLapTime}` | Gemiddelde rondetijd van de rijder in de heat. |
| `{driver.medianLapTime}` | Mediane rondetijd van de rijder in de heat. |
| `{driver.gapLeader}` | Verschil met de leider in seconden. |
| `{driver.gapPosition}` | Verschil met de voorligger in seconden. |
| `{race.name}` | Naam van de actieve race. |
| `{track.name}` | Naam van de huidige baan. |
| `{heat.number}` | Nummer van de actieve heat. |

## Opmaakregels

### Getallen
*   **Gehele getallen**: Worden direct uitgesproken (bijv. `10`).
*   **Decimalen**: Worden automatisch afgerond op **3 decimalen** (bijv. `5.432`).

## Integratie met het Audiosysteem

TTS-aankondigingen worden beheerd door het centrale [Audiosysteem](audio.md):

*   **Stem, Snelheid & Toonhoogte**: Stel uw voorkeursstem, spreeksnelheid (`0.1x`–`2.0x`), toonhoogte en volume in via **UI Editor -> Audio-instellingen**.
*   **Prioriteitsniveaus**: Urgente meldingen (zoals gele vlag of heat afgelopen) onderbreken reguliere commentaren direct, zonder dat stemmen elkaar overlappen.
*   **Audiorelevantie**: Op rijdersstations en extra beeldschermen worden gesproken meldingen gefilterd zodat rijders enkel relevante berichten voor hun eigen wagen en baan horen.
