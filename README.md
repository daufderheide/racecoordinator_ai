# racecoordinator_antigravity
RaceCoordinator 2.0 built with google antigravity

## How to Run

### Quick Start
You can use the provided scripts in the root directory:
- `./run_server.sh`: Starts the Java backend.
- `./run_client.sh`: Starts the Angular frontend.

Or use the Antigravity slash commands:
- `/run_server`
- `/run_client`

### Manual Startup

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
