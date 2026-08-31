# Race Coordinator AI — Developer Guide

This document contains instructions for setting up a local development environment, running tests, linting, debugging, authoring documentation, and building release packages.

For end-user downloads and general information, see [README.md](README.md).

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [How to Run Locally](#how-to-run-locally)
  - [Linux / macOS](#linux--macos)
  - [Windows](#windows)
  - [Starting Services Individually](#starting-services-individually)
- [How to Stop Services](#how-to-stop-services)
- [Testing](#testing)
  - [Running All Tests](#running-all-tests)
  - [Client Unit Tests](#client-unit-tests)
  - [Client Visual Regression Tests (Docker)](#client-visual-regression-tests-docker)
  - [Server Unit Tests (Java)](#server-unit-tests-java)
- [Linting & Code Formatting](#linting--code-formatting)
- [Debugging](#debugging)
  - [Server (Java JDWP)](#server-java-jdwp)
  - [Client (Angular / TypeScript)](#client-angular--typescript)
- [Help Center Development](#help-center-development)
- [Packaging & Distribution](#packaging--distribution)

---

## Prerequisites

- **Java Development Kit (JDK)**: JDK 17+ (e.g., Temurin 17)
- **Node.js**: Node 20+ and `npm`
- **Maven**: Maven 3.8+ (Mac: `brew install mvn`, Ubuntu/Debian: `sudo apt install maven`)
- **Docker Desktop** (Optional, required only for running visual regression screendiff tests)

---

## How to Run Locally

### Linux / macOS

The `run_server.sh` script automatically downloads dependencies (including `protoc`), starts the Java server on port `7070`, builds/starts the Angular client on port `4200`, and opens your default browser.

1. Grant execute permissions:
   ```bash
   chmod +x run_server.sh run_client.sh
   ```
2. Run the application:
   ```bash
   ./run_server.sh
   ```
3. Run headless server (no browser / client):
   ```bash
   ./run_server.sh --headless
   ```

*Note: The script incrementally compiles. If you encounter compilation errors, run `cd server && mvn clean` then run `./run_server.sh` again.*

### Windows

The `run_server.ps1` script handles dependency downloading and starts both the Java server and Angular client.

1. Ensure PowerShell script execution is enabled:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```
2. Run the application:
   ```powershell
   .\run_server.ps1
   ```
3. Run headless server:
   ```powershell
   .\run_server.ps1 -Headless
   ```

### Starting Services Individually

#### 1. Server (Java)
```bash
cd server
mvn compile exec:java -Dexec.mainClass="com.antigravity.App"
```
The server listens on port `7070`.

#### 2. Client (Angular)
```bash
cd client
npm start
```
The client listens on port `4200`. Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## How to Stop Services

To stop running client and server processes:

- **Terminal**: Press `Ctrl+C` in the active terminal window.
- **Convenience Scripts**:
  - **Linux / macOS**: `./kill_client_server.sh`
  - **Windows**: `.\kill_client_server.ps1`
- **Manual Port Termination**:
  ```bash
  # Server (Port 7070)
  lsof -ti :7070 | xargs kill
  # Client (Port 4200)
  lsof -ti :4200 | xargs kill
  ```

---

## Testing

### Running All Tests
Execute the master test suite runner:
```bash
./run_all_tests.sh
```

### Client Unit Tests
Run Jasmine / Karma client unit tests:
- **Linux / macOS**: `./run_client_unit_tests.sh`
- **Windows**: `.\run_client_unit_tests.ps1`

*Note: This script automatically uses a local Playwright text-to-speech compatible Chromium instance.*

### Client Visual Regression Tests (Docker)
Visual regression tests use Playwright inside an isolated Docker container to ensure identical cross-platform rendering:

- **Linux / macOS**: `./run_client_screendiff_tests.sh`
- **Windows**: `.\run_client_screendiff_tests.ps1`

**Common Options:**
- **Run only changed components**:
  ```bash
  ./run_client_screendiff_tests.sh --changed
  ```
- **Target specific component**:
  ```bash
  ./run_client_screendiff_tests.sh race-editor
  ```
- **Update snapshot baselines**:
  ```bash
  ./run_client_screendiff_tests.sh --changed --update-snapshots
  ```
- **Promote actual results from previous run without re-running**:
  ```bash
  ./run_client_screendiff_tests.sh --sync-only
  ```

#### UI Component Change Commit Check
Whenever Angular client UI components (`*.component.{ts,html,scss,css}`, `styles.scss`, `index.html`, etc.) are modified, a Git commit check ensures that visual screendiff snapshots (`*-snapshots/*.png`) or visual tests (`*_screendiff_test.ts`) are updated to reflect the visual changes.

- **To update visual baselines**: Run `./run_client_screendiff_tests.sh --changed --update-snapshots` and stage the resulting snapshots with `git add`.
- **To bypass for strict refactors** (changes with no visual impact):
  - Use conventional refactor commit message: `git commit -m "refactor(client): simplify dialog methods"`
  - Or add `[skip-screendiff]` in commit message: `git commit -m "fix(client): handle null timer [skip-screendiff]"`
  - Or set environment variable: `SKIP_SCREENDIFF_CHECK=1 git commit -m "..."`

### Server Unit Tests (Java)
Run JUnit server test suites:
- **Linux / macOS**: `./run_server_tests.sh`
- **Windows**: `.\run_server_tests.ps1`

---

## Linting & Code Formatting

The project enforces style and quality standards for TypeScript, HTML, and Java.

### Validate Code Quality
```bash
# Check both client and server
npm run lint

# Check client only (ESLint / Prettier)
npm run lint:client

# Check server only (Spotless / Checkstyle / PMD)
npm run lint:server
```

### Auto-Fix Formatting
- **Client**: `npm run lint:client`
- **Server**:
  - **Linux / macOS**: `cd server && mvn spotless:apply`
  - **Windows**: `cd server; mvn spotless:apply`

---

## Debugging

### Server (Java JDWP)
1. Start the server in debug mode:
   ```bash
   MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005" ./run_server.sh --headless
   ```
2. Attach your IDE (VS Code / IntelliJ) to localhost port `5005`.

### Client (Angular / TypeScript)
1. Open DevTools in Chrome or Edge (`F12` or `Cmd+Option+I`).
2. Press `Cmd+P` (macOS) or `Ctrl+P` (Windows) to search for TypeScript source files (e.g., `home.component.ts`).
3. Set breakpoints directly in TypeScript code.

---

## Help Center Development

The help center is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and localized into 7 languages.

### Local Preview
```bash
# Install dependencies
pip install mkdocs-material mkdocs-static-i18n

# Start live-reloading preview server
mkdocs serve --config-file help_center/mkdocs.yml
```
Preview is available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

### Build Static Site
```bash
mkdocs build --config-file help_center/mkdocs.yml
```

---

## Packaging & Distribution

### Create All Installers
```bash
# Linux / macOS
./create_installers.sh

# Windows
.\create_installers.ps1
```

### Windows Installer (.exe) via Inno Setup
Requires [Inno Setup 6](https://jrsoftware.org/isdl.php).
```bash
./create_installers.sh
iscc installer_online.iss
iscc installer_offline.iss
```
Generated installers will be output to `Output/`:
- `Output/RaceCoordinatorAI_Online_Setup.exe`
- `Output/RaceCoordinatorAI_Offline_Setup.exe`

---

## Release Pipeline & Branch Synchronization

The repository uses automated GitHub Actions workflows for continuous delivery:

1. **Beta Releases (`release/vX.Y.Z`)**:
   - Pushing commits to `release/vX.Y.Z` automatically publishes an incremented beta prerelease (`vX.Y.Z-beta.N`).
   - An automated downstream sync job (`sync-to-develop`) automatically merges `release/vX.Y.Z` into `develop` with `[skip ci]`. If merge conflicts occur, an automated PR is opened for conflict resolution.
2. **Nightly / Daily Builds (`develop`)**:
   - Daily scheduled builds run at 2:15 AM EDT from `develop` and publish `vX.Y.Z-alpha.YYYYMMDD`.
   - The workflow runs a pre-flight synchronization check against any active `release/*` branches. If unmerged fixes exist, they are merged into `develop` before building.
3. **Official Production Releases (`main`)**:
   - Production releases are triggered by pushing official version tags (e.g. `v1.0.0`) or manually dispatching a release on `main`.
4. **README Download Links & Changelog**:
   - Automated pull requests to update the direct download links in `README.md` and `CHANGELOG.md` on `main` are created only for Official Releases and Beta Previews (`release/*`).
   - Daily alpha builds (`develop`) never update the `main` README.

---

## Commit Message Conventions & Automated Changelogs

All commits to the repository are validated by a Git `commit-msg` hook (powered by Husky) and must adhere to [Conventional Commits](https://www.conventionalcommits.org/).

### Format
```text
<type>(<optional scope>): <short description>
```
Or for breaking changes:
```text
<type>(<optional scope>)!: <short description>
```

### Supported Commit Types

| Prefix | Description | Release Notes Impact |
| :--- | :--- | :--- |
| `feat:` | New feature or capability | Included in Release Notes under **🚀 New Features** |
| `fix:` | Bug fix or patch | Included in Release Notes under **🐛 Bug Fixes** |
| `refactor:` | Code restructuring without behavioral change | Included under **⚡ Improvements & Refactoring** |
| `perf:` | Performance optimization | Included under **⚡ Improvements & Refactoring** |
| `docs:` | Documentation updates (Help Center, README, markdown) | Internal / excluded from user release notes |
| `test:` | Adding, refactoring, or updating unit/visual tests | Internal / excluded from user release notes |
| `chore:` | Tooling, dependency updates, maintenance | Internal / excluded from user release notes |
| `ci:` | CI/CD workflows and release automation scripts | Internal / excluded from user release notes |
| `style:` | Code formatting, whitespace, spotless adjustments | Internal / excluded from user release notes |
| `build:` | Installer build scripts, Inno Setup, packaging | Internal / excluded from user release notes |

### Scopes & The Special `(beta)` Scope

Commit types support optional scopes in parentheses (e.g. `feat(phidget): ...`, `fix(timer): ...`).

* **General scopes** (e.g. `feat(webcam): ...`, `fix(timer): ...`):
  - Formatted into release notes with the scope highlighted (e.g. `- **webcam**: add webcam track interface`).
* **Special `(beta)` scope** (e.g. `fix(beta): ...`, `feat(beta): ...`):
  - **In Beta Previews**: Included in beta release notes under **🐛 Bug Fixes** or **🚀 New Features** so beta testers know their reported issue was resolved.
  - **In Official Releases**: **Automatically omitted**. Because the underlying feature is brand new to official users, interim bug fixes made during beta testing are omitted to keep official release notes concise and noise-free.

### Examples
- `feat(phidget): add relay output control handler`
- `fix: resolve race day startup timer crash`
- `fix(beta): resolve webcam frame rate drop on macOS` *(Shows in beta release notes; omitted from official release notes)*
- `perf(ui): optimize track map rendering during live heats`
- `docs: add troubleshooting instructions for macOS permissions`
- `chore: update angular dependencies to latest patch`

### Why This is Enforced
Conventional commit prefixes drive our **automated release notes generation**. When a new official or beta release is published, the release workflow automatically extracts `feat:`, `fix:`, and `perf:` commits since the previous release, filters out internal noise (`chore:`, `ci:`, `test:`, `screendiff:`), and compiles clean, professional change lists for GitHub Releases, `CHANGELOG.md`, and the Help Center (with an expandable link to the full raw commit diff on GitHub for developers).

