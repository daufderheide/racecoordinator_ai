# Changelog

## [v1.0.1-beta.4] - 2026-09-30

### 🚀 New Features

- Auto hide the countdown widget when a different widget is selected. https://github.com/daufderheide/racecoordinator_ai/issues/869 [skip-screendiffs] ([29801310](https://github.com/daufderheide/racecoordinator_ai/commit/29801310))
- Added 'show summary for future heats' option for the heat list widget.  This allows all heats to be shown with the same size and column data https://github.com/daufderheide/racecoordinator_ai/issues/869 [skip-screendiffs] ([5f63db0f](https://github.com/daufderheide/racecoordinator_ai/commit/5f63db0f))

### 🐛 Bug Fixes

- Attempt to make the heat, race and driver results pages more readable by making the foreground data standout over the background more https://github.com/daufderheide/racecoordinator_ai/issues/870 ([a3336144](https://github.com/daufderheide/racecoordinator_ai/commit/a3336144))
- Extended editor object selector (drriver, race, track, etc) to the bottom of the page or as far as needed to minimize scrolling when large numuber of items have been created https://github.com/daufderheide/racecoordinator_ai/issues/865 [skip-screendiffs] ([7d362757](https://github.com/daufderheide/racecoordinator_ai/commit/7d362757))
- Trying to fix client side start lamp synchronization but pre-loading start lamp images, and adding caching to the get request. https://github.com/daufderheide/racecoordinator_ai/issues/871 [skip-screendiffs] ([46ed328d](https://github.com/daufderheide/racecoordinator_ai/commit/46ed328d))
- Updated default countdown images to be pixel correct.  This prevents them from slightly shifting positions on screen which is particularly noticeable when the blur effects are disabled: https://github.com/daufderheide/racecoordinator_ai/issues/866 [skip-screendiffs] ([64615c3c](https://github.com/daufderheide/racecoordinator_ai/commit/64615c3c))
- localize leaderboard widget title with RD_WIN_LEADER_BOARD key ([dbf82f16](https://github.com/daufderheide/racecoordinator_ai/commit/dbf82f16))
- Unify tooltip icons, including making all delet operations a red trash can to signify a dangerous operation. ([67774bb2](https://github.com/daufderheide/racecoordinator_ai/commit/67774bb2))
- Changed default countdown lamps so they do not overlap fix: Auto-enable countdown preview if the countdown widget is selected. https://github.com/daufderheide/racecoordinator_ai/issues/859 ([021b6061](https://github.com/daufderheide/racecoordinator_ai/commit/021b6061))
- Fixed driver editor audio expander and track editor lane expander.  They both required multiple clicks to open/close properly [skip-screendiffs] ([cfded194](https://github.com/daufderheide/racecoordinator_ai/commit/cfded194))
- Removed duplicate delete widget button in the widget inspector ([4a06b3fd](https://github.com/daufderheide/racecoordinator_ai/commit/4a06b3fd))

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0...v1.0.1-beta.4">GitHub</a></p>
</details>

## [v1.0.0] - 2026-09-27

### 🎉 Initial Release

Initial release.

View the full commit history on [GitHub](https://github.com/daufderheide/racecoordinator_ai/commits/v1.0.0).
