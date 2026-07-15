# Race Coordinator AI: WebSocket API Reference

Date reviewed: 07/14/2026

The server exposes two WebSocket channels to broadcast real-time state changes and hardware events. Both channels stream binary payloads containing serialized **Protocol Buffers (Protobuf)** messages and enforce connection parameters.

---

## General WebSocket Settings

* **Idle Timeout**: Automatically set to **15 seconds** (15,000 ms) upon connection upgrade.
* **Keepalive / Heartbeats**: The server sends a WebSocket Ping frame every **5 seconds** to all connected client sessions to verify connection liveness. Clients should reply with standard Pong frames.

---

## 1. Active Race Stream (`/api/race-data`)

* **Endpoint Path**: `/api/race-data`
* **Query Parameters** (Optional):
  * `intent`: If set to `preview`, the session will not be treated as a Director (Viewer-only connection).
  * `token`: Bearer authentication token used to verify Director privilege.
* **Data Format**: Binary payloads (`ByteBuffer` containing Protobuf message bytes).

### Session Roles & Elevation
* **Director Sessions**: A WebSocket session is promoted to a Director role if:
  1. The client connects from `localhost` (auto-elevation).
  2. A valid security token is provided in the `token` query parameter (and `intent` is not `preview`).
* **Viewer/Preview Sessions**: Connections lacking local IP origins or valid security tokens are restricted to Viewer privileges.

### Subscription Flow & Payload Schemas

1. **Initial Connection**: Upon upgrade, the server immediately pushes a `RaceData` binary payload containing the global `SystemState` (either `"RACE_RUNNING"` or `"IDLE"`) and a snapshot of the current active race (if one exists).
2. **Explicit Subscription Command**: The client must send a binary-encoded `RaceSubscriptionRequest` Protobuf message over the socket to begin receiving live broadcasts.
3. **Outgoing Broadcasts**: Active subscribers receive real-time binary `RaceData` updates whenever the race state changes.

#### A. Client-to-Server Command Schema (`RaceSubscriptionRequest`)
* **Protobuf Schema**:
  ```protobuf
  message RaceSubscriptionRequest {
      bool subscribe = 1; // Set to true to receive stream updates, false to stop
  }
  ```
* **Command JSON Equivalent (Subscribe request)**:
  ```json
  {
    "subscribe": true
  }
  ```

#### B. Server-to-Client Broadcast Schema (`RaceData`)
The main server broadcast wrapper containing state, standings, segment updates, and timestamps.
* **Protobuf Schema**:
  ```protobuf
  message RaceData {
    RaceTime race_time = 1;
    Lap lap = 2;
    Race race = 3;
    StandingsUpdate standings_update = 5;
    OverallStandingsUpdate overall_standings_update = 6;
    optional RaceState race_state = 7;
    CarData car_data = 8;
    Segment segment = 9;
    optional RaceFlag flag = 10;
    RecordData record_data = 11;
    Heat heat = 12;
    SystemState system_state = 13;
    GroupStandingsUpdate group_standings_update = 14;
  }
  ```

#### C. Field & Sub-Message Explanations

Each field in `RaceData` corresponds to a nested Protobuf message containing specific aspects of the race state:

##### 1. `race_time` (`RaceTime`)
Tracks execution timers for the active heat:
* `time` (double): Lapsed race duration in seconds for the active heat.
* `auto_start_remaining` (double): Remaining countdown (seconds) before the heat automatically starts.
* `auto_advance_remaining` (double): Remaining countdown (seconds) before the current heat advances to the next heat setup.

##### 2. `lap` (`Lap`)
Contains detailed metadata of the most recently completed lap across all lanes:
* `lap_time` (double): Duration of the recorded lap in seconds.
* `lap_number` (int32): Index of the completed lap.
* `average_lap_time` / `median_lap_time` / `best_lap_time` (double): Running stats for the current driver in this heat.
* `driver_id` (string): The entity ID of the driver who crossed the sensor.
* `fuel_level` (double): Driver's fuel percentage remaining at the lap cross.
* `type` (enum `LapType`): Defines the lap classification (`LAP`, `REACTION_TIME`, `FALSE_START`, `MIN_LAP_TIME`).
* `flag` (enum `RaceFlag`): Active track status associated with this lap registration.

##### 3. `race` (`Race`)
The primary entity representing the loaded race configuration and participant states:
* `race` (`RaceModel`): Core configuration rules (name, track ID, practice mode, auto-timers).
* `drivers` (repeated `RaceParticipant`): Complete list of driver profiles registered for the event.
* `heats` (repeated `Heat`): Generated grid of all heats in the schedule.
* `current_heat` (`Heat`): Active heat grid assignments and status.
* `state` (enum `RaceState`): Active controller state (e.g. `RACING`, `PAUSED`).

##### 4. `standings_update` / `overall_standings_update` / `group_standings_update`
Standings data structured for UI rendering:
* `standings_update` (`StandingsUpdate`): Current heat rank, driver gaps, and lap completion statuses.
* `overall_standings_update` (`OverallStandingsUpdate`): Global standings accumulated across all heats run so far in the race.
* `group_standings_update` (`GroupStandingsUpdate`): Division standings (active if multi-group classifications are enabled).

##### 5. `car_data` (`CarData`)
Real-time controller telemetry per track lane:
* `lane` (int32): Lane index (1-indexed).
* `controller_throttle_pct` (double): Physical trigger compression percentage.
* `car_throttle_pct` (double): Output motor percentage sent to the lane (after speed limiters, pit limits, or penalty trims).
* `location` (int32): Track location ID (e.g., Slot lane vs. Pit row lane).
* `fuel_level` (double): Real-time fuel percentage.
* `is_refueling` (bool): Active refueling indicator (from trigger-based or lane sensor pit stops).

##### 6. `record_data` (`RecordData`)
Records tracking data structure:
* `overall`: Track-wide historical records (all-time fastest lap time, highest lap counts, and lane-specific historical bests).
* `current`: Bests registered strictly during the active race session.

##### 7. `system_state` (`SystemState`)
Server access management:
* `resource_lock_state` (string): Lock status (`"IDLE"` or `"RACE_RUNNING"`).
* `owner_id` (string): Active director owner token/IP.
* `has_main_relay` / `has_per_lane_relays` (bool): Hardware capability flags identifying if power cut relays are wired to the controller.


#### D. Message Examples (JSON Equivalents)

##### Example 1: Server response immediately after connection upgrade (System Idle)
If no race is initialized or active, the server returns the global system locking state:
```json
{
  "system_state": {
    "resourceLockState": "IDLE",
    "ownerId": "",
    "hasMainRelay": false,
    "hasPerLaneRelays": false
  }
}
```

##### Example 2: Server response immediately after connection upgrade (Race Running)
If a race has already been started by a Director on the host machine, connecting clients receive the initial snapshot:
```json
{
  "system_state": {
    "resourceLockState": "RACE_RUNNING",
    "ownerId": "SYSTEM",
    "hasMainRelay": true,
    "hasPerLaneRelays": false
  },
  "race_time": {
    "time": 45.28,
    "autoStartRemaining": 0.0,
    "autoAdvanceRemaining": 0.0
  },
  "race": {
    "race": {
      "name": "Saturday Night Grand Prix",
      "trackEntityId": "track-seq-4",
      "minLapTime": 1.8,
      "practice": false
    },
    "drivers": [
      {
        "driver": {
          "name": "Lewis Hamilton",
          "nickname": "Hammie",
          "entityId": "driver-seq-1"
        },
        "seed": 1
      },
      {
        "driver": {
          "name": "Max Verstappen",
          "nickname": "MadMax",
          "entityId": "driver-seq-2"
        },
        "seed": 2
      }
    ],
    "current_heat": {
      "heatNumber": 1,
      "group": 1,
      "drivers": [
        {
          "actualDriver": {
            "name": "Lewis Hamilton",
            "entityId": "driver-seq-1"
          },
          "laps": 12,
          "bestLapTime": 1.954,
          "adjustedLapCount": 12.0
        },
        {
          "actualDriver": {
            "name": "Max Verstappen",
            "entityId": "driver-seq-2"
          },
          "laps": 11,
          "bestLapTime": 2.011,
          "adjustedLapCount": 11.0
        }
      ]
    },
    "state": "RACING"
  }
}
```

### Active Race Lifecycle & Auto-Cleanup
* **Orphaned Race Detection**: If the last session elevated to a **Director** disconnects or explicitly unsubscribes from the race data stream, the server starts an automatic cleanup process:
  1. **Active Splash Screen / Clients Connected**: If other Viewer/non-director sessions are still active, a **10-second grace period** timer is scheduled.
  2. **No Sessions Connected**: If all WebSocket connections are closed, a **1-second grace period** is scheduled.
  3. **Auto-Cleanup Cancellation**: If a Director client reconnects before the grace period expires, the cleanup timer is cancelled.
  4. **State Reset**: If the grace period expires without any Director reconnecting, the active race auto-save is deleted from the database, the running race state is stopped, the race is destroyed (`null`), and the system reverts to `"IDLE"`.

---

## 2. Interface Connectivity Stream (`/api/interface-data`)

* **Endpoint Path**: `/api/interface-data`
* **Data Format**: Binary payloads (`ByteBuffer` containing `InterfaceEvent` Protobuf bytes).
* **Purpose**: Streams real-time connection statuses, serial communication statistics, pin events, and diagnostic alerts from the track hardware interfaces.

### Hardware Resource Management
* **Auto-Release Protocol**: To free up serial ports and host resources, the server monitors active interface subscribers:
  * When the last client connected to `/api/interface-data` disconnects, the server checks if a live race is running.
  * If **no active race is running**, the server automatically closes the open hardware protocols (e.g. `ArduinoProtocol`, `TrackmateProtocol`) and releases the serial port resources.
