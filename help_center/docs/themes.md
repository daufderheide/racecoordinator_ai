# Themes

!!! note "Content Coming Soon"
    This article is under development. Check back soon for detailed documentation.

## Overview

*Content coming soon.*

## Themes

Each theme bundles visual assets (flags, countdown lights, fuel gauges), audio callouts, and layout assignments:

- **Custom UI Layout:** The paired display layout loaded during the race.
- **Driver Station Theme:** The theme used when opening or scanning into a single-lane driver station window or device.
- **Driver View Theme:** The theme used when opening or scanning into the driver view schedule window or personal device display.

## Flag Images

*Content coming soon.*

## Countdown Images

*Content coming soon.*

## Fuel Images

*Content coming soon.*

## Audio

Themes allow you to customize system-wide sound effects and voice callouts for race control events:

- **Start Countdown:** Sounds played during the start sequence (`audio.countdown`).
- **Green Lamp / GO:** Tone played when the starting lights turn green (`audio.countdown.green`).
- **Yellow Flag:** Warning sirens or horns triggered during a caution period (`audio.yellowflag`).
- **Auto-Start Seconds Left:** Countdown announcements for remaining time before a heat starts automatically (`audio.auto_start`).
- **Heat Time (Seconds Left):** Countdown announcements for remaining heat time (`audio.seconds_left`).
- **Leader Lap Count (Laps Left):** Announcements for remaining laps for the heat leader (`audio.laps_left`).
- **Halfway:** Notification when reaching the halfway mark of a heat — for both timed races (half the duration elapsed) and lap-based races (when the heat leader completes half the required laps) (`audio.seconds_left.halfway`).
- **Heat Finished & Race Finished:** Sound cues signaling the conclusion of a heat (`audio.heat_over`) or the entire race (`audio.race_over`).
- **Auto-Advance Seconds Left:** Countdown announcements for remaining time before automatically advancing to the next heat (`audio.auto_advance`).
- **Infraction Alerts:** Tones for minimum lap time violations (`audio.min_lap_time`).

Each audio slot can be configured as a preset sound effect, a custom uploaded audio asset, or a Text-to-Speech (TTS) phrase. For full details on audio ducking, priority tiers, and multi-display relevance, see the [Audio System](audio.md) documentation.

## Driver Audio Overrides

Themes can override individual driver audio settings across all participants when the theme is active. By default, each driver's customized sounds (configured in the [Driver Editor](driver-editor.md)) are played during their race events. However, a theme can selectively override any of the 13 driver audio events:

- **Personal Lap Sounds:** Lap Completed (`lapAudio`), Personal Best Lap (`bestLapAudio`).
- **Race Lap Sounds:** Race Best Lap (`raceBestLapAudio`), Race Lane Best Lap (`raceLaneBestLapAudio`), Heat Best Lap (`heatBestLapAudio`), New Race Leader (`newRaceLeaderAudio`), New Heat Leader (`newHeatLeaderAudio`).
- **Overall Best Lap Sounds:** Overall Best Lap (`overallBestLapAudio`), Overall Lane Best Lap (`overallLaneBestLapAudio`).
- **Event Sounds:** Pit In (`pitInAudio`), Fuel Level (`fuelAudio`), False Start / Penalty (`penaltyAudio`), Drift Lap (`driftLapAudio`).

### Override Hierarchy & Configuration
- **Disabled (Default):** The theme leaves the slot untouched, playing the driver's individual configuration (or the system default if unconfigured).
- **Enabled Override:** The theme takes precedence for that specific sound event across all drivers running under this theme. You can configure it as a **Preset Sound**, an **Uploaded Audio File**, a custom **Text-to-Speech (TTS)** phrase, or **None** (to mute the event theme-wide).
- **Reset All Overrides:** Quickly clears all active overrides on the theme, returning control entirely to each driver's individual settings.

