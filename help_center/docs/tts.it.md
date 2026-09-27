# Interpolazione di Variabili in Sintesi Vocale (TTS)

Race Coordinator AI supporta la sostituzione dinamica di variabili nelle stringhe di sintesi vocale per creare annunci vocali personalizzati per piloti, tempi sul giro e statistiche di gara.

## Sintassi

Le variabili TTS adottano una sintassi unificata tra parentesi graffe: `{variable.path}` o `${variable.path}`. Questa sintassi coincide con quella impiegata nei **Modelli di Esportazione Excel** e nei **Widget Personalizzati dell'Interfaccia**.

L'interpolazione **non distingue tra maiuscole e minuscole** (ad esempio, `{driver.lastLapTime}` e `{DRIVER.LASTLAPTIME}`). Sono supportati anche gli spazi all'interno delle graffe (es. `{ driver.nickname }` o `${ driver.nickname }`).

## Variabili Disponibili

| Percorso Variabile | Descrizione |
| :--- | :--- |
| `{driver.name}` | Nome completo del pilota. |
| `{driver.nickname}` | Soprannome del pilota (o nome se non impostato). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Giri totali completati dal pilota. |
| `{driver.totalTime}` | Tempo totale trascorso in secondi. |
| `{driver.lastLapTime}` | Tempo dell'ultimo giro completato. |
| `{driver.bestLapTime}` | Giro più veloce del pilota nella manche attuale. |
| `{driver.averageLapTime}` | Tempo medio sul giro del pilota nella manche. |
| `{driver.medianLapTime}` | Tempo mediano sul giro del pilota nella manche. |
| `{driver.gapLeader}` | Distacco in secondi dal leader della gara. |
| `{driver.gapPosition}` | Distacco in secondi dal pilota che precede. |
| `{race.name}` | Nome della gara attiva. |
| `{track.name}` | Nome della pista attuale. |
| `{heat.number}` | Numero della manche attiva. |

## Regole di Formattazione

### Numeri
*   **Interi**: Pronunciati normalmente (es. `10`).
*   **Decimali**: Arrotondati automaticamente a **3 cifre decimali** (es. `5.432`).

## Integrazione con il Sistema Audio

Gli annunci TTS sono gestiti dal [Sistema Audio](audio.md) centralizzato:

*   **Voce, Velocità e Intonazione**: Configura la voce, la velocità (`0.1x`–`2.0x`), l'intonazione e il volume nel pannello **Editor Interfaccia -> Impostazioni Audio**.
*   **Livelli di Priorità**: Gli annunci urgenti (bandiera gialla, manche terminata) hanno la precedenza sui commenti di routine, impedendo sovrapposizioni.
*   **Rilevanza Audio**: Nelle postazioni pilota e sugli schermi secondari, i messaggi TTS sono filtrati affinché ciascun pilota ascolti solo gli avvisi della propria corsia.
