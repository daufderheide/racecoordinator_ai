# racecoordinator_ai
RaceCoordinator 2.0 built with google antigravity

## How to Run

### How to Run (Linux/Mac)

#### First Time Setup
The `run_server_headless.sh` script handles dependency downloading (including `protoc`) automatically.
The `run_client.sh` script handles `npm install` automatically if `node_modules` is missing or the client dependency manifest changed.

- Check permissions: `chmod +x run_server_headless.sh run_client.sh`
- Run Server: `./run_server_headless.sh`
- Run Client: `./run_client.sh` (will take a moment to install dependencies first time)

**Note:** The script incrementally compiles. If you need a clean build (e.g., weird compilation errors), run `cd server && mvn clean` manually, then run `./run_server_headless.sh` again.

### How to Run (Windows)

#### First Time Setup
The `run_server_headless.ps1` script handles dependency downloading (including `protoc`) automatically.
The `run_client.ps1` script handles `npm install` automatically if `node_modules` is missing or the client dependency manifest changed.

- Run Server: `.\run_server_headless.ps1`
- Run Client: `.\run_client.ps1` (will take a moment to install dependencies first time)

**Note:** If you get a script execution error, run `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` in your terminal first.

### Troubleshooting
If the server fails to start with "Address already in use", you likely have a zombie MongoDB process.
Run the provided script to fix it (updated to handle permissions better):
- **Linux/Mac**: `./kill_zombie_mongo.sh`
- **Windows**: `.\kill_zombie_mongo.ps1`

Or use the Antigravity command:
- `/kill_zombie_mongo`

If the client or server fail to startup, ensure a previous run is not still running. Simply kill them and try again.
- **Linux/Mac**: `./kill_client_server.sh`
- **Windows**: `.\kill_client_server.ps1`

Or use the Antigravity command:
- `/kill_client_server`

#### 1. Start the Server (Java)
The server runs on port `7070` and handles API requests.
```bash
cd server
mvn compile exec:java -Dexec.mainClass="com.antigravity.App"
```

#### 2. Start the Client (Angular)
The client runs on port `4200`.
```bash
cd client
npm start
```

#### 3. Launch in Browser
Once both are running, open your browser to:
[http://localhost:4200](http://localhost:4200)

## How to Stop

To stop the running client or server, you can use one of the following methods:

### 1. Terminal (Ctrl+C)
If you started the processes in a terminal window, simply press `Ctrl+C` in that window to terminate the process.

### 2. Antigravity Commands
If you are using the Antigravity extension, you can stop the processes by terminating the terminal tasks where they are running.

### 3. Kill Command (Fallback)
If the processes are running in the background, you can stop them by finding their PIDs and killing them:

- **Server (Port 7070):**
  ```bash
  lsof -ti :7070 | xargs kill
  ```
- **Client (Port 4200):**
  ```bash
  lsof -ti :4200 | xargs kill
  ```

- **Client and Server:**
  ```bash
  ./kill_client_server.sh
  ```
  Or use the Antigravity command:
  - `/kill_client_server`

## Testing

This project includes unit tests for the backend and frontend, as well as visual regression tests for the client.

### Run All Tests
You can run all tests across the entire project using the master script:
```bash
./run_all_tests.sh
```

### Client (Angular)

#### Unit Tests
Run the standard Jasmine/Karma unit tests:

- **Linux/Mac**: `./run_client_unit_tests.sh`
- **Windows**: `.\run_client_unit_tests.ps1`

*Note: This script automatically installs and uses a local Playwright text-to-speech compatible Chromium instance, ensuring tests run consistently regardless of your installed system browser.*

#### Visual Regression Tests (Screen Diff)
Run Playwright-based visual tests to detect UI regressions:

- **Linux/Mac**: `./run_client_screendiff_tests.sh`
- **Windows**: `.\run_client_screendiff_tests.ps1`

#### Accepting Changes (Updating Snapshots)
If you have intentionally modified the UI and need to update the expected screenshots, you have two options:

1. **Re-run and Update**: Run the tests and force an update of the snapshots. This will execute the tests again and overwrite the "expected" images with the new results.
   - **Linux/Mac**: `./run_client_screendiff_tests.sh --update-snapshots`
   - **Windows**: `.\run_client_screendiff_tests.ps1 --update-snapshots`

2. **Sync from Last Run**: If you just ran the tests and want to promote the "actual" (failed) images from that run to "expected" without re-running everything, use the sync flag. This is much faster.
   - **Linux/Mac**: `./run_client_screendiff_tests.sh --sync-only`
   - **Windows**: `.\run_client_screendiff_tests.ps1 --sync-only`

### Server (Java)
Run the JUnit tests for the backend:

- **Linux/Mac**: `./run_server_tests.sh`
- **Windows**: `.\run_server_tests.ps1`

## Linting

This project enforces code quality and style standards for both the client (TypeScript/HTML) and server (Java).

### What is Checked?
- **Client**: TypeScript and HTML linting (ESLint), code formatting (Prettier). A custom rule is enforced to forbid fully qualified Protobuf message names (e.g., `antigravity.Message`) in favor of direct imports.
- **Server**: Java code style (Spotless/Google Style), static analysis (Checkstyle), and potential bug detection (PMD).
- **Automation**: Linting and formatting are automatically run on staged files during commit via `husky` and `lint-staged`.

### How to Validate
You can run the following commands from the project root to check for linting errors:

- **Both Client & Server**: `npm run lint`
- **Client Only**: `npm run lint:client`
- **Server Only**: `npm run lint:server`

### How to Fix
Many linting issues can be fixed automatically:

- **Client**: Running `npm run lint:client` will automatically fix most TypeScript/HTML style and formatting issues.
- **Server**: To fix Java formatting issues automatically, run:
  - **Linux/Mac**: `cd server && mvn spotless:apply`
  - **Windows**: `cd server; mvn spotless:apply`

> [!TIP]
> You can also run `npm run lint` which will attempt to fix the client automatically while checking the server.

## Debugging

### Server (Java)

To debug the server, you need to enable the Java Debug Wire Protocol (JDWP) when starting the application.

1. **Start the server in debug mode:**
   ```bash
   MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005" ./run_server_headless.sh
   ```
   *Note: `suspend=n` means the server will start immediately. Change to `suspend=y` if you want it to wait for a debugger to attach before starting.*

2. **Set Breakpoints:**
   In VS Code, open your Java files (e.g., `App.java`) and click in the gutter to the left of the line numbers to set breakpoints.

3. **Attach Debugger:**
   - Install the **Debugger for Java** extension in VS Code.
   - Go to the **Run and Debug** view (`Cmd+Shift+D`).
   - Create a `launch.json` or use an existing one to "Attach" to port `5005`.

### Client (Angular)

The Angular client is configured to generate source maps in development mode, allowing you to debug the original TypeScript code instead of the compiled/obfuscated JavaScript.

1. **Using Browser DevTools (Chrome/Edge):**
   - Open the application in your browser.
   - Press `F12` or `Cmd+Option+I` to open DevTools.
   - Go to the **Sources** tab.
   - Press `Cmd+P` (Mac) or `Ctrl+P` (Windows) and type the name of the component file you want to debug (e.g., `home.component.ts`).
   - Click on line numbers to set breakpoints.

2. **Using VS Code:**
   - Install the **Debugger for Chrome** (or Edge) extension.
   - You can launch or attach to the browser directly from VS Code for an integrated debugging experience.

## Help Center

The project includes a built-in help center powered by [MkDocs Material](https://squidfunk.github.io/mkdocs-material/). Help articles are written in Markdown, stored in `help_center/docs/`, and automatically deployed to GitHub Pages on every push to `main`.

### Viewing the Help Center

- **Online**: [https://daufderheide.github.io/racecoordinator_ai/](https://daufderheide.github.io/racecoordinator_ai/)
- **Offline** (when bundled): `http://localhost:7070/help/` (served by the Javalin server)
- **On GitHub**: The Markdown source files are also readable directly at [help_center/docs/](help_center/docs/) on GitHub.

### Developer Setup (Optional)

**MkDocs is NOT required to build or run the application.** You only need it if you want to preview help center changes locally before pushing.

To set up the local preview environment:

```bash
# Install MkDocs Material and the i18n plugin
pip install mkdocs-material mkdocs-static-i18n

# Start a local preview server (live-reloads on changes)
mkdocs serve --config-file help_center/mkdocs.yml

# Opens at http://127.0.0.1:8000
```

To build the static site without serving:

```bash
mkdocs build --config-file help_center/mkdocs.yml
# Output goes to help_center/site/ (git-ignored)
```

### Adding or Editing Articles

1. Edit or create Markdown files in `help_center/docs/`.
2. If adding a new article, register it in the `nav` section of `help_center/mkdocs.yml`.
3. Push to `main` — the GitHub Actions workflow (`.github/workflows/docs.yml`) will automatically rebuild and deploy to GitHub Pages.

Article filenames must use lowercase with hyphens (e.g., `race-editor.md`, `track-manager.md`). Each article maps to one application screen.

### Localization

The help center supports 7 languages matching the application: English (default), Spanish, French, German, Dutch, Portuguese, and Italian.

Translations use a **suffix-based** naming convention:

| Language | Filename Example |
|---|---|
| English (default) | `race-editor.md` |
| Spanish | `race-editor.es.md` |
| French | `race-editor.fr.md` |
| German | `race-editor.de.md` |
| Dutch | `race-editor.nl.md` |
| Portuguese | `race-editor.pt.md` |
| Italian | `race-editor.it.md` |

If a translated page doesn't exist, the site automatically falls back to the English version. The language switcher in the site header lets users change languages.

### Adding "Learn More" Links in the App

The `HelpLinkService` handles opening help articles from within the Angular application. It automatically selects the online or offline URL based on connectivity and applies the user's language setting.

```typescript
// 1. Inject the service
constructor(public helpLink: HelpLinkService) {}

// 2. Use in template
<a (click)="helpLink.openHelp('race-editor')">Learn More</a>

// With a section anchor:
<a (click)="helpLink.openHelp('race-editor', 'heat-rotation-format')">Learn More</a>
```

### Offline Bundling (For Releases)

When creating installers, build the help site into the server's web directory so it's available without internet:

```bash
mkdocs build --config-file help_center/mkdocs.yml --site-dir server/web/help
```

The Javalin server serves everything under `web/` as static files, so the offline help center becomes available at `http://localhost:7070/help/`.

## Packaging & Distribution

You can create installable packages for macOS and Windows using the provided script.

### Create All Installers
Run the build script from the root directory:

- **Linux/Mac**: `./create_installers.sh`
- **Windows**: `.\create_installers.ps1`

This script will:
- Build the production Angular client.
- Package the Java server into a fat JAR.
- Download necessary JREs for offline Windows installers.
- Generate platform-specific launch scripts.
- Create compressed distribution packages in the `release/` directory.

### Generated Artifacts
After running the script, check the `release/` folder for:
- **`RaceCoordinator_Universal.zip`**: A standard distribution for Mac, Linux, and Windows. Requires Java to be already installed on the system.
- **`RaceCoordinator_Windows_Offline.zip`**: A Windows-specific distribution that includes bundled JREs (Java 8 for XP/7/8, Java 17 for 10/11). Works without an internet connection.
- **`RaceCoordinator_Mac.dmg`**: (macOS only) A Disk Image for easy installation on Mac. Only generated if the script is run on a Mac.

### Windows Installer (.exe)
For a professional Windows installation experience, you can create a standalone `.exe` installer using **Inno Setup**.

#### Prerequisites
1. Install [Inno Setup 6](https://jrsoftware.org/isdl.php) (stable version recommended).
2. Ensure `iscc` is in your system PATH (optional, but recommended for command-line builds).

#### Building the Installer
1. First, run the standard build script to prepare all artifacts:
   ```bash
   ./create_installers.sh
   ```
2. If `iscc` is in your PATH, the script will automatically attempt to build the `.exe`. Otherwise, run it manually from the root directory:
   ```bash
   iscc installer.iss
   ```

#### Output Location
The generated installer will be located in the **`Output/`** folder:
- **`Output/RaceCoordinatorAI_Setup.exe`**

This installer will:
- Install the application to `C:\Program Files\RaceCoordinator AI`.
- Setup writable data (database, assets) in `C:\ProgramData\RaceCoordinator AI`.
- Create desktop shortcuts for both the **Headless Server** and the **Web Client**.
- Bundle a compatible Java Runtime (Java 8 for legacy Windows, Java 17 for modern Windows) so the user doesn't need to install Java manually.

### System Requirements for Installers
- **macOS**: 10.15 (Catalina) or newer recommended.
- **Windows**: Windows XP SP3 or newer. 32-bit and 64-bit supported.
  - **Windows 7/8/XP Note**: Requires the [Microsoft Visual C++ 2013 Redistributable (x86)](https://www.microsoft.com/en-us/download/details.aspx?id=40784) to be installed for MongoDB 3.2 to run.
- **Linux / Raspberry Pi**: Any modern distribution with Java 8 or newer.
