# Changelog

## [v1.0.0-beta.56] - 2026-09-05

### 🚀 New Features

- **racedaysetup**: added acknowledgetment dialog when checking for updates and none are avaialable https://github.com/daufderheide/racecoordinator_ai/issues/745 ([75038480](https://github.com/daufderheide/racecoordinator_ai/commit/75038480))
- **custom_ui**: extract UI editor logic into helpers, add clearing functionality, and expand help documentation with tests ([62e82d7a](https://github.com/daufderheide/racecoordinator_ai/commit/62e82d7a))

### 🐛 Bug Fixes

- **ui**: standardize file export across the various elements that can be exported.  They can now all have their name changed and output directory assigned.  They also all use the standard windows save as dialog https://github.com/daufderheide/racecoordinator_ai/issues/734 [skip-screendiffs] ([54d2217f](https://github.com/daufderheide/racecoordinator_ai/commit/54d2217f))
- fixed race results page race state flag and timer.  It now shares code with the widgets they're based off of. https://github.com/daufderheide/racecoordinator_ai/issues/753 https://github.com/daufderheide/racecoordinator_ai/issues/752 [skip-screendiffs] ([55aadb4e](https://github.com/daufderheide/racecoordinator_ai/commit/55aadb4e))
- **race**: Fixed custom round robins to work properly when there are fewer drivers than number of lanes on the track https://github.com/daufderheide/racecoordinator_ai/issues/746 ([74f727dc](https://github.com/daufderheide/racecoordinator_ai/commit/74f727dc))
- **race**: add persistence for overall highest score records and lane-specific tracking during a race. https://github.com/daufderheide/racecoordinator_ai/issues/755 ([225e08d3](https://github.com/daufderheide/racecoordinator_ai/commit/225e08d3))
- **racedaysetup**: add quit blocked notification modal and corresponding unit tests https://github.com/daufderheide/racecoordinator_ai/issues/755 [skip-screendiffs] ([1216acbb](https://github.com/daufderheide/racecoordinator_ai/commit/1216acbb))
- **xls**: fixed support for custom export templates and initialize UI editor component tests https://github.com/daufderheide/racecoordinator_ai/issues/748 [skip-screendiffs] ([8b1f6515](https://github.com/daufderheide/racecoordinator_ai/commit/8b1f6515))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.55...v1.0.0-beta.56">GitHub</a></p>
</details>

## [v1.0.0-beta.55] - 2026-09-04

### 🚀 New Features

- **race**: Added a way to disallow lap times for best laps/records https://github.com/daufderheide/racecoordinator_ai/issues/673 ([7daa80d0](https://github.com/daufderheide/racecoordinator_ai/commit/7daa80d0))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.54...v1.0.0-beta.55">GitHub</a></p>
</details>

## [v1.0.0-beta.54] - 2026-09-04

### 🚀 New Features

- track and display heat number for fastest lap records across session and lanes https://github.com/daufderheide/racecoordinator_ai/issues/706 [skip-screendiffs] ([2b2898aa](https://github.com/daufderheide/racecoordinator_ai/commit/2b2898aa))
- implement categorized widget toolbox with search, localize action labels, and add toolbox helper functionality ([b2360874](https://github.com/daufderheide/racecoordinator_ai/commit/b2360874))
- add support for separators in CustomSelect and include Current Display option in UI editor aspect ratio settings fix: moved current display aspect ratio to the top of the selector [skip-screendiffs] ([cdd58c9a](https://github.com/daufderheide/racecoordinator_ai/commit/cdd58c9a))

### 🐛 Bug Fixes

- fixed screendiff tests that are failing the ci build ([58f730a2](https://github.com/daufderheide/racecoordinator_ai/commit/58f730a2))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.53...v1.0.0-beta.54">GitHub</a></p>
</details>

## [v1.0.0-beta.53] - 2026-09-03

### 🚀 New Features

- implement RacedayHeatList component and inspector for dynamic race heat tracking https://github.com/daufderheide/racecoordinator_ai/issues/680 ([b8f5e89d](https://github.com/daufderheide/racecoordinator_ai/commit/b8f5e89d))
- add portrait layout mode for start sequence lamps with responsive styling and regression tests https://github.com/daufderheide/racecoordinator_ai/issues/742 ([cea2920b](https://github.com/daufderheide/racecoordinator_ai/commit/cea2920b))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.52...v1.0.0-beta.53">GitHub</a></p>
</details>

## [v1.0.0-beta.52] - 2026-09-03

### 🚀 New Features

- added aspect ratio and a zoom bar to the custom ui layout editor.  Moved the sort and highlight options into the lane-view widget ([76df497c](https://github.com/daufderheide/racecoordinator_ai/commit/76df497c))
- add visibility toggles for race record data points in the UI editor and update translations https://github.com/daufderheide/racecoordinator_ai/issues/736 ([09591341](https://github.com/daufderheide/racecoordinator_ai/commit/09591341))

### 🐛 Bug Fixes

- **ui**: standardize scrollbar styling across all components with consistent colors and border radii https://github.com/daufderheide/racecoordinator_ai/issues/654 ([f742a419](https://github.com/daufderheide/racecoordinator_ai/commit/f742a419))

### ⚡ Improvements & Refactoring

- remove unused TranslatePipe import and update checkstyle encoding configuration ([7d477bf5](https://github.com/daufderheide/racecoordinator_ai/commit/7d477bf5))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.51...v1.0.0-beta.52">GitHub</a></p>
</details>

## [v1.0.0-beta.51] - 2026-09-02

### 🐛 Bug Fixes

- **ui**: update UI component styles and refresh visual regression test snapshots ([f91dbc4f](https://github.com/daufderheide/racecoordinator_ai/commit/f91dbc4f))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.50...v1.0.0-beta.51">GitHub</a></p>
</details>

## [v1.0.0-beta.50] - 2026-09-02

### 🐛 Bug Fixes

- **ui**: implement custom-select component and replace native select elements in race-editor https://github.com/daufderheide/racecoordinator_ai/issues/670 ([dc7feac8](https://github.com/daufderheide/racecoordinator_ai/commit/dc7feac8))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.49...v1.0.0-beta.50">GitHub</a></p>
</details>

## [v1.0.0-beta.49] - 2026-09-02

### 🐛 Bug Fixes

- remove explicit select option background and color styles to rely on system color-scheme defaults ([79635ed7](https://github.com/daufderheide/racecoordinator_ai/commit/79635ed7))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.48...v1.0.0-beta.49">GitHub</a></p>
</details>

## [v1.0.0-beta.48] - 2026-09-02

### 🚀 New Features

- add zoom functionality to toolbar and custom rotation editor ([6c620e8d](https://github.com/daufderheide/racecoordinator_ai/commit/6c620e8d))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.47...v1.0.0-beta.48">GitHub</a></p>
</details>

## [v1.0.0-beta.47] - 2026-09-02

### 🚀 New Features

- add heat progress, race flag, and time display to race and heat results components https://github.com/daufderheide/racecoordinator_ai/issues/720 ([baab6f12](https://github.com/daufderheide/racecoordinator_ai/commit/baab6f12))

### 🐛 Bug Fixes

- make locator public and readonly in RaceResultsHarnessE2e constructor [skip-screendiffs] ([2d869fc4](https://github.com/daufderheide/racecoordinator_ai/commit/2d869fc4))
- remove optional chaining on theme slots to ensure required asset access ([3bd041b0](https://github.com/daufderheide/racecoordinator_ai/commit/3bd041b0))
- use percentages for compact season summary columns to prevent horizontal scrolling ([7d1ba0e8](https://github.com/daufderheide/racecoordinator_ai/commit/7d1ba0e8))

### ⚡ Improvements & Refactoring

- stabilize screenshot tests by scoping to component locators and removing redundant animation delays ([fefa0d72](https://github.com/daufderheide/racecoordinator_ai/commit/fefa0d72))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.46...v1.0.0-beta.47">GitHub</a></p>
</details>

## [v1.0.0-beta.46] - 2026-09-01

### 🐛 Bug Fixes

- improve null safety for theme slots and update change detection in UI editor. ([920aa445](https://github.com/daufderheide/racecoordinator_ai/commit/920aa445))
- apply custom dark theme colors to select elements.  This is an attempt to fix the white flash most easily seen on Edge browsers when opening pulldown selectors https://github.com/daufderheide/racecoordinator_ai/issues/670 [skip-screendiffs] ([3a6c011c](https://github.com/daufderheide/racecoordinator_ai/commit/3a6c011c))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.45...v1.0.0-beta.46">GitHub</a></p>
</details>

## [v1.0.0-beta.45] - 2026-09-01

### 🚀 New Features

- implement auto-scrolling to theme sections when expanded in ui-editor.  This puts the top of the them at the top of the page so its more easily viewed ([27640954](https://github.com/daufderheide/racecoordinator_ai/commit/27640954))

### 🐛 Bug Fixes

- **server**: use imported types in syncDriverFlags to satisfy checkstyle ([182d6d13](https://github.com/daufderheide/racecoordinator_ai/commit/182d6d13))
- fix driver flag logic. http://localhost:9323/#?testId=feeaac045dd0d9290c71-c9cafc40ee6e2129aa05 [skip-screendiffs] ([c2f376fc](https://github.com/daufderheide/racecoordinator_ai/commit/c2f376fc))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.44...v1.0.0-beta.45">GitHub</a></p>
</details>

## [v1.0.0-beta.44] - 2026-08-31

### 🚀 New Features

- **raceday**: Remove fullscreen navigation button by default.  Add an action button widget the user can place if they want it.  Added file->back menu option to allow back navigation even in full screen mode. https://github.com/daufderheide/racecoordinator_ai/issues/728 ([a70689c0](https://github.com/daufderheide/racecoordinator_ai/commit/a70689c0))
- add search functionality to available and racing participant lists with localized placeholders https://github.com/daufderheide/racecoordinator_ai/issues/729 fix: fixed auto-scrolling when dragging from the rds racing/available lists https://github.com/daufderheide/racecoordinator_ai/issues/727 ([8cfa7abd](https://github.com/daufderheide/racecoordinator_ai/commit/8cfa7abd))

### 🐛 Bug Fixes

- swap styles for confirmation and cancel buttons in confirmation modal https://github.com/daufderheide/racecoordinator_ai/issues/725 ([29afee2a](https://github.com/daufderheide/racecoordinator_ai/commit/29afee2a))
- ensure window closure compatibility by resetting window context before closing ([d568fc13](https://github.com/daufderheide/racecoordinator_ai/commit/d568fc13))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.43...v1.0.0-beta.44">GitHub</a></p>
</details>

## [v1.0.0-beta.43] - 2026-08-31

### 🚀 New Features

- update default UI layout with new metrics, column widths, and widget settings [skip-screendiffs] ([449e2b87](https://github.com/daufderheide/racecoordinator_ai/commit/449e2b87))
- introduce physicalLapCount to track and display raw lap counts independent of adjustments https://github.com/daufderheide/racecoordinator_ai/issues/704 [skip-screendiffs] ([4168a601](https://github.com/daufderheide/racecoordinator_ai/commit/4168a601))
- pass driver count via query parameters to race manager and update global scrollbar styles ([7c8ddc0e](https://github.com/daufderheide/racecoordinator_ai/commit/7c8ddc0e))

### 🐛 Bug Fixes

- prevent negative connection counts and disable race connection teardown during UI editor mode ([c72649f6](https://github.com/daufderheide/racecoordinator_ai/commit/c72649f6))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.42...v1.0.0-beta.43">GitHub</a></p>
</details>

## [v1.0.0-beta.42] - 2026-08-31

### 🐛 Bug Fixes

- limit lap column to 2 decimal places on the detailed leader board and add unit tests test: update some screendiffs that didn't update before ([c1033f94](https://github.com/daufderheide/racecoordinator_ai/commit/c1033f94))
- Fixed next heat and ondeck widget lane badges to scale with the text size test: implement component harnesses and screen diff regression tests across the raceday suite https://github.com/daufderheide/racecoordinator_ai/issues/709 ([b8e918d8](https://github.com/daufderheide/racecoordinator_ai/commit/b8e918d8))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.41...v1.0.0-beta.42">GitHub</a></p>
</details>

## [v1.0.0-beta.41] - 2026-08-31

### 🚀 New Features

- update About Dialog to include new contributors and add harness support for verifying credits list ([dcdb0fce](https://github.com/daufderheide/racecoordinator_ai/commit/dcdb0fce))
- add roster sorting functionality by seed and name in racing-roster-dialog https://github.com/daufderheide/racecoordinator_ai/issues/714 ([e73eb993](https://github.com/daufderheide/racecoordinator_ai/commit/e73eb993))
- add RacingRosterDialog component with unit, screen-diff, and harness tests, and update localization strings https://github.com/daufderheide/racecoordinator_ai/issues/714 ([e3a5c064](https://github.com/daufderheide/racecoordinator_ai/commit/e3a5c064))
- add race start time support to backend proto, Java converter, and client components. ([129a7e6e](https://github.com/daufderheide/racecoordinator_ai/commit/129a7e6e))

### 🐛 Bug Fixes

- modularize CLI argument parsing and add support for skipping installer validation via empty strings ([af27ef82](https://github.com/daufderheide/racecoordinator_ai/commit/af27ef82))
- Changed scaling on raceday and splashscreen to ensure they're always full screen. ([deed2f09](https://github.com/daufderheide/racecoordinator_ai/commit/deed2f09))
- implement explicit driver finished status and track across protocol, server state, and UI. ([3726ad3f](https://github.com/daufderheide/racecoordinator_ai/commit/3726ad3f))
- encapsulate season standings within SeasonSummaryComponent and add dropped points calculation ([7d922961](https://github.com/daufderheide/racecoordinator_ai/commit/7d922961))
- add NoneAutoSegments finish type and update power management logic to support per-lane control during finish states. ([46800e63](https://github.com/daufderheide/racecoordinator_ai/commit/46800e63))
- implement version verification script and add dynamic client version resolution logic to improve release consistency https://github.com/daufderheide/racecoordinator_ai/issues/705 [skip-screendiff] ([feb3686a](https://github.com/daufderheide/racecoordinator_ai/commit/feb3686a))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.40...v1.0.0-beta.41">GitHub</a></p>
</details>

## [v1.0.0-beta.40] - 2026-08-30

### 🚀 New Features

- **ui**: implement multi-layout theme architecture, custom widget framework, and dynamic widget inspector ([e684f424](https://github.com/daufderheide/racecoordinator_ai/commit/e684f424))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.39...v1.0.0-beta.40">GitHub</a></p>
</details>

## [v1.0.0-beta.39] - 2026-08-28

### 🐛 Bug Fixes

- improve connection resilience, enhance interface status logging, and refine race start error handling https://github.com/daufderheide/racecoordinator_ai/issues/661 [skip-screendiff] ([350508a3](https://github.com/daufderheide/racecoordinator_ai/commit/350508a3))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.38...v1.0.0-beta.39">GitHub</a></p>
</details>

## [v1.0.0-beta.38] - 2026-08-28

### 🚀 New Features

- **raceday**: automatically skip heats containing no active drivers when entering NotStarted state https://github.com/daufderheide/racecoordinator_ai/issues/677 ([a401e191](https://github.com/daufderheide/racecoordinator_ai/commit/a401e191))

### 🐛 Bug Fixes

- **race**: add support for none audio type and remove redundant lap broadcast in racing state. ([04198ebf](https://github.com/daufderheide/racecoordinator_ai/commit/04198ebf))
- **raceday**: standardize empty lane handling for pacing and record lap components and utilities [skip-screendiff] ([94a7e67b](https://github.com/daufderheide/racecoordinator_ai/commit/94a7e67b))
- **custom_ui**: rename driver state label to flag and apply css styles to column width inputs https://github.com/daufderheide/racecoordinator_ai/issues/687 https://github.com/daufderheide/racecoordinator_ai/issues/686 [skip-screendiff] ([3bebb97d](https://github.com/daufderheide/racecoordinator_ai/commit/3bebb97d))
- **custom_ui**: add driver view QR column back in and consolidate column definitions with integrity tests https://github.com/daufderheide/racecoordinator_ai/issues/688 [skip-screendiff] ([e6645563](https://github.com/daufderheide/racecoordinator_ai/commit/e6645563))
- **heat_results**: implement localized empty state message for heat results component https://github.com/daufderheide/racecoordinator_ai/issues/684 ([3ac67054](https://github.com/daufderheide/racecoordinator_ai/commit/3ac67054))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.37...v1.0.0-beta.38">GitHub</a></p>
</details>

## [v1.0.0-beta.37] - 2026-08-27

### 🚀 New Features

- **raceday**: implement stacked layout for ghost pacing component and add utility for solo center pacing detection [skip-screendiff] ([c36e9bad](https://github.com/daufderheide/racecoordinator_ai/commit/c36e9bad))
- **season**: add dropped points tracking to season standings and update UI component layout https://github.com/daufderheide/racecoordinator_ai/issues/685 [skip-screendiff] ([6b191e6b](https://github.com/daufderheide/racecoordinator_ai/commit/6b191e6b))

### 🐛 Bug Fixes

- **race_results**: update graph color binding to use line.color and adjust lane color initialization https://github.com/daufderheide/racecoordinator_ai/issues/691 ([32a94c0a](https://github.com/daufderheide/racecoordinator_ai/commit/32a94c0a))
- **raceday**: update record lap component layout to stack details vertically and add corresponding test assertions https://github.com/daufderheide/racecoordinator_ai/issues/694 [skip-screendiff] ([bba358ba](https://github.com/daufderheide/racecoordinator_ai/commit/bba358ba))
- **heat_results**: update heat results to use stacked twin graphs with conditional rendering and updated specs https://github.com/daufderheide/racecoordinator_ai/issues/692 ([f7faa334](https://github.com/daufderheide/racecoordinator_ai/commit/f7faa334))
- **season**: adjust season summary column widths and add test coverage for large numeric values ([b333b715](https://github.com/daufderheide/racecoordinator_ai/commit/b333b715))
- **heat_results**: implement driver ranking logic and synchronize standings updates across heat components and services https://github.com/daufderheide/racecoordinator_ai/issues/689 [skip-screendiff] ([4e011b01](https://github.com/daufderheide/racecoordinator_ai/commit/4e011b01))
- **raceday_setup**: rearrange race summary card into 2-column layout and update unit tests accordingly https://github.com/daufderheide/racecoordinator_ai/issues/683 [skip-screendiff] ([c21e0be7](https://github.com/daufderheide/racecoordinator_ai/commit/c21e0be7))
- increase compact season summary rank column width to accommodate 3-digit positions and add verification test https://github.com/daufderheide/racecoordinator_ai/issues/682 [no-screendiff] ([5b899f1b](https://github.com/daufderheide/racecoordinator_ai/commit/5b899f1b))
- centralize child window management into a new service to persist windows during navigation to the UI editor https://github.com/daufderheide/racecoordinator_ai/issues/690 [skip-screendiff] ([8e6ba3ee](https://github.com/daufderheide/racecoordinator_ai/commit/8e6ba3ee))
- **ci**: resolve remote git refs properly in sync_release_branch ([a866ff1d](https://github.com/daufderheide/racecoordinator_ai/commit/a866ff1d))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.36...v1.0.0-beta.37">GitHub</a></p>
</details>

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

