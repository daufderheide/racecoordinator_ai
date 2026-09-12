# Text-to-Speech (TTS) Variable Interpolation

Race Coordinator AI supports dynamic variable substitution in Text-to-Speech strings. This allows you to create personalized callouts for drivers, lap times, and race statistics.

## Syntax

TTS variables support unified curly brace syntax: `{variable.path}` or `${variable.path}`. This matches the variable syntax used across **Excel Report Templates** and **Raceday Custom UI Widgets**, allowing expressions to be copied and pasted directly between systems.

Interpolation is **case-insensitive**, meaning `{driver.lastLapTime}` and `{DRIVER.LASTLAPTIME}` are treated the same. Whitespace inside the braces (e.g., `{ driver.nickname }` or `${ driver.nickname }`) is also supported.

## Available Variables

The following variables are available in the TTS context during a race (e.g., when a lap or race event is recorded):

| Variable Path | Description |
| :--- | :--- |
| `{driver.name}` | The driver's full name. |
| `{driver.nickname}` | The driver's nickname (falls back to their name if not set). |
| `{driver.totalLaps}` / `{driver.lapCount}` | Total laps completed by the driver. |
| `{driver.totalTime}` | Total elapsed race time in seconds. |
| `{driver.lastLapTime}` | Time of the lap just completed in seconds. |
| `{driver.bestLapTime}` | Driver's fastest lap time in seconds. |
| `{driver.averageLapTime}` | Driver's average lap time in seconds. |
| `{driver.medianLapTime}` | Driver's median lap time in seconds. |
| `{driver.gapLeader}` | Time gap behind the race leader in seconds. |
| `{driver.gapPosition}` | Time gap behind the driver in the position ahead in seconds. |
| `{race.name}` | Name of the active race event. |
| `{track.name}` | Name of the current track. |
| `{heat.number}` | Active heat index. |

## Formatting Rules

### Numbers
Numerical values (such as lap times and gaps) are automatically formatted for speech:
*   **Integers**: Spoken as-is (e.g., `10`).
*   **Decimals**: Automatically rounded and formatted to **3 decimal places** (e.g., `5.432`).

## Examples

| TTS String | Output (Example) |
| :--- | :--- |
| `{driver.nickname} lap time {driver.lastLapTime}` | "Speedy lap time five point four three two" |
| `Fastest lap for ${driver.name}: ${driver.bestLapTime}` | "Fastest lap for John Doe: three point two one" |
| `{driver.nickname} is on lap {driver.totalLaps}` | "Speedy is on lap ten" |
| `Leader gap is {driver.gapLeader} seconds` | "Leader gap is one point two four seconds" |

## Implementation Details

The interpolation logic is handled on the client side in `client/src/app/utils/audio.ts`. It uses a shared regular expression to evaluate both `{...}` and `${...}` placeholders before passing the final string to the browser's `speechSynthesis` API.

