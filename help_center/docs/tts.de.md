# Text-to-Speech (TTS) Variablen-Interpolation

Race Coordinator AI unterstützt dynamische Variablenersetzung in Text-to-Speech-Zeichenfolgen für personalisierte Audioansagen zu Fahrern, Rundenzeiten und Rennstatistiken.

## Syntax

TTS-Variablen unterstützen einheitliche geschweifte Klammern: `{variable.path}` oder `${variable.path}`. Diese Syntax stimmt mit den **Excel-Exportvorlagen** und den **benutzerdefinierten Benutzeroberflächen-Widgets** überein.

Die Ersetzung ist **ohne Berücksichtigung der Groß-/Kleinschreibung** (z. B. `{driver.lastLapTime}` und `{DRIVER.LASTLAPTIME}`). Leerzeichen innerhalb der Klammern (z. B. `{ driver.nickname }` oder `${ driver.nickname }`) werden ebenfalls unterstützt.

## Verfügbare Variablen

Die folgenden Variablen sind im TTS-Kontext verfügbar:

| Variablenpfad | Beschreibung |
| :--- | :--- |
| `{driver.name}` | Vollständiger Name des Fahrers. |
| `{driver.nickname}` | Spitzname des Fahrers (fällt auf den Namen zurück, falls nicht gesetzt). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Gesamtzahl der gefahrenen Runden im Durchgang. |
| `{driver.totalTime}` | Gesamte verstrichene Rennzeit in Sekunden. |
| `{driver.lastLapTime}` | Zeit der zuletzt abgeschlossenen Runde. |
| `{driver.bestLapTime}` | Schnellste Runde des Fahrers im aktuellen Durchgang. |
| `{driver.averageLapTime}` | Durchschnittliche Rundenzeit des Fahrers im Durchgang. |
| `{driver.medianLapTime}` | Mittlere Rundenzeit (Median) des Fahrers im Durchgang. |
| `{driver.gapLeader}` | Zeitabstand zum Rennführenden in Sekunden. |
| `{driver.gapPosition}` | Zeitabstand zum vorausfahrenden Fahrer in Sekunden. |
| `{race.name}` | Name des aktiven Rennens. |
| `{track.name}` | Name der aktuellen Strecke. |
| `{heat.number}` | Nummer des aktiven Durchgangs. |

## Formatierungsregeln

### Zahlen
*   **Ganzzahlen**: Werden unverändert gesprochen (z. B. `10`).
*   **Dezimalzahlen**: Werden automatisch auf **3 Nachkommastellen** gerundet (z. B. `5.432`).

## Integration mit dem Audiosystem

Text-to-Speech-Ansagen werden über das zentrale [Audiosystem](audio.md) gesteuert:

*   **Stimme, Geschwindigkeit & Tonhöhe**: Konfigurieren Sie im **UI-Editor -> Audio-Einstellungen** die bevorzugte Stimme, Geschwindigkeit (`0.1x`–`2.0x`), Tonhöhe und Lautstärke.
*   **Prioritätsstufen**: Sprachansagen sind priorisiert, sodass dringende Sicherheitsmeldungen (z. B. Gelbe Flagge, Durchgang beendet) reguläre Kommentare unterbrechen, ohne durcheinanderzusprechen.
*   **Audio-Relevanz**: Auf Fahrerstationen und separaten Bildschirmen werden TTS-Ansagen gefiltert, sodass Fahrer nur für sie relevante Ansagen hören.

## Mobile Browser & Fahrerstationen

Wenn Sie eine Fahrerstation oder Raceday-Anzeige auf einem Mobiltelefon oder Tablet anzeigen (z. B. durch Scannen des QR-Codes der Fahrerstation mit einem iPhone oder Android-Gerät):

*   **Aktivierung beim ersten Antippen**: Mobile Betriebssysteme (iOS und Android) erfordern eine physische Bildschirminteraktion, bevor Web-Audio oder Text-to-Speech abgespielt werden darf. Tippen Sie beim Öffnen der Seite einmal auf den Bildschirm (oder auf den Hinweis **Tippen Sie auf den Bildschirm, um Audio zu aktivieren**). Sobald Race Coordinator AI aktiviert ist, wird eine aktive Audiositzung aufrechterhalten, sodass Sie nur einmal tippen müssen, um durchgehende TTS-Ansagen während des gesamten Rennens zu hören.
*   **Physischer Stummschalter (iOS / iPhone)**: iPhones leiten Web-Speech über den Umgebungs-Audiokanal des Geräts weiter. Wenn Ihr iPhone über einen physischen Klingeln/Stumm-Schalter verfügt, stellen Sie sicher, dass dieser ausgeschaltet ist (nicht im Stummmodus), da die Sprachausgabe sonst stummgeschaltet wird.
