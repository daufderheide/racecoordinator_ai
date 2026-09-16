# Audio System

Race Coordinator AI features an intelligent, dual-channel audio engine designed to deliver rich sound effects, dynamic voice commentary, and critical race control announcements without chaotic overlapping or missed cues.

---

## Dual-Channel Audio Architecture

The audio engine separates sound into two distinct channels:

```
                      ┌────────────────────────────────────────┐
                      │            Audio Dispatcher            │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Sound Effects (SFX)  │                      │     Voice Callouts     │
     │  (Non-Verbal Presets)  │                      │    (TTS & Commentary)  │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
         Polyphonic Playback                          Prioritized Single Voice
      (Concurrently plays tones)                     ("Play, Preempt, or Drop")
                  │                                               │
                  │◄────────────── Audio Ducking ─────────────────┤
                  │     (SFX automatically ducked to 20% volume   │
                  │       while voice callouts are speaking)      │
```

### 1. Sound Effects (SFX)
- **What it covers:** Short, non-verbal tones such as lap trigger beeps (`default_beep`), driveby swooshes (`default_driveby`), or chime tones.
- **Polyphonic Playback:** Sound effects play immediately using HTML5 audio elements. Multiple cars crossing the finish line at the same instant will each trigger their respective lap tones concurrently without cutting each other off.
- **Automatic Audio Ducking:** When a verbal voice callout is actively speaking, any concurrent sound effects are automatically dimmed to **20% volume**. Once the voice callout finishes, sound effect volume immediately restores to 100%.

### 2. Verbal Voice Callouts
- **What it covers:** Spoken Text-to-Speech (TTS) announcements, pre-recorded verbal WAV/MP3 clips (such as commentary, yellow flag sirens, pit alerts, and countdown voices).
- **Single-Speaker Engine:** Verbal callouts are managed through a single-voice channel using the **"Play, Preempt, or Drop"** engine to ensure that multiple voices never talk over each other.

---

## The Priority System & Playback Engine

Because races generate numerous simultaneous events (multiple cars finishing laps, leader changes, yellow flags, time announcements), Race Coordinator AI uses a 4-tier priority hierarchy to resolve voice collisions cleanly.

### Priority Tiers

| Priority Tier | Weight | Typical Events | Behavior on Channel Conflict |
| :--- | :---: | :--- | :--- |
| **`urgent`** | 4 | Yellow Flag, Heat Over, Race Over, False Start, Minimum Lap Time infraction, Drift Lap infraction, Pit-In, Fuel Alerts (Warning, Critical, Empty). | **Preempts** active lower-priority callouts immediately. If another `urgent` callout is already speaking, incoming urgent callouts are **queued** in the Urgent Queue instead of being dropped. Bypasses cadence spacing. |
| **`high`** | 3 | Overall Track Record Lap, Overall Lane Record Lap, New Race Leader, Race Best Lap. | **Preempts** active `normal` or `low` priority callouts. **Dropped** if an `urgent` or equal/higher callout is speaking. |
| **`normal`** | 2 | Race Time countdown announcements (e.g. "30 seconds left"), Halfway point, Heat Best Lap, Race Lane Best Lap, New Heat Leader, Driver Personal Best Lap (when configured as TTS). | **Preempts** active `low` priority callouts. **Dropped** if an `urgent`, `high`, or another `normal` callout is speaking. |
| **`low`** | 1 | Routine Driver Lap Sound (when configured as TTS). | Plays only when the voice channel is completely idle. **Dropped** if any active callout is speaking. |

### Collision Handling Rules

1. **Preemption:** If an event arrives with a higher priority weight than the currently speaking voice callout, the current callout is stopped immediately, and the new higher-priority callout begins.
2. **Dropping:** If an incoming callout has an equal or lower priority weight than the active callout, the incoming callout is dropped so the current message is not interrupted and voices do not clash.
3. **Urgent Queueing:** Unlike lower tiers, `urgent` events are safety and race control critical. If an `urgent` callout arrives while another `urgent` callout is speaking, it enters the **Urgent Callout Queue** and plays as soon as the active urgent message finishes.
4. **Cadence Pause (Callout Spacing):** After any verbal callout finishes, a brief silent pause is injected before the next non-urgent callout may begin. This spacing prevents speech from sounding rushed or unintelligible. `urgent` alerts bypass this pause immediately.

### Milestone Audio Priority & Fallback

When a driver completes a lap that triggers one or more milestones (such as track records, heat best lap, or leader change):

1. **Priority Cascade for Simultaneous Events:** Candidate milestone sounds are evaluated in strict priority order (Overall Best -> Overall Lane Best -> New Race Leader -> New Heat Leader -> Race Best -> Race Lane Best -> Heat Best -> Personal Best). If the highest-priority sound is configured as `none` (or unconfigured), playback cascades to the next highest-priority sound triggered on that lap, continuing down the chain until a configured sound is found.
2. **Channel Busy Dropped Callouts:** If a selected verbal milestone announcement is **dropped** because a higher-priority callout is currently speaking (or during callout cadence spacing), no further verbal announcements will play on that lap. Instead, playback falls back directly to the driver's Personal Best sound (if it was a personal best lap) or standard Lap Sound.
3. **Polyphonic SFX Fallback:** If the fallback sound is a preset sound effect (SFX), it plays polyphonically via the SFX channel. This guarantees that drivers always receive immediate acoustic feedback when crossing the line, even in the middle of live race commentary.

---

## Audio Configuration Settings

Global audio parameters can be adjusted in the **UI Editor** under the **Audio Settings** accordion section.

![Audio Settings in UI Editor](https://daufderheide.github.io/racecoordinator_ai/images/audio_settings.png){: style="max-width: 600px; display: block; margin: 1em 0;" }

### Master Volume
- **Range:** 0% to 100% (Default: `100%`)
- **Description:** Sets the overall master volume ceiling for the entire application, scaling both Sound Effects and Text-to-Speech output.

### Urgent Queue Timeout (TTL)
- **Options:** `3 seconds`, `5 seconds (Default)`, `10 seconds`
- **Description:** Defines the maximum Time-To-Live (TTL) for alerts waiting in the Urgent Queue. If multiple urgent events occur in rapid succession, any queued alert that exceeds this expiration limit is discarded. This ensures that time-sensitive alerts (like a brief false start) do not play long after the race situation has changed.

### Callout Spacing (Cadence Pause)
- **Options:**
  - `None (0s)`: Spoken callouts can start immediately after the previous callout ends.
  - `Short (500ms - Default)`: Injects a half-second silence between consecutive announcements.
  - `Normal (1000ms)`: Injects a full 1-second pause.
  - `Relaxed (1500ms)`: Injects a 1.5-second pause for a calm, spaced commentary pace.
- **Description:** Enforces a minimum breathing room between successive voice callouts. Urgent race control alerts immediately bypass this cooldown.

---

## Text-to-Speech (TTS) Configuration

Race Coordinator AI integrates with the native Web Speech API built into modern web browsers, providing zero-latency, client-side speech synthesis without requiring third-party cloud services or internet access during races.

### TTS Voice Parameters

All TTS voice parameters are configurable in the **UI Editor -> Audio Settings** section:

| Setting | Range / Options | Default | Description |
| :--- | :--- | :---: | :--- |
| **TTS Voice** | Browser / OS Voices | `-- System Default --` | Selects which installed voice is used for spoken announcements. The list displays voice names along with language codes (e.g., `en-US`, `en-GB`, `de-DE`, `es-ES`). |
| **Speech Speed (Rate)** | `0.1x` to `2.0x` | `1.0x` | Controls speaking speed. Setting a slightly faster rate (`1.1x`–`1.3x`) can help announcers keep pace on tracks with very short lap times. |
| **Speech Pitch** | `0.0x` to `2.0x` | `1.0x` | Adjusts voice pitch/frequency (lower values produce a deeper tone; higher values produce a higher pitch). |
| **Voice Volume** | `0%` to `100%` | `100%` | Adjusts TTS speech volume independently before being scaled by the Master Volume (`masterVolume * ttsVolume`). |
| **Test Voice Button** | Button | — | Plays an instant preview phrase ("Race Coordinator AI speech test") with your currently selected voice, rate, pitch, and volume. |

### Dynamic TTS Variable Interpolation

TTS callout strings support dynamic placeholder variables enclosed in `{...}` or `${...}` curly braces. Values are substituted in real time when the event occurs:

- `{driver.name}` / `{driver.nickname}`: Driver identity.
- `{driver.lastLapTime}` / `{driver.bestLapTime}` / `{driver.averageLapTime}`: Lap times (automatically rounded to 3 decimal places for natural speech).
- `{driver.totalLaps}` / `{driver.lapCount}`: Total laps completed.
- `{driver.gapLeader}` / `{driver.gapPosition}`: Time gaps to the leader or car ahead.
- `{race.name}`, `{track.name}`, `{heat.number}`: Event context.

For a full reference of available variables and syntax examples, see the [Text-to-Speech (TTS) Guide](tts.md).

---

## Audio Relevance & Multi-Display Filtering

In professional or club racing environments, Race Coordinator AI often drives multiple screens simultaneously:
- A large primary overhead projector or TV showing the overall leaderboard.
- Dedicated driver station tablets or monitors at each lane station.
- Practice or pit monitors.

If every screen played every sound, the room would quickly become chaotic. **Audio Relevance** ensures that each screen only plays sounds that are relevant to what is currently displayed on that screen.

```
                           ┌──────────────────────────────┐
                           │      Race Event Dispatched   │
                           │  (tagged with Association)   │
                           └──────────────┬───────────────┘
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 ▼                                                 ▼
   ┌───────────────────────────┐                     ┌───────────────────────────┐
   │    Main Raceday Display   │                     │   Driver Station (Lane 2) │
   │  Layout-Based Relevance   │                     │    Scoped Audio Relevance │
   └─────────────┬─────────────┘                     └─────────────┬─────────────┘
                 │                                                 │
       Checks Screen Widgets:                            Checks Assigned Lane:
   • Has Lane View? -> Plays All Laps                • Lane 2 lap/PB/fuel? -> Plays
   • Missing Lane View? -> Mutes Laps                • Lane 1 or 3 lap? -> Silenced
   • Has Flag Widget? -> Plays Flags                 • Global race flags? -> Plays
```

### 1. Audio Associations
Whenever Race Coordinator AI dispatches an audio cue, it attaches an `AudioAssociation` payload:
- **`widgetType`**: Identifies the functional domain (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: The 0-indexed lane number associated with the event (e.g. Lane 0, Lane 1).
- **`driverId`**: The specific driver entity ID.

### 2. Layout-Based Filtering on the Main Display
On the primary Raceday page, the audio system inspects the active Custom UI Layout:
- **Lane Audio (`lane-view`):** If the layout contains at least one Lane View widget, driver lap sounds, records, pit-in tones, and fuel alerts are enabled. If the layout is a pure spectator clock or leaderboard without lane views, driver lap sounds are muted (`driverAudioMode: 'none'`).
- **Countdown Audio (`countdown`):** If the countdown widget is omitted from the layout, countdown beeps are silenced.
- **Timer Audio (`timer`):** If no timer widget is placed on screen, halfway and seconds-remaining announcements are muted.
- **Race State Audio (`flag`):** If no flag widget is present, yellow flag and race termination sounds are silenced.

### 3. Scoped Audio on Driver Stations
When a driver station display is opened (e.g. `/driver-station/1` for Lane 2):
- The relevance filter runs in **`scoped`** mode.
- Only audio belonging to that specific lane or driver is permitted to play (their routine lap tone, personal best lap, pit-in alert, and fuel warning).
- Audio from other lanes is filtered out and silently ignored, preventing drivers from being distracted by their competitors' lap beeps.
- General race control events (countdown start beeps, yellow flag sirens, heat over) remain active so the driver stays aware of race status.

### 4. Per-Page Audio Engine Isolation
Each browser tab and client page runs its own dedicated `AudioService` instance (`providers: [AudioService]`).
- Audio playing on a driver station tablet never preempts, queues behind, or interferes with audio playing on the race director's master computer.
- Audio volume and speech synthesis operate independently across devices.

---

## Complete Audio Resource Catalog

The following reference tables detail all audio events in Race Coordinator AI, their sound classification (non-verbal SFX vs. verbal Voice Callout), priority tier, and display relevance scope.

### Driver Audio Events (Configured in Driver Editor)

| Driver Audio Event | When Played | Default File / Asset | Sound Type | Priority Tier | Relevance & Display Scope |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Lap Sound** | Played on every standard lap completion (or as fallback if a milestone sound is dropped or unavailable). | `default_beep` | **SFX** (preset) / **Voice Callout** (TTS) | `low` (Weight 1 when TTS; Polyphonic when preset SFX) | `lane-view`: Plays on Main Raceday (if Lane View widget is present) and on Driver Station for that specific lane/driver. |
| **Personal Best Lap Sound** | Played when the driver achieves their fastest lap time of the current heat or session. | `default_driveby` | **SFX** (preset) / **Voice Callout** (TTS) | `normal` (Weight 2 when TTS; Polyphonic when preset SFX) | `lane-view`: Plays on Main Raceday (if Lane View widget is present) and on Driver Station for that specific lane/driver. |
| **Race Best Lap Sound** | Played when setting the fastest lap time across all heats and lanes in the current race. | `default_best_race_lap` | **Voice Callout** | `high` (Weight 3) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Race Lane Best Lap Sound** | Played when setting the fastest lap time on that specific lane during the current race. | `default_best_race_lane_lap` | **Voice Callout** | `normal` (Weight 2) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Heat Best Lap Sound** | Played when setting the fastest lap time among all drivers in the active heat. | `default_best_heat_lap` | **Voice Callout** | `normal` (Weight 2) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **New Race Leader Sound** | Played when a driver takes first place in the overall race standings. | `default_new_race_leader` | **Voice Callout** | `high` (Weight 3) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **New Heat Leader Sound** | Played when a driver takes the lead in the active heat. | `default_new_heat_leader` | **Voice Callout** | `normal` (Weight 2) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Overall Record Lap Sound** | Played when breaking the all-time track record across all lanes and historical races. | `default_record_lap` | **Voice Callout** | `high` (Weight 3) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Overall Lane Record Lap Sound** | Played when breaking the all-time track record for that specific lane. | `default_record_lane_lap` | **Voice Callout** | `high` (Weight 3) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Pit In Sound** | Played when the car enters the pit lane or refueling area. | `default_pit_in` | **Voice Callout** | `urgent` (Weight 4) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Fuel Level Sounds** | Played when fuel drops into warning, critical, or empty thresholds. | `default_fuel_level` (Audio Set) | **Voice Callout** | `urgent` (Weight 4) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **False Start Sound** | Played when a false start or start-line infraction is detected. | `default_penalty` | **Voice Callout** | `urgent` (Weight 4) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |

### Theme Audio Events (Configured in Theme Manager / Editor)

| Audio Slot | Default Slot Key | Sound Type | Priority Tier | Relevance & Display Scope |
| :--- | :--- | :--- | :---: | :--- |
| **Start Countdown** | `audio.countdown` | **Voice Callout** / Audio Set | `urgent` | `countdown`: Plays on Main Raceday (if Countdown widget is present) and on all Driver Stations. |
| **Green Lamp / GO** | `audio.countdown.green` | **Voice Callout** / Preset Tone | `urgent` | `countdown`: Plays on Main Raceday (if Countdown widget is present) and on all Driver Stations. |
| **Yellow Flag** | `audio.yellowflag` | **Voice Callout** (Warning Siren) | `urgent` (Weight 4) | `flag`: Plays on Main Raceday (if Flag widget is present) and on all Driver Stations. |
| **Auto-Start Seconds Left** | `audio.auto_start` | **Voice Callout** / Audio Set (Default: TTS) | `normal` (Weight 2) | `timer`: Plays on Main Raceday (if Timer widget is present) and on all Driver Stations. |
| **Remaining Seconds** | `audio.seconds_left` | **Voice Callout** | `normal` (Weight 2) | `timer`: Plays on Main Raceday (if Timer widget is present) and on all Driver Stations. |
| **Laps Left** | `audio.laps_left` | **Voice Callout** | `normal` (Weight 2) | `timer`: Plays on Main Raceday (if Timer widget is present) and on all Driver Stations. |
| **Halfway** | `audio.seconds_left.halfway` | **Voice Callout** | `normal` (Weight 2) | `timer`: Plays on Main Raceday (if Timer widget is present) and on all Driver Stations when reaching halfway in timed races or when the leader reaches half the lap count in lap-based races. |
| **Heat Finished** | `audio.heat_over` | **Voice Callout** | `urgent` (Weight 4) | `flag`: Plays on Main Raceday (if Flag widget is present) and on all Driver Stations. |
| **Auto-Advance Seconds Left** | `audio.auto_advance` | **Voice Callout** / Audio Set (Default: TTS) | `normal` (Weight 2) | `timer`: Plays on Main Raceday (if Timer widget is present) and on all Driver Stations. |
| **Race Finished** | `audio.race_over` | **Voice Callout** | `urgent` (Weight 4) | `flag`: Plays on Main Raceday (if Flag widget is present) and on all Driver Stations. |
| **Minimum Lap Time** | `audio.min_lap_time` | **Voice Callout** | `urgent` (Weight 4) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |
| **Drift Lap** | `audio.drift_lap` | **Voice Callout** | `urgent` (Weight 4) | `lane-view`: Plays on Main Raceday and Driver Station for that specific lane/driver. |

---

## Where Audio is Configured

Here is a quick summary of where different audio features are configured across Race Coordinator AI:

| Configuration Area | What You Can Configure |
| :--- | :--- |
| **UI Editor -> Audio Settings** | Master volume, Urgent queue timeout (TTL), Callout spacing cadence pause, TTS voice selection, speech speed (rate), speech pitch, TTS volume, and voice preview test. |
| **Theme Editor** | System-wide event sounds: start countdown sequence beeps, green lamp GO tone, yellow flag caution sirens, halfway callout, remaining seconds callout, heat finished sound, race finished sound, minimum lap time violation sound, and drift lap violation sound. |
| **Driver Editor** | Driver-specific sounds: lap sound, personal best lap sound, race best lap sound, race lane best lap sound, heat best lap sound, new race leader sound, new heat leader sound, overall record lap sound, overall lane record lap sound, pit in sound, fuel level sounds, and false start sound. |
| **Asset Manager** | Uploading and organizing custom WAV, MP3, and OGG audio files. Clicking an uploaded audio file instantly plays a preview. |
