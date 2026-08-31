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
  - `lapCount` / `total_laps`: Total completed laps.
  - `total_time`: Total elapsed race time in seconds (e.g. `112.13`).
  - `best_lap_time`: Fastest lap time in seconds (e.g. `3.892`).
  - `last_lap_time`: Most recent lap time in seconds.
  - `avg_lap_time` / `average_lap_time`: Average lap time in seconds.
  - `gap_leader`: Gap to current race leader in seconds.
  - `gap_position`: Gap to driver ahead in position.
- `heatDrivers`: Drivers on track in the active heat with heat telemetry.

### Reading Custom Settings
- `getSetting('keyName', defaultValue)`: Read any setting defined in your `settingsSchema`.
- `customSettings`: Direct key-value map of saved properties.

## Full Documentation
See the full guide in `CUSTOM_WIDGETS.md` or in the Race Coordinator AI **Help Center** under **Custom Widgets**.
