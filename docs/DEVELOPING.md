# Developing Race Coordinator AI

This is the developer guide. If you're just here to run the application, see
the top-level [README](../README.md) instead.

The codebase is split into:

- `client/` — Angular UI
- `server/` — Java + Javalin backend with MongoDB
- `scripts/` — dev/test/release wrappers ([details](#repo-layout))
- `scripts/installer/` — Inno Setup + the build-installer driver scripts
- `help_center/` — MkDocs Material help site (deployed to GitHub Pages)
- `docs/` — internal docs (this file and friends — see [See also](#see-also))

## Table of contents

- [Running the app](#running-the-app)
- [Stopping the app](#stopping-the-app)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)
- [Linting](#linting)
- [Debugging](#debugging)
- [Help Center](#help-center)
- [Packaging & Distribution](#packaging--distribution)
- [System requirements for installers](#system-requirements-for-installers)
- [Repo layout](#repo-layout)
- [See also](#see-also)

## Running the app

### Linux / Mac

The `scripts/run_server_headless.sh` script handles dependency downloading
(including `protoc`) automatically. The `scripts/run_client.sh` script handles
`npm install` automatically if `node_modules` is missing.

- Check permissions: `chmod +x scripts/run_server_headless.sh scripts/run_client.sh`
- Run Server: `./scripts/run_server_headless.sh`
- Run Client: `./scripts/run_client.sh` (will take a moment to install dependencies first time)

**Note:** The script incrementally compiles. If you need a clean build (e.g.,
weird compilation errors), run `cd server && mvn clean` manually, then run
`./scripts/run_server_headless.sh` again.

### Windows

The `scripts/run_server_headless.ps1` script handles dependency downloading
(including `protoc`) automatically. The `scripts/run_client.ps1` script handles
`npm install` automatically if `node_modules` is missing.

- Run Server: `.\scripts\run_server_headless.ps1`
- Run Client: `.\scripts\run_client.ps1`

**Note:** If you get a script execution error, run
`Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` in your terminal
first.

### Manual launch

If you'd rather skip the wrappers:

```bash
# 1. Server (Java) — port 7070
cd server
mvn compile exec:java -Dexec.mainClass="com.antigravity.App"

# 2. Client (Angular) — port 4200
cd client
npm start
```

Once both are running, open [http://localhost:4200](http://localhost:4200).

## Stopping the app

### 1. Terminal (Ctrl+C)

If you started the processes in a terminal window, press `Ctrl+C` to terminate.

### 2. Antigravity commands

If you're using the Antigravity extension, terminate the terminal tasks where
the processes are running.

### 3. Kill scripts (fallback)

When processes are detached or stuck:

- **Both client and server:**
  - Linux/Mac: `./scripts/kill_client_server.sh`
  - Windows: `.\scripts\kill_client_server.ps1`
- **Server only (port 7070):**
  ```bash
  lsof -ti :7070 | xargs kill
  ```
- **Client only (port 4200):**
  ```bash
  lsof -ti :4200 | xargs kill
  ```

## Troubleshooting

If the server fails to start with "Address already in use", you likely have a
zombie MongoDB process:

- Linux/Mac: `./scripts/kill_zombie_mongo.sh`
- Windows: `.\scripts\kill_zombie_mongo.ps1`

## Testing

This project includes unit tests for the backend and frontend, plus an
opt-in visual regression suite for the client.

### What runs where

| Suite | `npm test` | pre-push | CI | Manual command |
| --- | --- | --- | --- | --- |
| Client unit (Karma/Jasmine) | ✅ | ✅ | ✅ | `npm run test:client` |
| Server (JUnit + embedded Mongo) | ✅ | ✅ | ✅ | `npm run test:server` |
| Client visual (Playwright screen-diff) | ❌ | ❌ | ❌ | `npm run test:visual` |

Visual tests are intentionally not part of `npm test`, pre-push, or CI
because their baselines are large binary PNGs that we don't track in git
(see [REPO_CLEANUP.md §1](REPO_CLEANUP.md)). A fresh checkout has no
expected images to compare against, so a hard-pass/fail gate would just
go red on every PR. Run them locally before merging UI-affecting changes.

### Run all tests (unit + visual + server)

```bash
./scripts/run_all_tests.sh    # bash: client unit + visual + server
npm run test:all              # equivalent npm chain
```

To skip visual: `npm test` (the default chain).

### Client (Angular)

#### Unit tests

Jasmine/Karma tests:

- Linux/Mac: `./scripts/run_client_unit_tests.sh`
- Windows: `.\scripts\run_client_unit_tests.ps1`

The script automatically installs and uses a local Playwright Chromium so tests
behave the same regardless of your system browser.

#### Visual regression tests (screen-diff)

Playwright-based snapshot tests — **opt-in**, see [What runs where](#what-runs-where):

- Linux/Mac: `./scripts/run_client_screendiff_tests.sh`
- Windows: `.\scripts\run_client_screendiff_tests.ps1`

> **Snapshot files are gitignored.** The expected `*-snapshots/` PNG/JPEG
> baselines under `client/src/app/components/**/` are intentionally not tracked
> in git — see [REPO_CLEANUP.md §1](REPO_CLEANUP.md) for the rationale.
> The first run will report every assertion as a missing baseline; use
> `--update-snapshots` (below) to generate the local baselines, then compare
> against them on subsequent runs.

#### Accepting visual changes (updating snapshots)

When you've intentionally modified the UI:

1. **Re-run and update** — full rerun, overwrites expected images with new
   results:
   - Linux/Mac: `./scripts/run_client_screendiff_tests.sh --update-snapshots`
   - Windows: `.\scripts\run_client_screendiff_tests.ps1 --update-snapshots`
2. **Sync from last run** — promote "actual" (failed) images from the previous
   run without rerunning. Much faster:
   - Linux/Mac: `./scripts/run_client_screendiff_tests.sh --sync-only`
   - Windows: `.\scripts\run_client_screendiff_tests.ps1 --sync-only`

### Server (Java)

JUnit:

- Linux/Mac: `./scripts/run_server_tests.sh`
- Windows: `.\scripts\run_server_tests.ps1`

## Linting

This project enforces code quality and style standards for both the client
(TypeScript/HTML) and server (Java).

### What is checked?

- **Client:** TypeScript and HTML linting (ESLint), code formatting (Prettier).
  A custom rule forbids fully qualified Protobuf message names
  (e.g., `antigravity.Message`) in favor of direct imports.
- **Server:** Java code style (Spotless/Google Style), static analysis
  (Checkstyle), bug detection (PMD).
- **Automation:** linting and formatting run on staged files at commit time via
  `husky` + `lint-staged`.

### How to validate

From the project root:

- Both: `npm run lint`
- Client only: `npm run lint:client`
- Server only: `npm run lint:server`

### How to fix

Many issues fix themselves:

- **Client:** `npm run lint:client` auto-fixes most TypeScript/HTML issues.
- **Server:** `cd server && mvn spotless:apply` auto-formats Java.

> [!TIP]
> `npm run lint` attempts to fix the client automatically while checking the
> server.

### i18n validation

Translation files under `client/src/assets/i18n/` are kept in sync and sorted:

```bash
node scripts/check_i18n.js          # check
node scripts/check_i18n.js --fix    # auto-sort
```

## Debugging

### Server (Java)

To debug the server, enable the Java Debug Wire Protocol (JDWP) when starting:

1. **Start in debug mode:**
   ```bash
   MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005" ./scripts/run_server_headless.sh
   ```
   `suspend=n` starts the server immediately. Switch to `suspend=y` if you want
   it to wait for a debugger to attach first.

2. **Set breakpoints** in VS Code (gutter click on Java files like `App.java`).

3. **Attach the debugger:**
   - Install the **Debugger for Java** extension.
   - Open the **Run and Debug** view (`Cmd+Shift+D`).
   - Create or use a `launch.json` "Attach" config pointing at port `5005`.

### Client (Angular)

The Angular client generates source maps in dev mode, so you debug the original
TypeScript, not the compiled JavaScript.

1. **Browser DevTools (Chrome/Edge):**
   - Open the app, press `F12` (or `Cmd+Option+I`).
   - **Sources** tab → `Cmd+P` / `Ctrl+P` → type the component filename
     (e.g., `home.component.ts`).
   - Click line numbers to set breakpoints.

2. **VS Code:** install the **Debugger for Chrome** (or Edge) extension and
   launch or attach to the browser directly.

## Help Center

The project includes a built-in help center powered by
[MkDocs Material](https://squidfunk.github.io/mkdocs-material/). Help articles
live in `help_center/docs/` as Markdown and auto-deploy to GitHub Pages on
every push to `main`.

### Viewing

- **Online:** [https://daufderheide.github.io/racecoordinator_ai/](https://daufderheide.github.io/racecoordinator_ai/)
- **Offline (bundled):** `http://localhost:7070/help/` (served by the Javalin server)
- **On GitHub:** browse the Markdown source at [help_center/docs/](../help_center/docs/)

### Local preview setup (optional)

**MkDocs is not required to build or run the application.** You only need it if
you want to preview help-center changes locally.

```bash
pip install mkdocs-material mkdocs-static-i18n
mkdocs serve --config-file help_center/mkdocs.yml   # http://127.0.0.1:8000
```

To build the static site without serving:

```bash
mkdocs build --config-file help_center/mkdocs.yml
# Output goes to help_center/site/ (git-ignored)
```

### Adding or editing articles

1. Edit or create Markdown in `help_center/docs/`.
2. If you're adding a new article, register it in the `nav` section of
   `help_center/mkdocs.yml`.
3. Push to `main` — `.github/workflows/docs.yml` rebuilds and deploys.

Article filenames are lowercase with hyphens (e.g., `race-editor.md`,
`track-manager.md`). Each article maps to one application screen.

### Localization

The help center supports seven languages that match the application: English
(default), Spanish, French, German, Dutch, Portuguese, Italian.

Translations use a **suffix-based** naming convention:

| Language | Filename example |
| --- | --- |
| English (default) | `race-editor.md` |
| Spanish | `race-editor.es.md` |
| French | `race-editor.fr.md` |
| German | `race-editor.de.md` |
| Dutch | `race-editor.nl.md` |
| Portuguese | `race-editor.pt.md` |
| Italian | `race-editor.it.md` |

If a translated page doesn't exist, the site falls back to English. The
language switcher in the site header lets users change languages.

### Adding "Learn More" links inside the app

`HelpLinkService` opens help articles from within the Angular application. It
selects the online or offline URL based on connectivity and applies the user's
language setting.

```typescript
// 1. Inject the service
constructor(public helpLink: HelpLinkService) {}

// 2. Use in template
<a (click)="helpLink.openHelp('race-editor')">Learn More</a>

// With a section anchor:
<a (click)="helpLink.openHelp('race-editor', 'heat-rotation-format')">Learn More</a>
```

### Offline bundling (for releases)

When creating installers, build the help site into the server's web directory
so it's available without internet:

```bash
mkdocs build --config-file help_center/mkdocs.yml --site-dir server/web/help
```

The Javalin server serves everything under `web/` as static files, so the
offline help center becomes available at `http://localhost:7070/help/`.

## Packaging & Distribution

You can create installable packages for macOS and Windows from `scripts/installer/`.

### Create all installers

From the repo root:

- Linux/Mac: `./scripts/installer/create_installers.sh`
- Windows: `.\scripts\installer\create_installers.ps1`

The script will:

- Build the production Angular client.
- Package the Java server into a fat JAR.
- Download the necessary JREs for offline Windows installers.
- Generate platform-specific launch scripts.
- Create compressed distribution packages in the `release/` directory.

### Generated artifacts

After running the script, check `release/` for:

- **`RaceCoordinator_Universal.zip`** — standard distribution for Mac/Linux/Windows. Requires Java pre-installed.
- **`RaceCoordinator_Windows_Offline.zip`** — Windows-specific distribution with bundled JREs (Java 8 for XP/7/8, Java 17 for 10/11). No internet required.
- **`RaceCoordinator_Mac.dmg`** — macOS Disk Image. Only generated when the script runs on a Mac.

### Windows Installer (`.exe`)

For a professional Windows installation experience, build a standalone `.exe`
using **Inno Setup**.

#### Prerequisites

1. Install [Inno Setup 6](https://jrsoftware.org/isdl.php) (stable).
2. Make sure `iscc` is in your `PATH` (optional, but recommended for
   command-line builds).

#### Building

1. First, run the standard build script to prepare all artifacts:
   ```bash
   ./scripts/installer/create_installers.sh
   ```
2. If `iscc` is in your `PATH`, the script will attempt to build the `.exe`
   automatically. Otherwise build it manually from the repo root:
   ```bash
   iscc scripts/installer/installer_online.iss
   iscc scripts/installer/installer_offline_legacy.iss
   ```

#### Output location

The generated `.exe` is written to `scripts/installer/Output/` (Inno Setup's
default location, next to the `.iss` file). Built filenames:

- `RaceCoordinatorAI_Online_Setup.exe`
- `RaceCoordinatorAI_Offline_Legacy_Setup.exe`

These installers will:

- Install the application to `C:\Program Files\Race Coordinator AI`.
- Set up writable data (database, assets) in `C:\ProgramData\Race Coordinator AI`.
- Create desktop shortcuts for the **Headless Server** and the **Web Client**.
- Bundle a compatible Java Runtime (Java 8 for legacy Windows, Java 17 for
  modern Windows) so the user doesn't need to install Java manually.

## System requirements for installers

- **macOS:** 10.15 (Catalina) or newer recommended.
- **Windows:** Windows XP SP3 or newer. 32-bit and 64-bit supported.
  - Windows 7/8/XP requires the
    [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784)
    for MongoDB 3.2 to run.
- **Linux / Raspberry Pi:** any modern distribution with Java 8 or newer.

## Repo layout

| Path | Purpose |
| --- | --- |
| `client/` | Angular UI |
| `server/` | Java/Javalin backend, MongoDB integration, race logic |
| `help_center/` | MkDocs help site source ([Help Center](#help-center)) |
| `scripts/` | All run/test/kill/release helpers (`run_*.sh`/`.ps1`, `kill_*.sh`/`.ps1`, `release.sh`, `check_i18n.js`, `test_env.sh`, `sync_snapshots.js`, `install_dependencies_mac.sh`) |
| `scripts/installer/` | `create_installers.{sh,ps1}` + the three `installer_*.iss` Inno Setup files |
| `docs/` | Internal feature/architecture docs (this file, [Analytics](ANALYTICS.md), [Custom UI](CUSTOM_UI.md), [TTS](TTS.md), [Repo Cleanup](REPO_CLEANUP.md)) |
| `docs/images/` | Screenshots used by README/docs |
| `.github/workflows/` | CI (`ci.yml`) and help-center deploy (`docs.yml`) |

## See also

- [README](../README.md) — user-facing overview, install instructions, screenshots
- [Analytics](ANALYTICS.md) — GA4 instrumentation and event taxonomy
- [Custom UI](CUSTOM_UI.md) — customizable race-screen layout system
- [TTS](TTS.md) — text-to-speech configuration
- [Repo Cleanup](REPO_CLEANUP.md) — record of the 2026-05-30 reorganization
  (script moves, snapshot un-tracking, doc moves)
