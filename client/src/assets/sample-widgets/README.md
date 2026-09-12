# Custom Widgets Directory

This folder contains your custom widgets for **Race Coordinator AI**.

## File Structure per Widget

Each widget must live in its own subfolder and contain:

- `widget.json` (Required): Manifest metadata and inspector settings schema.
- `widget.html` (Required): HTML template.
- `widget.css` (Optional): Scoped CSS styling.
- `widget.ts` (Optional): Custom TypeScript logic extending `CustomWidgetBaseComponent`.

## Available Template & TypeScript Bindings

All templates and component classes automatically have access to:

### Race & Track Telemetry
- `raceName`: Name of the active race event.
- `trackName`: Name of the track.
- `formattedTime`: Live race timer formatted as `MM:SS.mmm`.
- `autoStatusLabel`: Race status (Green Flag, Caution, Warmup, etc.).
- `isWarmup`: Boolean indicating if in warmup.
- `totalHeats`: Total scheduled heats.
- `currentFlagUrl`: Current race flag image URL.

### Standings & Drivers
- `driverStandings`: Array of overall driver standings with:
  - `name`: Driver name / nickname.
  - `rank`: Overall position (1, 2, 3...).
  - `lapCount` / `totalLaps`: Total completed laps.
  - `totalTime`: Total elapsed race time in seconds (e.g. `112.13`).
  - `bestLapTime`: Fastest lap time in seconds (e.g. `3.892`).
  - `lastLapTime`: Most recent lap time in seconds.
  - `averageLapTime`: Average lap time in seconds.
  - `medianLapTime`: Median lap time in seconds.
  - `gapLeader`: Gap to current race leader in seconds.
  - `gapPosition`: Gap to driver ahead in position.
  - `lane`: Assigned lane number (if heat driver).
- `heatDrivers`: Drivers on track in the active heat with heat telemetry.

### Unified Template Interpolation
- `interpolate(template, context)`: Evaluates strings containing `{variable}` or `${variable}` expressions using unified telemetry bindings (matching XLS export and TTS callouts).

### Reading Custom Settings
- `getSetting('keyName', defaultValue)`: Read any setting defined in your `settingsSchema`.
- `customSettings`: Direct key-value map of saved properties.

## Full Documentation
See the full guide in `CUSTOM_WIDGETS.md` or in the Race Coordinator AI **Help Center** under **Custom Widgets**.
