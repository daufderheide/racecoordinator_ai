# Tekst-naar-spraak (TTS) Variabele-interpolatie

Race Coordinator AI ondersteunt dynamische variabelensubstitutie in tekst-naar-spraakberichten voor gepersonaliseerde audio-oproepen van coureurs, rondetijden en racestatistieken.

## Syntaxis

TTS-variabelen ondersteunen enkele of dubbele accolades: `{variable.path}` of `{{variable.path}}`.

Interpolatie is **niet hoofdlettergevoelig** (bijv. `{driver.lastLapTime}` en `{DRIVER.LASTLAPTIME}`). Spaties binnen de accolades (bijv. `{{ driver.nickname }}`) worden ook ondersteund.

## Beschikbare variabelen

De volgende variabelen zijn beschikbaar in de TTS-context:

| Variabelenpad | Beschrijving |
| :--- | :--- |
| `{driver.name}` | Volledige naam van de coureur. |
| `{driver.nickname}` | Bijnaam van de coureur (valt terug op de naam indien niet ingesteld). |
| `{driver.lastLapTime}` | Tijd van de laatst voltooide ronde. |
| `{driver.bestLapTime}` | Snelste ronde van de coureur in de huidige heat. |
| `{driver.averageLapTime}` | Gemiddelde rondetijd van de coureur in de heat. |
| `{driver.lapCount}` | Totaal aantal voltooide ronden in de heat. |

## Opmaakregels

*   **Gehele getallen**: Worden rechtstreeks uitgesproken.
*   **Decimalen**: Automatisch afgerond op **3 decimalen**.
