# Themes

## Overview {: #overview }

Themes define the complete audiovisual presentation and aesthetic atmosphere of your race events in Race Coordinator AI. Rather than configuring display assets, lighting graphics, and sound callouts individually for every race, themes bundle these visual and audio elements into reusable profiles.

When a theme is active, it coordinates:
- The paired display layout on the main screen.
- Synchronized visual graphics for flags, countdown lamps, and fuel gauges.
- System-wide sound effects, countdown cues, and voice announcements.
- Centralized audio overrides for individual driver sound effects.

---

## Theme Settings {: #top-selectors }

Located in the top controls bar of the Theme Editor, these settings define the core properties and linked layouts for the theme:

- **Theme Name:** The unique identifier for the theme. Default system themes (*RC AI*, *Formula*, *Endurance*) are protected and cannot be deleted or renamed.
- **Linked UI Layout:** Selects the display layout created in the [Layout Editor](layout-editor.md) that is automatically loaded onto the primary race display when this theme is selected for a race.
- **Driver Station Theme:** Specifies the theme used when opening a dedicated single-lane driver station display or when a driver connects via a mobile device or tablet.
- **Driver View Theme:** Specifies the theme used for multi-lane driver view schedule displays and spectator monitors.

---

## Flag Images {: #flags }

The Flag Images section lets you customize the graphics displayed on the race canvas, flag widgets, and driver stations for every racing condition:

- **Racing (`flag.racing`):** Displayed during active racing conditions when the track is green and cars are lapping freely.
- **Heat Paused (`flag.heat_paused`):** Yellow caution flag displayed during a track call or race pause.
- **Heat Over (`flag.heat_over`):** Checkered flag displayed when the heat duration or target laps have concluded.
- **Race Over (`flag.race_over`):** Final checkered flag signaling the conclusion of the entire race event.
- **Not Started (`flag.not_started`):** Flag displayed prior to the start of a heat or race.
- **Starting (`flag.starting`):** Red flag displayed during the initial countdown sequence before the lights go green.
- **Restarting (`flag.restarting`):** Flag displayed during the restart countdown following a yellow flag or track call.
- **One Lap To Go (`flag.one_lap_to_go`):** Traditional white flag signaling that the race leader is on their final lap.
- **Heat Finishing (`flag.heat_finishing`):** Flag displayed when the leader has crossed the finish line and subsequent cars are finishing their current lap.
- **Warmup (`flag.warmup`):** Displayed during practice and pre-race driver warmup sessions.
- **Driver Finished (`flag.driver_finished`):** Per-lane or individual indicator displayed for drivers who have completed their required laps.
- **Penalty (`flag.penalty`):** Black flag indicator displayed when a driver triggers a false start or lap infraction penalty.

For each flag, you can select from built-in presets or upload custom SVG, PNG, WebP, or JPG image assets from your library via the [Asset Manager](asset-manager.md).

---

## Countdown Lights {: #countdown }

The Countdown Lights section configures the visual lamp assets used by the Countdown Widget and on-screen starting lights:

- **Red Lamp Off (`lamp.red.dim`):** The unlit or dimmed red lamp graphic shown when the lights are idle or before the start countdown begins.
- **Red Lamp On (`lamp.red.on`):** The illuminated red lamp graphic displayed during each stage of the starting countdown sequence.
- **Green Lamp (`lamp.green`):** The bright green lamp graphic displayed at the moment of start or restart when power is applied to the track.

These graphics automatically scale to fit horizontal and vertical starting light widgets configured in your layouts.

---

## Fuel Gauge {: #fuel-gauge }

The Fuel Gauge section configures multi-frame visual gauges used during analog and digital fuel race simulations:

- **Fuel Gauge Set (`gauge.fuel`):** An image set containing multiple sequential frames representing fuel levels from full (100%) down to empty (0%).

During a race with fuel simulation enabled, Race Coordinator AI continuously calculates throttle-based or lap-based consumption and updates the gauge frame in real time. When fuel drops below the low-fuel threshold, the gauge triggers flashing animations and warning cues to signal drivers to enter the pit lane.

---

## Sound Effects {: #audio }

Themes allow you to customize system-wide sound effects, countdown audio, periodic time callouts, and voice announcements:

- **Start Countdown (`audio.countdown`):** Sound effects played during the countdown sequence before the heat begins.
- **Green Lamp / GO (`audio.countdown.green`):** Tone or horn played the moment the starting lights turn green and the race begins.
- **Yellow Flag (`audio.yellowflag`):** Warning sirens or horns triggered when a caution period or track call occurs.
- **Auto-Start Seconds Left (`audio.auto_start`):** Periodic countdown voice announcements before an automatic heat start.
- **Heat Time Seconds Left (`audio.seconds_left`):** Periodic time announcements indicating remaining heat duration.
- **Halfway Mark (`audio.seconds_left.halfway`):** Notification when reaching the halfway mark of a heat (half duration elapsed or leader completing half the required laps).
- **Leader Lap Count (`audio.laps_left`):** Voice announcements for remaining laps for the heat leader.
- **Heat Finished (`audio.heat_over`):** Sound cue signaling the conclusion of the active heat.
- **Race Finished (`audio.race_over`):** Grand fanfare or sound cue signaling the end of the entire race event.
- **Auto-Advance Seconds Left (`audio.auto_advance`):** Periodic countdown announcements before automatically advancing to the next heat.
- **Minimum Lap Time Infraction (`audio.min_lap_time`):** Alert tone played when a car triggers a sensor below the minimum allowed lap threshold.

Each audio slot can be configured as:
1. **Preset Sound:** Choose from Race Coordinator AI's built-in sound effects library.
2. **Custom Audio Asset:** Upload custom WAV, MP3, or OGG files via the Asset Manager.
3. **Text-to-Speech (TTS):** Dynamic voice synthesizer phrases with runtime variable interpolation (such as `{time}` and `{laps}`).

For complete details on audio ducking, priority tiers, and multi-display output, see the [Audio System](audio.md) documentation.

---

## Driver Audio Overrides {: #driver-audio-overrides }

In standard racing, each driver can have personalized lap tones and voice callouts configured in the [Driver Editor](driver-editor.md). However, for club events, commercial raceways, or themed championships, race organizers often want a uniform audio experience across all competitors.

The **Driver Audio Overrides** section allows the theme to centrally override any or all driver audio callouts across all participants in the race.

### Available Driver Audio Overrides

The theme can override any of the 13 individual driver audio events:

#### Personal Lap Sounds
- **Lap Completed (`lapAudio`):** Sound played every time a driver completes a standard valid lap.
- **Personal Best Lap (`bestLapAudio`):** Sound played when a driver beats their own previous best lap time in the current race session.

#### Race Lap Sounds
- **Race Best Lap (`raceBestLapAudio`):** Sound played when a driver posts the fastest lap time recorded across all lanes and drivers in the current race.
- **Race Lane Best Lap (`raceLaneBestLapAudio`):** Sound played when a driver records the fastest lap on their specific lane in the current race.
- **Heat Best Lap (`heatBestLapAudio`):** Sound played when a driver sets the fastest lap time of the active heat.
- **New Race Leader (`newRaceLeaderAudio`):** Voice callout or celebratory sound played when a driver takes the overall race lead.
- **New Heat Leader (`newHeatLeaderAudio`):** Sound played when a driver takes 1st place in the active heat.

#### Overall Best Lap Sounds
- **Overall Best Lap (`overallBestLapAudio`):** High-priority sound played when a driver sets an all-time track record across all lanes.
- **Overall Lane Best Lap (`overallLaneBestLapAudio`):** Sound played when a driver sets an all-time record for that specific track lane.

#### Event Sounds
- **Pit In (`pitInAudio`):** Sound played when a car enters the pit lane or triggers pit lane entry sensors on digital tracks.
- **Fuel Warning (`fuelAudio`):** Warning tone or voice announcement when reaching reserve fuel or running out of fuel.
- **False Start / Penalty (`penaltyAudio`):** Buzzer or horn played when a car commits a false start or incurs a lap penalty.
- **Drift Lap (`driftLapAudio`):** Urgent sound or voice callout played when a car coasts across the finish sensor while track power is off within the drift time window.

### Override Priority & Modes

Each driver audio event in the list can be configured independently:

- **Disabled (Checkbox Unchecked):** The theme leaves the slot untouched. Race Coordinator AI plays the individual driver's customized sound (or the system default if unconfigured).
- **Enabled (Checkbox Checked):** The theme overrides the sound event for **every driver** participating in races using this theme, regardless of what they configured in their individual profile.

When enabled, choose from four output modes:
1. **Preset Sound:** Select a standard sound effect from the built-in catalog.
2. **Uploaded Audio Asset:** Select a custom audio file from your Asset Manager library.
3. **Text-to-Speech (TTS):** Enter a custom phrase with driver-specific variable interpolation:
   - `{driver}` — The driver's display name or nickname.
   - `{time}` — The lap time formatted to three decimals (e.g. `3.142`).
   - `{lane}` — The active lane number (e.g. `2`).
   - `{lap}` — The current completed lap count.
   - `{gap}` — The time gap to the leader or nearest car.
4. **None (Mute):** Completely silences the event theme-wide, preventing any sound or announcement from playing.

### Reset All Overrides

Click the **Reset All Overrides** button in the header of the Driver Audio Overrides section to clear all theme overrides at once. All 13 slots will revert to their un-checked default state, restoring audio control entirely to each driver's individual profile.
