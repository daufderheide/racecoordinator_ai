# racecoordinator_antigravity
RaceCoordinator 2.0 built with google antigravity

## How to Run

### Quick Start (Slash Commands)
If you are using Antigravity, you can use the following slash commands:
- `/run_server`: Starts the Java backend.
- `/run_client`: Starts the Angular frontend.

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
