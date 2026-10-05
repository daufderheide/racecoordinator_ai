# Changelog

## [v1.0.1-beta.15] - 2026-10-05

### 🚀 New Features

- add Arduino and Phidget editor "active low analog led" config options. [#911](https://github.com/daufderheide/racecoordinator_ai/issues/911) ([0c993d0a](https://github.com/daufderheide/racecoordinator_ai/commit/0c993d0a))
- Added more port diagnosis when RC AI cannot be started because port 7070 is busy/not available.  This will be useful for users to help troubleshoot what's going on. ([f258adde](https://github.com/daufderheide/racecoordinator_ai/commit/f258adde))
- for the heat-view widget, changed 'use lane background colors' to use lane colors' and disabled summary row text color controls when lane colors are enabled.  Coloring is now completely controlled by the track lane data or the text color set in the widget. [#897](https://github.com/daufderheide/racecoordinator_ai/issues/897) [skip-screendiffs] ([7df44d18](https://github.com/daufderheide/racecoordinator_ai/commit/7df44d18))
- Auto hide the countdown widget when a different widget is selected. [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) [skip-screendiffs] ([29801310](https://github.com/daufderheide/racecoordinator_ai/commit/29801310))
- Added 'show summary for future heats' option for the heat list widget.  This allows all heats to be shown with the same size and column data [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) [skip-screendiffs] ([5f63db0f](https://github.com/daufderheide/racecoordinator_ai/commit/5f63db0f))

### 🐛 Bug Fixes

- **heat-list**: Updated the Heat Columns 'Auto (Responsive)' option including the default heat list widget configuration to fit names and columns better into the layout. [#916](https://github.com/daufderheide/racecoordinator_ai/issues/916) ([94af8398](https://github.com/daufderheide/racecoordinator_ai/commit/94af8398))
- select next driver after adding or removing via keyboard navigation on raceday setup [#912](https://github.com/daufderheide/racecoordinator_ai/issues/912) ([3395e6f7](https://github.com/daufderheide/racecoordinator_ai/commit/3395e6f7))
- Set the theme name as the title of the new page when opened from the raceday window menu [#915](https://github.com/daufderheide/racecoordinator_ai/issues/915) [skip-screendiffs] ([5726a587](https://github.com/daufderheide/racecoordinator_ai/commit/5726a587))
- Fixed xls export so that the race info on the sammary tab output the correct track data.  Also adjusted the column widths automatically based on size and left justified all cell values. [#914](https://github.com/daufderheide/racecoordinator_ai/issues/914) [skip-screendiffs] ([dc61c127](https://github.com/daufderheide/racecoordinator_ai/commit/dc61c127))
- Fixed false start penalty handling to properly adjust lap counts and handle subsequent reaction times. [#910](https://github.com/daufderheide/racecoordinator_ai/issues/910) [skip-screendiffs] ([fad4474e](https://github.com/daufderheide/racecoordinator_ai/commit/fad4474e))
- **raceday**: stabilize auto-start/advance timers, track calls, and countdown audio [skip-screendiff] [#881](https://github.com/daufderheide/racecoordinator_ai/issues/881) ([aba288c1](https://github.com/daufderheide/racecoordinator_ai/commit/aba288c1))
- Changed lane-view column 'Lap Count' to "Lap Count (Raw)" for a bit more clarity [#893](https://github.com/daufderheide/racecoordinator_ai/issues/893) [skip-screendiffs] ([a71408b6](https://github.com/daufderheide/racecoordinator_ai/commit/a71408b6))
- Update the xls export template per user request [#898](https://github.com/daufderheide/racecoordinator_ai/issues/898) ([a7cbd71a](https://github.com/daufderheide/racecoordinator_ai/commit/a7cbd71a))
- Changed how countdown blur works as on some gpus it doesn't work right.  This should also be a performance optimization, although it doesn't look as good, but it's good enough: [#899](https://github.com/daufderheide/racecoordinator_ai/issues/899) ([995cb29c](https://github.com/daufderheide/racecoordinator_ai/commit/995cb29c))
- prompt with confirmation dialog when leaving ended race [#900](https://github.com/daufderheide/racecoordinator_ai/issues/900) [skip-screendiffs] ([cc5a30cf](https://github.com/daufderheide/racecoordinator_ai/commit/cc5a30cf))
- reset race ended and connection state when restarting race session [#900](https://github.com/daufderheide/racecoordinator_ai/issues/900) [skip-screendiffs] ([7174420b](https://github.com/daufderheide/racecoordinator_ai/commit/7174420b))
- Fixed Starting state timer to use a proper timer rather than a constant 'tick' timer. ([fc6037f8](https://github.com/daufderheide/racecoordinator_ai/commit/fc6037f8))
- prevent redirect to raceday-setup when acknowledging save modals after race ends [#878](https://github.com/daufderheide/racecoordinator_ai/issues/878) [skip-screendiffs] ([6a4ae651](https://github.com/daufderheide/racecoordinator_ai/commit/6a4ae651))
- **installer**: exclude redundant portable setup scripts from windows installer.  This should fix issues with having to skip files during the install [#876](https://github.com/daufderheide/racecoordinator_ai/issues/876) ([cf26c841](https://github.com/daufderheide/racecoordinator_ai/commit/cf26c841))
- Updated scrollbar so that its always visible when needed.  This should prevent user confusion as to what can be scrolled and what cannot [#890](https://github.com/daufderheide/racecoordinator_ai/issues/890) [skip-screendiffs] ([c998ad1d](https://github.com/daufderheide/racecoordinator_ai/commit/c998ad1d))
- **heat-list**: Fixed group titles for heat list component. [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) [#874](https://github.com/daufderheide/racecoordinator_ai/issues/874) [skip-screendiffs] ([36f61826](https://github.com/daufderheide/racecoordinator_ai/commit/36f61826))
- **raceday**: ensure driver station/view display back/forward nav buttons and theme windows show no hardcoded navigation.  Also ensure heat, race, season, predictions results, etc windows show a close button when in full screen mode. [#885](https://github.com/daufderheide/racecoordinator_ai/issues/885) ([5382813a](https://github.com/daufderheide/racecoordinator_ai/commit/5382813a))
- Attempt to make the heat, race and driver results pages more readable by making the foreground data standout over the background more [#870](https://github.com/daufderheide/racecoordinator_ai/issues/870) ([a3336144](https://github.com/daufderheide/racecoordinator_ai/commit/a3336144))
- Extended editor object selector (drriver, race, track, etc) to the bottom of the page or as far as needed to minimize scrolling when large numuber of items have been created [#865](https://github.com/daufderheide/racecoordinator_ai/issues/865) [skip-screendiffs] ([7d362757](https://github.com/daufderheide/racecoordinator_ai/commit/7d362757))
- Trying to fix client side start lamp synchronization but pre-loading start lamp images, and adding caching to the get request. [#871](https://github.com/daufderheide/racecoordinator_ai/issues/871) [skip-screendiffs] ([46ed328d](https://github.com/daufderheide/racecoordinator_ai/commit/46ed328d))
- Updated default countdown images to be pixel correct.  This prevents them from slightly shifting positions on screen which is particularly noticeable when the blur effects are disabled: [#866](https://github.com/daufderheide/racecoordinator_ai/issues/866) [skip-screendiffs] ([64615c3c](https://github.com/daufderheide/racecoordinator_ai/commit/64615c3c))
- localize leaderboard widget title with RD_WIN_LEADER_BOARD key ([dbf82f16](https://github.com/daufderheide/racecoordinator_ai/commit/dbf82f16))
- Unify tooltip icons, including making all delet operations a red trash can to signify a dangerous operation. ([67774bb2](https://github.com/daufderheide/racecoordinator_ai/commit/67774bb2))
- Changed default countdown lamps so they do not overlap fix: Auto-enable countdown preview if the countdown widget is selected. [#859](https://github.com/daufderheide/racecoordinator_ai/issues/859) ([021b6061](https://github.com/daufderheide/racecoordinator_ai/commit/021b6061))
- Fixed driver editor audio expander and track editor lane expander.  They both required multiple clicks to open/close properly [skip-screendiffs] ([cfded194](https://github.com/daufderheide/racecoordinator_ai/commit/cfded194))
- Removed duplicate delete widget button in the widget inspector ([4a06b3fd](https://github.com/daufderheide/racecoordinator_ai/commit/4a06b3fd))

### ⚡ Improvements & Refactoring

- optimize startup backfills, ticker delay calculations, and audio abort handling [skip-screendiff] ([90fed865](https://github.com/daufderheide/racecoordinator_ai/commit/90fed865))
- standardize hardware and demo protocol schedulers to named daemon threads [skip-screendiffs] ([68e59442](https://github.com/daufderheide/racecoordinator_ai/commit/68e59442))
- deduplicate pre-race prediction simulations and make lane QR codes lazy [skip-screendiffs] ([f38eb9cb](https://github.com/daufderheide/racecoordinator_ai/commit/f38eb9cb))
- eliminate scheduler self-deadlock, optimize standings indexing and memoize timer options [skip-screendiffs] ([a3dab0f0](https://github.com/daufderheide/racecoordinator_ai/commit/a3dab0f0))
- offload lap predictions to daemon worker and remove redundant ngZone.run() [skip-screendiffs] ([9bf7d372](https://github.com/daufderheide/racecoordinator_ai/commit/9bf7d372))
- eliminate hot-path SQLite DDL, ticker lock contention [skip-screendiffs] ([f1e7c96b](https://github.com/daufderheide/racecoordinator_ai/commit/f1e7c96b))
- Warm / Reuse StartingTicker:  To eliminate the ~150 ms initial tick jitter on older CPUs when starting/aborting, we can avoid creating and tearing down a brand-new ScheduledExecutorService on every abort/start, or move non-critical database deletions (deletePredictionEvaluationRecord) off the critical ticker startup path. ([803548dc](https://github.com/daufderheide/racecoordinator_ai/commit/803548dc))
- **timer**: async websocket broadcast queue, racetime coalescing, and telemetry batching [#880](https://github.com/daufderheide/racecoordinator_ai/issues/880) [skip-screendiff] ([541dfcee](https://github.com/daufderheide/racecoordinator_ai/commit/541dfcee))
- **timer**: eliminate ticker drift, async auto-save, and countdown audio cascade [skip-screendiffs] ([127e9e0e](https://github.com/daufderheide/racecoordinator_ai/commit/127e9e0e))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0...v1.0.1-beta.15">GitHub</a></p>
</details>

## [v1.0.0] - 2026-09-27

### 🎉 Initial Release

Initial release.

View the full commit history on [GitHub](https://github.com/daufderheide/racecoordinator_ai/commits/v1.0.0).
