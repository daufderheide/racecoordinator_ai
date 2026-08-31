# Interpolazione delle variabili sintesi vocale (TTS)

Race Coordinator AI supporta la sostituzione dinamica delle variabili nelle stringhe di sintesi vocale (TTS) per annunci vocali personalizzati.

## Sintassi

Le variabili TTS supportano parentesi graffe singole o doppie: `{variable.path}` o `{{variable.path}}`.

L'interpolazione **non fa distinzione tra maiuscole e minuscole** (ad es. `{driver.lastLapTime}` e `{DRIVER.LASTLAPTIME}`). Sono supportati anche gli spazi all'interno delle parentesi graffe (ad es. `{{ driver.nickname }}`).

## Variabili disponibili

Le seguenti variabili sono disponibili nel contesto TTS:

| Percorso variabile | Descrizione |
| :--- | :--- |
| `{driver.name}` | Nome completo del pilota. |
| `{driver.nickname}` | Soprannome del pilota (utilizza il nome se non impostato). |
| `{driver.lastLapTime}` | Tempo dell'ultimo giro completato. |
| `{driver.bestLapTime}` | Giro più veloce del pilota nella manche attuale. |
| `{driver.averageLapTime}` | Tempo medio sul giro del pilota nella manche. |
| `{driver.lapCount}` | Numero totale di giri completati nella manche. |

## Regole di formattazione

*   **Interi**: Pronunciati così come sono.
*   **Decimali**: Arrotondati automaticamente a **3 cifre decimali**.
