# racecoordinator_ai
RaceCoordinator 2.0 built with google antigravity

## How to Run

### First Time Setup
The `run_server.sh` script handles dependency downloading (including `protoc`) automatically.
The `run_client.sh` script handles `npm install` automatically if `node_modules` is missing.

- Check permissions: `chmod +x run_server.sh run_client.sh`
- Run Server: `./run_server.sh`
- Run Client: `./run_client.sh` (will take a moment to install dependencies first time)

**Note:** The script incrementally compiles. If you need a clean build (e.g., weird compilation errors), run `cd server && mvn clean` manually, then run `./run_server.sh` again.

### Quick Start
You can use the provided scripts in the root directory:
- `./run_server.sh`: Starts the Java backend and auto-starts the Angular frontend.
- `./run_server_headless.sh`: (Recommended) Starts the Java backend without auto-starting the Angular frontend.
- `./run_client.sh`: Starts the Angular frontend.

### Troubleshooting
If the server fails to start with "Address already in use", you likely have a zombie MongoDB process.
Run the provided script to fix it (updated to handle permissions better):
```bash
./kill_zombie_mongo.sh
```
Or use the Antigravity command:
- `/kill_zombie_mongo`

**Note:** If `run_server.sh` fails, try `run_server_headless.sh`. It runs the server without attempting to launch the client or browser, which is useful for debugging.


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
```bash
./run_client_unit_tests.sh
```
*Note: This script automatically installs and uses a local Playwright text-to-speech compatible Chromium instance, ensuring tests run consistently regardless of your installed system browser.*

#### Visual Regression Tests (Screen Diff)
Run Playwright-based visual tests to detect UI regressions:
```bash
cd client
npm run test:visual
```
*Snapshots are generated for all supported languages (en, es, fr, de, pt).*

#### Accepting Changes (Updating Snapshots)
If you have intentionally modified the UI and need to update the expected screenshots, run:
```bash
./run_client_screendiff_tests.sh --update-snapshots
```

### Server (Java)
Run the JUnit tests for the backend:
```bash
cd server
mvn test
```

## Debugging

### Server (Java)

To debug the server, you need to enable the Java Debug Wire Protocol (JDWP) when starting the application.

1. **Start the server in debug mode:**
   ```bash
   MAVEN_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005" ./run_server.sh
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

## Packaging & Distribution

You can create installable packages for macOS and Windows using the provided script.

### Create All Installers
Run the build script from the root directory:
```bash
./create_installers.sh
```

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

### System Requirements for Installers
- **macOS**: 10.15 (Catalina) or newer recommended.
- **Windows**: Windows XP SP3 or newer. 32-bit and 64-bit supported.
- **Linux / Raspberry Pi**: Any modern distribution with Java 8 or newer.
