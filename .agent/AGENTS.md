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
- **Strict single screenshot assertion per test**: Each screendiff `test(...)` MUST contain exactly ONE `toHaveScreenshot()` assertion. NEVER include multiple `toHaveScreenshot()` calls within a single `test(...)` block. When a screenshot fails, Playwright immediately aborts that test, preventing subsequent screenshots in the same test from running and requiring multiple full test suite runs and `--sync-only` cycles to update each image one-by-one. Extract navigation and setup into shared helper functions and create dedicated, isolated `test(...)` cases for every visual state, tab, hover effect, or modal.
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
- **Automated downstream sync to develop**: Pushes to `release/vX.Y.Z` automatically merge into `develop` on release completion, ensuring `develop` always contains all fixes.
- **Daily schedule builds**: Automatically publish daily alpha builds from `develop` named `vX.Y.Z-alpha.YYYYMMDD` (where `X.Y.Z` comes from the `VERSION` file). Daily builds pre-check active release branches to guarantee `develop` is synced before publishing.
- **Manual releases from develop**: Manual workflow dispatch on `develop` without an explicit version override publishes an alpha build named `vX.Y.Z-alpha.<hash>` (using the commit SHA).
- **README Updates Restricted to Beta & Official Releases**: Automated README download link updates and PRs targeting `main` are strictly restricted to official stable releases (`vX.Y.Z`) and beta prereleases (`vX.Y.Z-beta.N`). Daily alpha and manual develop builds (`*-alpha.*`) must never update the main README or open documentation PRs.

## Meaningful Test Assertions & Mutation Resistance
- **Test real behavior, not just line coverage**: New unit and integration tests must validate outputs, state changes, and boundary conditions with explicit assertions rather than writing trivial executions that only aim to pass line coverage counters. Tests must withstand mutation testing (PIT / Stryker).

## Flake-Free Async Testing
- **Avoid arbitrary sleep timers**: In visual and unit tests, avoid arbitrary wall-clock timers (`page.waitForTimeout(ms)`, `Thread.sleep(ms)`) where deterministic alternatives exist (e.g., `waitFor({ state: 'visible' })`, `TestSetupHelper.waitForLocalization()`, or explicit event/condition polling).

## Conventional Commit Message Discipline
- **Use supported conventional commit prefixes**: All git commit messages must use supported conventional prefixes (`feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`, `chore:`, `ci:`, `style:`, `build:`), optional scopes (e.g. `feat(phidget): ...`), and concise descriptions to ensure automated release changelog generation remains accurate and clean.

## Server-Side Calculations & Single Source of Truth
- **All calculations performed on the server**: All calculations with very few if any exceptions should be done on the server. The client should get calculations from the server and display them.
- **Calculations scope**: Calculations include overall/heat standings, average lap times, median lap times, gaps, probabilities, etc.
- **Server as single source of truth**: The server is the authoritative source of truth and the client is strictly a display layer.

## Production Code Hygiene (No Test or Leftover Debug Code)
- **No test code in production files**: Test hooks, test-specific methods, test fixtures, or test branches must never be added to production code files. All testing logic belongs strictly in dedicated test files (`*.spec.ts`, `*Test.java`, test harnesses, or testing helper directories).
- **Remove temporary debug code**: Temporary debug code (e.g., temporary `console.log` / `System.out.println`, debug flags, or ad-hoc bypasses) may only be added during active debugging and must be completely removed before the task is finished.

## Guided Tour & Help Synchronization
- **Keep guided help in sync**: Whenever modifying, adding, or removing UI controls, form fields, tabs, or sections on editor pages or any view with guided help (`getHelpSteps()` in `*-editor.component.ts` or similar):
  - Add or update the corresponding guided help step (`GuideStep`) with its DOM selector (`#...`), localized title, content, and `onEnter` accordion/tab expansion hook.
  - Define all new guided help translation keys across all 7 supported languages (`en`, `de`, `es`, `fr`, `it`, `nl`, `pt` in `client/src/assets/i18n/`).
  - Update client unit tests (`*.spec.ts`) asserting `getHelpSteps()` order, step count, selectors, and `onEnter` execution.

## End-to-End Object Configuration & Field Lifecycle Checklist
Whenever a new configuration setting, property, or field is added, modified, or moved on domain entities (e.g. `Race`, `Track`, `Theme`, `CustomUI`, `Driver`, `Heat`, `FuelOptions`, `SeasonScoring`), changes MUST be completed and validated across ALL layers of the end-to-end stack:

1. **Java Server Domain Model & Builders (`server/src/main/java/com/antigravity/models/`)**:
   - Add field, getters/setters, and Jackson annotations (`@JsonProperty("snake_case") @JsonAlias("camelCase")`).
   - Add `with<Field>(...)` builder method and sensible default in `Builder`.
   - **CRITICAL - Copy Constructor / `Builder.from(other)`**: Always update `Builder.from(Other other)` to copy the new field. Omitting this causes silent regressions where updates/saves reset the property to its default.
   - Update `DatabaseInitializer` and `AssetDefaultsInitializer` for default/factory entities or backfill migrations.

2. **Java Server Task Handlers & Repositories (`server/src/main/java/com/antigravity/handlers/`)**:
   - Ensure `create<Entity>()` and `handleUpdate<Entity>()` explicitly populate the field when constructing the new instance.
   - Verify SQLite repository (`SqliteRepository<Entity>`) insert/replace operations persist the field.

3. **Protobuf Schema & Code Generation (`server/proto/`)**:
   - Add the field tag and type to the corresponding `.proto` message (e.g. `RaceModel`, `TrackModel`).
   - Immediately execute `./server/generate_protos.sh` (or `npm run proto`) to regenerate both Java classes and TypeScript bindings.

4. **Protobuf & DTO Converters (`server/.../converters/` & `client/.../converters/`)**:
   - Java Server `*Converter.java`: Update `toProto()` and `fromProto()` to serialize and deserialize the field.
   - Angular Client `*.converter.ts`: Update `fromProto()` and `toProto()` to map between protobuf DTOs and TypeScript models (including constructor parameter ordering).

5. **Client Models & Editor Components (`client/src/app/models/`, `client/src/app/components/*-editor/`)**:
   - Update TypeScript model class constructors, interfaces, and default instances.
   - Ensure editor components include the field in `buildPayload()`, dirty state comparison (`isDirtyState()`), undo/redo tracking (`captureState()`), and `originalEntity` deep copies.

6. **Guided Help & Interactive Tours (`client/src/app/components/*-editor/`)**:
   - Add or update the guided help step (`getHelpSteps()`) for the new field with appropriate DOM selector (`#...`), localized title, content, and `onEnter` accordion expansion hook.

7. **UI Localization Across All 7 Languages (`client/src/assets/i18n/*.json`)**:
   - Every label, tooltip, error message, guided help title/content, and select dropdown placeholder (e.g. `-- Select Option --`) MUST be defined in all 7 translation files (`en`, `de`, `es`, `fr`, `it`, `nl`, `pt`). Never leave hardcoded English strings in templates.

8. **Mandatory Multi-Layer Automated Tests**:
   - **Server Unit Tests**:
     - `*ConverterTest.java`: Verify protobuf `toProto()` and `fromProto()` preserve the field with custom values.
     - `*TaskHandlerTest.java`: Test complete CRUD lifecycle (Create with custom value -> verify in SQLite repository -> Update -> verify field persists and is not reset to default).
     - Model tests verifying `Builder.from(other)` preserves the field.
   - **Client Unit Tests**:
     - `*.converter.spec.ts`: Test `fromProto()` maps the new field into the client model.
     - `*-editor.component.spec.ts`: Test UI selection updates dirty tracking, `update<Entity>` sends the field in the payload, and `getHelpSteps()` asserts the new step selector/order.

