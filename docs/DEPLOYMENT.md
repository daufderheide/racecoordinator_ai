# Deploying Race Coordinator AI

This is the **full, end-to-end deployment guide** — how to turn a commit on
`main` into installable artifacts in users' hands and a published help site.

If you only want to *run* the app locally, see the
[README](../README.md). If you want to *develop* it, see the
[Developer Guide](DEVELOPING.md). This document is the release engineer's
reference; it consolidates and expands the
[Packaging & Distribution](DEVELOPING.md#packaging--distribution) and
[Help Center](DEVELOPING.md#help-center) sections of the developer guide.

## Table of contents

- [What "deployment" means here](#what-deployment-means-here)
- [Runtime architecture](#runtime-architecture)
- [Toolchain prerequisites](#toolchain-prerequisites)
- [Pre-release checklist](#pre-release-checklist)
- [1. Build the distributable artifacts](#1-build-the-distributable-artifacts)
- [2. Build the Windows installers (.exe)](#2-build-the-windows-installers-exe)
- [3. Build the macOS disk image (.dmg)](#3-build-the-macos-disk-image-dmg)
- [4. Publish a GitHub Release](#4-publish-a-github-release)
- [5. Deploy the Help Center](#5-deploy-the-help-center)
- [End-user installation](#end-user-installation)
- [CI/CD overview](#cicd-overview)
- [Troubleshooting deployments](#troubleshooting-deployments)
- [See also](#see-also)

## What "deployment" means here

Race Coordinator AI is a **locally installed desktop application**, not a
hosted web service. "Deploying" therefore covers two independent surfaces:

| Surface | What ships | How it ships | Automated? |
| --- | --- | --- | --- |
| **Application** | Java fat-JAR + Angular web UI + bundled JRE/MongoDB, wrapped as installers/zips | Built locally, uploaded to **GitHub Releases** | ❌ Manual |
| **Help Center** | MkDocs Material static site | **GitHub Pages** via `.github/workflows/docs.yml` | ✅ On push to `main` |

The application build is deliberately manual: it downloads platform-specific
JREs and MongoDB binaries and (for Windows) drives Inno Setup, so it is run by
a release engineer on a workstation rather than in CI.

## Runtime architecture

Understanding what gets installed makes the packaging steps below make sense.

- **Server** — a single fat JAR (`RaceCoordinator.jar`) running an embedded
  [Javalin](https://javalin.io/) HTTP server on **port 7070**
  (`server/src/main/java/com/antigravity/App.java`). It serves both the REST
  API and the compiled Angular client from its `web/` directory, so end users
  only ever open `http://localhost:7070`.
- **Client** — the Angular app, built to static files and served *by* the JAR.
  There is no separately deployed front end in production (the dev-time
  `localhost:4200` Angular dev server is for development only).
- **Database** — MongoDB on **port 27017**. Installers bundle a MongoDB build;
  on Linux/RPi the user supplies it (`apt-get install mongodb-server`).
- **Data directory** — writable state (database files, assets, logs) lives
  under `app.data.dir`. It defaults to `<install>/app_data`; the Windows
  installer overrides it to `C:\ProgramData\Race Coordinator AI` via
  `-Dapp.data.dir=...` so the install directory under `Program Files` stays
  read-only.
- **Headless mode** — passing `--headless` starts the server without trying to
  auto-open a browser (used by the "Headless Server" desktop shortcut and for
  running on machines that drive the UI from another device).
- **Analytics** — GA4 events require
  `server/src/main/resources/analytics.properties` (keys
  `ga.measurement.id` and `ga.api.secret`). See [Analytics](ANALYTICS.md).

## Toolchain prerequisites

Install these on the build machine before cutting a release:

| Tool | Version | Used for |
| --- | --- | --- |
| **JDK** | 17 (modern build) + JDK 8 capability via the `legacy` Maven profile | Compiling the server fat JAR |
| **Maven** | 3.x | Server build (`mvn package`) |
| **Node.js** | 20.x | Building the Angular client (`npm run build`) |
| **protoc** | matching `generate_protos.sh` | Generating protobuf sources |
| **curl + unzip** | any | Downloading/extracting bundled JRE & MongoDB |
| **Inno Setup 6** | stable, `iscc` on `PATH` | Windows `.exe` installers (Windows only) |
| **macOS + hdiutil** | — | Building the `.dmg` (Mac only) |
| **Python 3 + pip** | 3.x | Help Center preview/build (optional; CI does this) |

> The release script downloads JREs (Adoptium Temurin) and MongoDB binaries
> over the network into `build_cache/`, so the build machine needs outbound
> internet on the first run. Subsequent runs reuse `build_cache/`.

## Pre-release checklist

Do this before building, on a clean checkout of the commit you intend to ship:

1. **Be on the release commit** — typically the tip of `main` after CI is
   green. `git status` should be clean.
2. **Bump the version** — edit `MyAppVersion` in
   `scripts/installer/installer_base.iss`. This is the version stamped into the
   Windows installers and Add/Remove Programs.
3. **Provide analytics credentials** — create
   `server/src/main/resources/analytics.properties` from the secure vault.
   `create_installers.sh` **aborts** if this file is missing.
4. **Run the full test suite** — `npm run test:all` (client unit + visual +
   server). At minimum `npm test`.
5. **Run lint** — `npm run lint`.
6. **Build/preview the Help Center** if help content changed (see
   [step 5](#5-deploy-the-help-center)).

## 1. Build the distributable artifacts

From the repo root:

```bash
# Linux/Mac
./scripts/installer/create_installers.sh

# Windows (PowerShell)
.\scripts\installer\create_installers.ps1
```

This single script does everything except build the Windows `.exe`:

1. Verifies `analytics.properties` exists (hard fail otherwise).
2. Builds the production Angular client (`client/ → npm install && npm run build`).
3. Builds the server fat JAR **twice**:
   - **Modern** (Java 11/17 target) → `RaceCoordinator/`
   - **Legacy** (`-Plegacy`, Java 8 target) → `RaceCoordinator_Offline/`
   Protobufs are regenerated (`generate_protos.sh`) before each build.
4. Assembles the `release/` tree, copying in the JAR, the compiled web client,
   and the Arduino resources.
5. Downloads and bundles platform runtimes into `build_cache/` then `release/`:
   - JRE 8 (x86) for XP/7/8, JRE 17 (x64) for Win 10/11, MongoDB 3.2 (32-bit).
6. Generates per-platform launch/setup scripts (`start_win.bat`,
   `start_mac.command`, `start_linux_rpi.sh`, `setup_windows.bat`,
   `install_dependencies.ps1`, `README.txt`) into each distribution folder.
7. On macOS, also builds `RaceCoordinator_Mac.dmg` (see [step 3](#3-build-the-macos-disk-image-dmg)).

### Resulting `release/` layout

```
release/
├── RaceCoordinator/            # Standard dist (bundles JRE 8/17 + MongoDB 3.2)
│   ├── RaceCoordinator.jar
│   ├── web/                    # compiled Angular client
│   ├── arduino/
│   ├── jre8/  jre17/  mongodb32/
│   └── start_*.{bat,command,sh}, setup_windows.bat, install_dependencies.ps1
├── RaceCoordinator_Offline/    # Legacy/offline dist (Java 8 JAR + bundled JRE zips)
│   └── ... (bundled_jre8.zip, bundled_jre17.zip)
└── RaceCoordinator_Mac.dmg     # only when built on macOS
```

To zip the universal/offline folders for upload:

```bash
cd release
zip -r RaceCoordinator_Universal.zip RaceCoordinator
zip -r RaceCoordinator_Windows_Offline.zip RaceCoordinator_Offline
```

### Faster JAR-only rebuild

If you only need the server JAR (no client rebuild, no bundled runtimes —
e.g. for a quick smoke test), use the lightweight wrapper:

```bash
./scripts/release.sh   # mvn clean package -DskipTests → release/.../RaceCoordinator.jar
```

This does **not** produce a shippable end-user package. Use
`create_installers.sh` for actual releases.

## 2. Build the Windows installers (.exe)

Run on Windows after [step 1](#1-build-the-distributable-artifacts) has
populated `release/`.

**Prerequisites:** [Inno Setup 6](https://jrsoftware.org/isdl.php) with `iscc`
on your `PATH`.

If `iscc` is on `PATH`, `create_installers.ps1` builds the `.exe`s
automatically. Otherwise, from the repo root:

```bash
iscc scripts/installer/installer_online.iss
iscc scripts/installer/installer_offline_legacy.iss
```

Output is written to `Output/` (rebased to the repo root by `SourceDir`/
`OutputDir` in `installer_base.iss`):

- **`RaceCoordinatorAI_Online_Setup.exe`** — downloads Java 17 + MongoDB 6.0
  during install if not already present (needs internet). Preferred.
- **`RaceCoordinatorAI_Offline_Legacy_Setup.exe`** — bundles Java 8 +
  MongoDB 3.2 for offline/legacy machines (XP/7/8).

Both installers:

- Install the app to `C:\Program Files\Race Coordinator AI`.
- Create the writable data dir `C:\ProgramData\Race Coordinator AI`.
- Create desktop + Start Menu shortcuts for the **Headless Server** and the
  **Web Client** (which just opens `http://localhost:7070`).
- Kill any running `java`/`mongod` holding ports 7070/27017 before installing.

> Legacy Windows (7/8/XP) also needs the
> [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784)
> for MongoDB 3.2 to start.

## 3. Build the macOS disk image (.dmg)

`create_installers.sh` automatically builds `release/RaceCoordinator_Mac.dmg`
when run on macOS (`hdiutil create ... -format UDZO`). The DMG contains the
JAR, the web client, `start_mac.command`, and `install_dependencies_mac.sh`,
which downloads Java 17 + MongoDB 6.0 (arch-aware: arm64 vs x64) on first
launch if Java isn't present.

There is no separate command — just run the build script on a Mac.

## 4. Publish a GitHub Release

Releases are published manually to the
[Releases page](https://github.com/daufderheide/racecoordinator_ai/releases).

1. Create a git tag for the version (match `installer_base.iss`), e.g.:
   ```bash
   git tag -a v0.0.0.21 -m "Race Coordinator AI 0.0.0.21"
   git push origin v0.0.0.21
   ```
2. Draft a new GitHub Release against that tag with release notes.
3. Upload the artifacts:
   - `RaceCoordinatorAI_Online_Setup.exe`
   - `RaceCoordinatorAI_Offline_Legacy_Setup.exe`
   - `RaceCoordinator_Universal.zip`
   - `RaceCoordinator_Windows_Offline.zip`
   - `RaceCoordinator_Mac.dmg`
4. Publish. The README's Install section links users straight to the latest
   release assets, so the asset filenames above must stay stable.

> **Tip:** the GitHub MCP tools / `gh` can attach assets, but the artifacts
> themselves must be built locally first (CI does not build them).

## 5. Deploy the Help Center

The help site **deploys itself**. `.github/workflows/docs.yml` runs on any
push to `main` that touches `help_center/**`: it `pip install`s
`mkdocs-material mkdocs-static-i18n`, runs
`mkdocs build --config-file help_center/mkdocs.yml`, and publishes the result
to **GitHub Pages** at
[daufderheide.github.io/racecoordinator_ai](https://daufderheide.github.io/racecoordinator_ai/).

To deploy help changes: edit Markdown under `help_center/docs/`, register new
pages in the `nav` of `help_center/mkdocs.yml`, and merge to `main`.

Preview locally before merging (optional — not required to build the app):

```bash
pip install mkdocs-material mkdocs-static-i18n
mkdocs serve --config-file help_center/mkdocs.yml   # http://127.0.0.1:8000
```

### Offline help bundling

To ship help inside an app release (served at `http://localhost:7070/help/`),
build the site into the server's web dir **before** running the installer
build:

```bash
mkdocs build --config-file help_center/mkdocs.yml --site-dir server/web/help
```

See [DEVELOPING.md → Help Center](DEVELOPING.md#help-center) for the
localization (suffix-based, 7 languages) and "Learn More" link details.

## End-user installation

What users do with the artifacts (mirrors the [README](../README.md)):

- **Windows** — run `RaceCoordinatorAI_Online_Setup.exe` (or the offline/legacy
  `.exe`), then use the desktop shortcuts.
- **macOS** — open `RaceCoordinator_Mac.dmg`, drag to Applications, launch
  `start_mac.command` (offers to download Java/MongoDB on first run).
- **Linux / Raspberry Pi** — extract `RaceCoordinator_Universal.zip`, then
  `chmod +x start_linux_rpi.sh && ./start_linux_rpi.sh` (needs Java 8+;
  `sudo apt-get install openjdk-8-jre` on RPi).

All paths converge on the same running app at `http://localhost:7070`.

## CI/CD overview

| Workflow | Trigger | Does |
| --- | --- | --- |
| `.github/workflows/ci.yml` | push/PR to `main`/`master` | Lint, client unit tests (Karma/Chrome), server tests (JUnit + embedded Mongo). **Does not build release artifacts.** |
| `.github/workflows/docs.yml` | push to `main` touching `help_center/**` | Build + deploy Help Center to GitHub Pages. |

CI gates correctness; it does **not** produce installers. The visual
regression suite is intentionally excluded from CI (baselines aren't tracked
in git — see [REPO_CLEANUP.md](REPO_CLEANUP.md)); run it locally before
shipping UI changes.

## Troubleshooting deployments

| Symptom | Cause / fix |
| --- | --- |
| `create_installers.sh` aborts immediately | `analytics.properties` missing — restore it from the vault. |
| JRE/MongoDB downloads fail | No outbound internet, or Adoptium/MongoDB URL changed. Pre-seed `build_cache/{java8,java17,mongodb32}.zip` manually. |
| `iscc` not found | Inno Setup not installed or not on `PATH`; build `.exe`s manually (see step 2). |
| Server won't start: "Address already in use" | Zombie MongoDB. Run `./scripts/kill_zombie_mongo.sh` (`.ps1` on Windows). Ensure 7070 + 27017 are free. |
| Weird Maven compile errors mid-build | Run `cd server && mvn clean` then rebuild. |
| Help site didn't update | The `docs.yml` workflow only runs on pushes that touch `help_center/**`; confirm the path and that Pages is enabled. |
| Windows install: MongoDB won't start on Win 7/XP | Install the [VC++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784). |

## See also

- [README](../README.md) — user-facing install instructions
- [DEVELOPING.md](DEVELOPING.md) — build/run/test, packaging, help center
- [ANALYTICS.md](ANALYTICS.md) — `analytics.properties` keys and GA4 taxonomy
- [CUSTOM_UI.md](CUSTOM_UI.md) · [TTS.md](TTS.md) · [REPO_CLEANUP.md](REPO_CLEANUP.md)
