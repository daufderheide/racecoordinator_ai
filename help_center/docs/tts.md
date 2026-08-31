# Text-to-Speech (TTS) Variable Interpolation

Race Coordinator AI supports dynamic variable substitution in Text-to-Speech strings. This allows you to create personalized callouts for drivers, lap times, and race statistics.

## Syntax

TTS variables support single or double curly brace syntax: `{variable.path}` or `{{variable.path}}`.

Interpolation is **case-insensitive**, meaning `{driver.lastLapTime}` and `{DRIVER.LASTLAPTIME}` are treated the same. Whitespace inside the braces (e.g., `{{ driver.nickname }}`) is also supported.

## Available Variables

The following variables are available in the TTS context during a race (e.g., when a lap or event is recorded):

| Variable Path | Description |
| :--- | :--- |
| `{driver.name}` | The driver's full name. |
| `{driver.nickname}` | The driver's nickname (falls back to their name if not set). |
| `{driver.lastLapTime}` | The time of the lap just completed. |
| `{driver.bestLapTime}` | The driver's fastest lap in the current heat. |
| `{driver.averageLapTime}` | The driver's average lap time for the current heat. |
| `{driver.lapCount}` | The total number of laps completed by the driver in the heat. |

## Formatting Rules

### Numbers
Numerical values (such as lap times) are automatically formatted for speech:
*   **Integers**: Spoken as-is (e.g., `10`).
*   **Decimals**: Automatically rounded and formatted to **3 decimal places** (e.g., `5.432`).

## Examples

| TTS String | Spoken Output (Example) |
| :--- | :--- |
| `{driver.nickname} lap time {driver.lastLapTime}` | "Speedy lap time five point four three two" |
| `Fastest lap for {driver.name}` | "Fastest lap for John Doe" |
| `{driver.nickname} is on lap {driver.lapCount}` | "Speedy is on lap ten" |
| `Min lap time for {{driver.nickname}}` | "Min lap time for Speedy" |

## Implementation Details

The interpolation logic is handled on the client side using the browser's Web Speech API (`speechSynthesis`). Unresolved placeholders are left untouched in the text.
