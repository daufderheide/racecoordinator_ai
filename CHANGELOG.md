# Changelog

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

