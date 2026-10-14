# Dopamine Widget Library

User-contributed custom widget pack created and maintained by **dopamine**.

## Widgets Included

### 1. Advanced Laps (`advanced-laps`)
A smart lap counter widget supporting both **Heat Laps** and **Overall Race Laps** with custom pause auto-segments, racing count truncation, and allow-finish state filtering.

- **Auto-Segments**: Automatically displays fractional segments only when the heat is NOT racing (e.g. during a pause or heat finish).
- **Racing Count Truncation**: When racing with 0 decimal places, fractional segments are truncated rather than rounded up (e.g., `10.9999999` displays as `10`, while a full `1.0` lap added displays as `11`).
- **Allow Finish Pause Segments**: Configurable option to suppress pause auto-segments for drivers who are still finishing their final lap, while displaying them for drivers who have already completed the heat.
- **Heat vs. Overall Mode**: Configurable to display either live heat laps or cumulative race laps, defaulting to the standard `LAP` column header.
- **Multi-Instance Support**: Can be placed multiple times on the same layout (e.g. to display both heat and overall race laps simultaneously).
