# Text-to-Speech (TTS) Variablen-Interpolation

Race Coordinator AI unterstützt dynamische Variablenersetzung in Text-to-Speech-Zeichenfolgen für personalisierte Audioansagen zu Fahrern, Rundenzeiten und Rennstatistiken.

## Syntax

TTS-Variablen unterstützen einfache oder doppelte geschweifte Klammern: `{variable.path}` oder `{{variable.path}}`.

Die Ersetzung ist **ohne Berücksichtigung der Groß-/Kleinschreibung** (z. B. `{driver.lastLapTime}` und `{DRIVER.LASTLAPTIME}`). Leerzeichen innerhalb der Klammern (z. B. `{{ driver.nickname }}`) werden ebenfalls unterstützt.

## Verfügbare Variablen

Die folgenden Variablen sind im TTS-Kontext verfügbar:

| Variablenpfad | Beschreibung |
| :--- | :--- |
| `{driver.name}` | Vollständiger Name des Fahrers. |
| `{driver.nickname}` | Spitzname des Fahrers (fällt auf den Namen zurück, falls nicht gesetzt). |
| `{driver.lastLapTime}` | Zeit der zuletzt abgeschlossenen Runde. |
| `{driver.bestLapTime}` | Schnellste Runde des Fahrers im aktuellen Durchgang. |
| `{driver.averageLapTime}` | Durchschnittliche Rundenzeit des Fahrers im Durchgang. |
| `{driver.lapCount}` | Gesamtzahl der gefahrenen Runden im Durchgang. |

## Formatierungsregeln

*   **Ganzzahlen**: Werden unverändert gesprochen.
*   **Dezimalzahlen**: Werden automatisch auf **3 Nachkommastellen** gerundet.
