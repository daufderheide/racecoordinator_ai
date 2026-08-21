# Race Coordinator AI Agent Rules

## SQLite Database Engine
Race Coordinator AI uses embedded SQLite (`sqlite-jdbc`) for all persistent data storage. MongoDB has been completely removed.

## UI Localization
- **Localize all UI text**: Any new text added to the UI must be localized across all supported languages (`en`, `de`, `es`, `fr`, `it`, `nl`, `pt` in `client/src/assets/i18n/`).

## Test Coverage Quality Gates
- **Add unit tests for all changes**: For every change made, add client and/or server unit tests as appropriate to cover the modifications and new functionality.
- **Never lower test coverage thresholds**: The AI agent must never unilaterally reduce code coverage minimum thresholds (e.g. in `server/pom.xml`, `client/karma.conf.js`, or any CI configuration) to make tests pass or resolve coverage gate failures.
- **Add tests instead**: If coverage falls below the configured limits, the agent must write new unit or integration tests to satisfy and exceed the required coverage.
- **Explicit user approval required**: If the coverage values are ever deemed too tight or need reduction, the agent must not reduce them automatically. The decision must be brought to the user for careful review and explicit approval first.

## Code Quality & Length Limits (No Length Suppressions)
- **Do not suppress length limits**: The AI agent must NEVER add length check suppressions in Java (e.g., `@SuppressWarnings("checkstyle:FileLength")`, `@SuppressWarnings("checkstyle:MethodLength")`, `@SuppressWarnings("FileLength")`, `@SuppressWarnings("MethodLength")`) or TypeScript/JavaScript (e.g., `/* eslint-disable max-lines */`, `/* eslint-disable max-lines-per-function */`).
- **Refactor instead**: When a file, class, method, or function exceeds length limits or triggers length linter warnings, the agent must refactor the code by decomposing large methods into helper functions, extracting classes/services/components, or splitting responsibilities into smaller modules.

## Visual & Screendiff Testing (Docker Only)
- **Do not run screendiff suite by default**: Unless new screendiff tests are added or explicitly requested by the user, do not run the screendiff test suite. They take too long and require a developer to review the images before accepting new baselines. Instead, include a reminder in the manual verification / testing steps to run the screendiff tests.
- **Run screendiffs inside Docker**: All Playwright visual / screendiff test runs and snapshot generations must be executed inside the Linux Docker container via `./run_client_screendiff_tests.sh` (or `run_client_screendiff_tests.ps1`).
- **No host snapshots**: Never generate or commit host macOS/Windows visual snapshots (`*-darwin.png`, `*-win32.png`). All snapshot baselines must remain consistent with the Linux Docker environment used in CI.
- **Image validation only (no functional `expect` statements)**: Do not use `expect()` statements in screendiff tests unless strictly needed for test setup (e.g. ensuring an element is attached before triggering an action). Visual validation must rely solely on screenshot comparison (`expect(...).toHaveScreenshot(...)`), while behavioral and DOM value assertions belong in Angular unit tests.
- **Single screenshot assertion per test**: Each screendiff `test(...)` must contain only one `toHaveScreenshot()` assertion. If multiple visual states or components need to be verified, split them into distinct, independent `test(...)` cases so that `./run_client_screendiff_tests.sh` evaluates all image comparisons in a single execution rather than aborting subsequent checks when an earlier screenshot in the same test differs.
- **UI Component Screendiff Commit Gate**: Commits modifying client UI components (`*.component.{ts,html,scss,css}`, global styles, index.html) must include updated screendiff snapshots or visual tests. For strict refactors with no visual change, bypass using `refactor:` commit prefix, `[skip-screendiff]` in commit message, or `SKIP_SCREENDIFF_CHECK=1`.

## Protobuf Synchronization
- **Regenerate bindings on proto changes**: Whenever modifying `.proto` files in `proto/`, always run `./generate_protos.sh` (or `npm run proto`) to ensure both Java server models and Angular TypeScript bindings are regenerated and in sync before creating tests or committing code.

## Cross-Platform Compatibility & Paths
- **No hardcoded path separators**: Never hardcode `/` or `\\` path separators in Java server code or cross-platform scripts. Always use `Paths.get()`, `Path.of()`, or `File.separator`.
- **Support all target platforms**: Code must remain fully compatible across Windows, macOS, and Linux (x86_64 and arm64).

## Git Branching & Release Pipeline Discipline
- **Develop is the default base**: Standard feature and bugfix work branches from `develop` and merges into `develop`.
- **Main is the stable trunk**: `main` contains stable, production-ready code and documentation. Pushes/merges to `main` do NOT trigger release builds, allowing docs, READMEs, and maintenance to land cleanly without accidental releases or `[skip ci]`.
- **Official releases are tag-driven**: Pushing an official Git tag (`vX.Y.Z`) or manually dispatching a release on `main` publishes an official release (`vX.Y.Z` derived from the tag or `VERSION` file).
- **Release branches are for beta prereleases**: Pushes to `release/vX.Y.Z` automatically publish an incremented beta prerelease (`vX.Y.Z-beta.N`). Manual release dispatch on `release/*` branches is blocked.
- **Daily schedule builds**: Automatically publish daily alpha builds from `develop` named `vX.Y.Z-alpha.YYYYMMDD` (where `X.Y.Z` comes from the `VERSION` file).
- **Manual releases from develop**: Manual workflow dispatch on `develop` without an explicit version override publishes an alpha build named `vX.Y.Z-alpha.<hash>` (using the commit SHA).

## Meaningful Test Assertions & Mutation Resistance
- **Test real behavior, not just line coverage**: New unit and integration tests must validate outputs, state changes, and boundary conditions with explicit assertions rather than writing trivial executions that only aim to pass line coverage counters. Tests must withstand mutation testing (PIT / Stryker).

## Flake-Free Async Testing
- **Avoid arbitrary sleep timers**: In visual and unit tests, avoid arbitrary wall-clock timers (`page.waitForTimeout(ms)`, `Thread.sleep(ms)`) where deterministic alternatives exist (e.g., `waitFor({ state: 'visible' })`, `TestSetupHelper.waitForLocalization()`, or explicit event/condition polling).
