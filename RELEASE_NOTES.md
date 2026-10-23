### 🐛 Hotfix Notes

- **serial**: Increase microcontroller heartbeat watchdog tolerance to 5s (was 2s) in `DefaultProtocol` to prevent false disconnections and destructive auto-reconnect loops between heats when running over Bluetooth SPP / wireless serial links.
- **connection**: Extend client interface watchdog timeout default to 10s to ensure clean server disconnection handling without premature "No Status" alert popups.

### 📋 Cumulative Updates (Included from v1.0.1)

This hotfix builds directly on top of the recent `v1.0.1` official release and includes all its features, fixes, and improvements:

#### 🚀 Features from v1.0.1
- **UI & Controls**: Added shortcut to toggle between edit and view mode, changed eye icon to checkmark for clarity ([#947](https://github.com/daufderheide/racecoordinator_ai/issues/947)).
- **Updater**: Added warning and confirmation when downgrading release versions; channel-filtered discovery for alpha/beta/official tracks.
- **Hardware Editor**: Added "Active Low Analog LED" configuration options for Arduino and Phidget interfaces ([#911](https://github.com/daufderheide/racecoordinator_ai/issues/911)).
- **Diagnostics**: Added port conflict diagnosis when port 7070 is in use.
- **Widgets**: Updated heat-view widget with 'use lane colors' and independent text coloring ([#897](https://github.com/daufderheide/racecoordinator_ai/issues/897)).
- **Widgets**: Added auto-hide countdown widget and 'show summary for future heats' in heat list widget ([#869](https://github.com/daufderheide/racecoordinator_ai/issues/869)).

#### 🐛 Key Fixes from v1.0.1
- **Raceday**: Account for minimized state in layout editor position clamping.
- **Race Session**: Preserved active race during browser refresh grace period.
- **Rotations**: Fixed custom rotation editor heat drag-and-drop ([#986](https://github.com/daufderheide/racecoordinator_ai/issues/986)).
- **Avatars**: Clarified placeholder text on team and driver avatars ([#982](https://github.com/daufderheide/racecoordinator_ai/issues/982)).
- **Raceday Setup**: Adjusted mouseover, left-click, and keyboard navigation handling for racing and available lists ([#983](https://github.com/daufderheide/racecoordinator_ai/issues/983)).
- **Audio**: Resolved asset UUIDs in audio set entries to download endpoints ([#973](https://github.com/daufderheide/racecoordinator_ai/issues/973)).
- **Serial & Hardware**: Prevented host sleep, added serial write timeouts, and auto-recovered on microcontroller reboot ([#934](https://github.com/daufderheide/racecoordinator_ai/issues/934)).
- **Analog LEDs**: Fixed analog LED state during start sequence (yellow flag LEDs off during green start) ([#953](https://github.com/daufderheide/racecoordinator_ai/issues/953)).
- **Timers**: Stabilized auto-start/advance timers, track calls, and countdown audio cascade ([#881](https://github.com/daufderheide/racecoordinator_ai/issues/881)).
- **False Starts**: Fixed false start penalty handling to properly adjust lap counts and reaction times ([#910](https://github.com/daufderheide/racecoordinator_ai/issues/910)).

#### ⚡ Improvements from v1.0.1
- Synchronized serial writes and connection lifecycles to prevent thread contention.
- Coalesced realtime prediction updates and prewarmed theme flags.
- Optimized startup backfills, ticker delay calculations, and audio abort handling.
- Standardized hardware and demo protocol schedulers to named daemon threads.
- Eliminated scheduler self-deadlock, optimized standings indexing, and memoized timer options.

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0...v1.0.2">GitHub</a></p>
</details>
