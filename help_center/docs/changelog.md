# Changelog

## [v1.0.0-beta.36] - 2026-08-27

### 🚀 New Features

- **leds**: implement heat leader analog LED support and pin synchronization for lane reordering/deletion https://github.com/daufderheide/racecoordinator_ai/issues/675 [skip-screendiff] ([93250758](https://github.com/daufderheide/racecoordinator_ai/commit/93250758))
- **custom_ui**: add master power toggle actions and support for result displays in UI editor https://github.com/daufderheide/racecoordinator_ai/issues/676 [skip-screendiff] ([8f82e11a](https://github.com/daufderheide/racecoordinator_ai/commit/8f82e11a))

### 🐛 Bug Fixes

- **season**: Reduced the size of the season summary so it's not so spread out fix(racedaysetup): Placed the race and season summary side by side to save vertical space https://github.com/daufderheide/racecoordinator_ai/issues/665 https://github.com/daufderheide/racecoordinator_ai/issues/666 ([8d8ff044](https://github.com/daufderheide/racecoordinator_ai/commit/8d8ff044))
- **raceday**: centralize version management by introducing a dedicated version module and updating services to consume it.  This fixes an issue with the raceday help->about showing the wrong version for the client https://github.com/daufderheide/racecoordinator_ai/issues/662 [skip-screendiff] ([6f16fd93](https://github.com/daufderheide/racecoordinator_ai/commit/6f16fd93))
- **race**: set default minimum lap time to 1.5 seconds across server and client models https://github.com/daufderheide/racecoordinator_ai/issues/674 [skip-screendiff] ([37f676ef](https://github.com/daufderheide/racecoordinator_ai/commit/37f676ef))
- **season**: enable independent race expansion and improve deduplication logic by using timestamp-based keys for race records https://github.com/daufderheide/racecoordinator_ai/issues/672 [skip-screendiff] ([e930af64](https://github.com/daufderheide/racecoordinator_ai/commit/e930af64))
- **tts**: implement case-insensitive TTS variable interpolation with curly brace support and add multilingual documentation https://github.com/daufderheide/racecoordinator_ai/issues/671 ([e7e61b1b](https://github.com/daufderheide/racecoordinator_ai/commit/e7e61b1b))
- center scrollable result containers horizontally during print operations https://github.com/daufderheide/racecoordinator_ai/issues/668 [skip-screendiff] ([b4bdc7f8](https://github.com/daufderheide/racecoordinator_ai/commit/b4bdc7f8))
- force change detection on PDF export and apply fixed-scale CSS for print layouts [skip-screendiff] ([e0a7b2d9](https://github.com/daufderheide/racecoordinator_ai/commit/e0a7b2d9))
- **ui**: Fixed pulldown styling when running on Windows. https://github.com/daufderheide/racecoordinator_ai/issues/670 ([542accd5](https://github.com/daufderheide/racecoordinator_ai/commit/542accd5))

### ⚡ Improvements & Refactoring

- split multi-screenshot tests into isolated test cases per screen state and update documentation to enforce one assertion per test. ([a726277a](https://github.com/daufderheide/racecoordinator_ai/commit/a726277a))
- remove unused DecimalPipe imports from season and raceday components ([2eb8d758](https://github.com/daufderheide/racecoordinator_ai/commit/2eb8d758))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.35...v1.0.0-beta.36">GitHub</a></p>
</details>

## [v1.0.0-beta.35] - 2026-08-26

### 🚀 New Features

- implement inline renaming functionality for saved races and add corresponding UI/UX support ([706c7f20](https://github.com/daufderheide/racecoordinator_ai/commit/706c7f20))

### 🐛 Bug Fixes

- **race**: Add end of heat and end of race drift lap support. ([7c9c7fc9](https://github.com/daufderheide/racecoordinator_ai/commit/7c9c7fc9))
- **season**: add season standings API endpoint and implement season-summary component with utility helpers.  Using this new data update the summary on the race day setup page so it's a bit larger and more readable ([1c84ee11](https://github.com/daufderheide/racecoordinator_ai/commit/1c84ee11))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.34...v1.0.0-beta.35">GitHub</a></p>
</details>

## [v1.0.0-beta.34] - 2026-08-26

### 🚀 New Features

- implement PitManager to handle lane pit state transitions and periodic refueling telemetry.  This allows pit data to come in across interfaces ([4e893aae](https://github.com/daufderheide/racecoordinator_ai/commit/4e893aae))
- add quit menu option with platform-specific keyboard shortcuts.  This is mostly for when you run in full screen mode, users now have a way to exit the app without leaving fullscreen. https://github.com/daufderheide/racecoordinator_ai/issues/651 [skip-screendiff] ([f29f9467](https://github.com/daufderheide/racecoordinator_ai/commit/f29f9467))

### 🐛 Bug Fixes

- **raceday**: allow modification of unstarted heats by removing start status restrictions in handler methods and UI components https://github.com/daufderheide/racecoordinator_ai/issues/655 ([f571f15e](https://github.com/daufderheide/racecoordinator_ai/commit/f571f15e))
- **charity**: update PayPal donation link and refresh associated component test snapshots https://github.com/daufderheide/racecoordinator_ai/issues/656 ([a2828371](https://github.com/daufderheide/racecoordinator_ai/commit/a2828371))
- **phidget**: implement Phidget Manager attachment tracking and ensure consistent connection status reporting in client and server https://github.com/daufderheide/racecoordinator_ai/issues/652 [skip-screendiff] ([ba72aefd](https://github.com/daufderheide/racecoordinator_ai/commit/ba72aefd))
- **phidget**: display disconnected devices in Phidget editor and improve capability detection based on assigned pins https://github.com/daufderheide/racecoordinator_ai/issues/653 [skip-screendiff] ([1a4d2300](https://github.com/daufderheide/racecoordinator_ai/commit/1a4d2300))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.33...v1.0.0-beta.34">GitHub</a></p>
</details>

## [v1.0.0-beta.33] - 2026-08-25

### 🚀 New Features

- **ui**: comprehensive modern UI rework for all config screens ([19fe4508](https://github.com/daufderheide/racecoordinator_ai/commit/19fe4508))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.32...v1.0.0-beta.33">GitHub</a></p>
</details>

## [v1.0.0-beta.32] - 2026-08-25

### 🚀 New Features

- Added lap pin pit behavior to the phidget interface fix: Ensured pit in/out is set at the default for all lap pin pit behavior selectors ([4088e0c8](https://github.com/daufderheide/racecoordinator_ai/commit/4088e0c8))
- Updated racedirector track power options to handle master on/off to control all per lane relays when no master relay is present ([54b3ae6c](https://github.com/daufderheide/racecoordinator_ai/commit/54b3ae6c))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.31...v1.0.0-beta.32">GitHub</a></p>
</details>

## [v1.0.0-beta.31] - 2026-08-24

### 🚀 New Features

- Fixed relay support in general.  Specifically getting phidget to work.  Fixed auto-start/warmup time with phidget interfaces if it wasn't broken in general [skip-screendiff] ([c328fed5](https://github.com/daufderheide/racecoordinator_ai/commit/c328fed5))
- adjust laneNumber column width to 170px for horizontal practice layouts and remove forced padding from lane-view UI. https://github.com/daufderheide/racecoordinator_ai/issues/646 ([0593eda2](https://github.com/daufderheide/racecoordinator_ai/commit/0593eda2))

### 🐛 Bug Fixes

- expand lap time column detection and apply consistent vertical sizing to best lap and record times https://github.com/daufderheide/racecoordinator_ai/issues/647 ([cb434a9c](https://github.com/daufderheide/racecoordinator_ai/commit/cb434a9c))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.30...v1.0.0-beta.31">GitHub</a></p>
</details>

## [v1.0.0-beta.30] - 2026-08-23

### 🚀 New Features

- remove BART (BLE) interface configuration and associated tests.  This will be put back once we can properly test it. [skip-screendiff] ([bd525faf](https://github.com/daufderheide/racecoordinator_ai/commit/bd525faf))
- Added column width configuration to the lane view widget ([3c557836](https://github.com/daufderheide/racecoordinator_ai/commit/3c557836))

### 🐛 Bug Fixes

- update commit history link format to use anchor tags in release notes [skip ci] ([034d5db5](https://github.com/daufderheide/racecoordinator_ai/commit/034d5db5))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.29...v1.0.0-beta.30">GitHub</a></p>
</details>

## [v1.0.0-beta.29] - 2026-08-23

### 🚀 New Features

- Added navigation buttons when the browser is fullscreen and doesn't have them on its own feat: Added option to put a non-uniform scale on all pages so they fit to the size of the display https://github.com/daufderheide/racecoordinator_ai/issues/639 ([812301be](https://github.com/daufderheide/racecoordinator_ai/commit/812301be))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

View full commit comparison on [GitHub](https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.28...v1.0.0-beta.29)
</details>

## [v1.0.0-beta.28] - 2026-08-23

### 🚀 New Features

- add groups_enabled, has_season, and is_event tracking to race start analytics [skip ci] ([1341461b](https://github.com/daufderheide/racecoordinator_ai/commit/1341461b))

### 🐛 Bug Fixes

- fix relay polarity inversion logic and consolidate Phidget output state logic ([df39f202](https://github.com/daufderheide/racecoordinator_ai/commit/df39f202))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

View full commit comparison on [GitHub](https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.27...v1.0.0-beta.28)
</details>

All notable changes to Race Coordinator AI are documented in this file.

## [v1.0.0-beta.27] - 2026-08-22

### 🚀 New Features

- add support for configurable track scale and decimal lane lengths. Added ft indicator on lane length selector ([ac8e8f4b](https://github.com/daufderheide/racecoordinator_ai/commit/ac8e8f4b))

### 🐛 Bug Fixes

- **server**: add int overloaded Lane constructors for backward compatibility [skip-screendiff] ([5c572cca](https://github.com/daufderheide/racecoordinator_ai/commit/5c572cca))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

View full commit comparison on [GitHub](https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.26...v1.0.0-beta.27)
</details>

