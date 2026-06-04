# Installing Race Coordinator AI on Windows

## For end users — download and run

Grab the latest installer from the
[Releases page](https://github.com/tjc998/racecoordinator_ai/releases) and pick
**one**:

- **`RaceCoordinatorAI_Online_Setup.exe`** — recommended. Downloads Java 17 and
  MongoDB 6.0 during install (needs an internet connection).
- **`RaceCoordinatorAI_Offline_Legacy_Setup.exe`** — for offline machines or
  legacy Windows (XP / 7 / 8). Bundles Java 8 and MongoDB 3.2.

Then:

1. Double-click the `.exe` and accept the prompts (it needs administrator
   rights).
2. It installs to `C:\Program Files\Race Coordinator AI`, with data in
   `C:\ProgramData\Race Coordinator AI`, and creates two desktop shortcuts:
   **Race Coordinator Server (Headless)** and **Race Coordinator Client**.
3. Start the **Server (Headless)** shortcut, then open the **Client** shortcut
   (or browse to [http://localhost:7070](http://localhost:7070)).

> Prefer not to use the installer? Each release also includes
> `RaceCoordinator_Universal.zip` — extract it and run `setup_windows.bat`
> (once, to fetch Java) then `start_win.bat`.

### Requirements & notes

- **Windows:** XP SP3 or newer (32-bit and 64-bit supported).
- **Legacy Windows (7 / 8 / XP)** also needs the
  [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784)
  so MongoDB 3.2 can start.
- Ports **7070** (web) and **27017** (database) must be free.

For macOS and Linux/Raspberry Pi, see the [README](../README.md#install).

## For maintainers — publishing a release

Installers are built by the **Build Windows Installers** GitHub Actions
workflow (`.github/workflows/release.yml`). Inno Setup only runs on Windows, so
the build runs on a `windows-latest` runner rather than the Linux CI runners.

The workflow:

1. Builds the Angular client and the server fat JAR (protoc is fetched
   automatically by the Maven protobuf plugin).
2. Assembles the `release/` tree and, best-effort, bundles Java 8 + MongoDB 3.2
   for the offline installer.
3. Runs Inno Setup on `installer_online.iss` and
   `installer_offline_legacy.iss`, producing the `.exe`s in `Output/`.
4. Uploads `RaceCoordinatorAI_Online_Setup.exe`,
   `RaceCoordinatorAI_Offline_Legacy_Setup.exe`, and
   `RaceCoordinator_Universal.zip` as build artifacts, and attaches them to the
   GitHub Release when run for a tag.

### One-time setup

Add a repository secret **`ANALYTICS_PROPERTIES`** (Settings → Secrets and
variables → Actions) containing the contents of
`server/src/main/resources/analytics.properties` from the secure vault:

```properties
ga.measurement.id=G-XXXXXXXXXX
ga.api.secret=XXXXXXXXXXXXXXXXXXXXXX
```

If the secret is absent the build still succeeds, but GA4 analytics are
disabled in that build.

### Cutting a release

1. Bump `MyAppVersion` in `scripts/installer/installer_base.iss` and commit.
2. Tag and push:
   ```bash
   git tag -a v0.0.0.21 -m "Race Coordinator AI 0.0.0.21"
   git push origin v0.0.0.21
   ```
   The workflow runs automatically and publishes a Release with the installers
   attached.

To produce installers without publishing a Release, run the workflow manually
(Actions → **Build Windows Installers** → **Run workflow**) and download them
from the run's artifacts. Supplying a tag in the manual run also publishes a
Release.

> **Note:** installers are intentionally **not** committed to the repo —
> `release/` and `build_cache/` are git-ignored. Large binaries belong on the
> Releases page, not in git history.
