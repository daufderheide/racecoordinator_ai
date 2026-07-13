# Race Coordinator AI: WebSocket API Reference

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

### Subscription Flow
1. **Initial Connection**: Upon upgrade, the server immediately sends a `RaceData` binary payload containing the global `SystemState` (either `"RACE_RUNNING"` or `"IDLE"`) and a snapshot of the current active race (if one exists).
2. **Explicit Subscription Request**: The client must send a binary `RaceSubscriptionRequest` Protobuf message over the socket:
   * **Subscribe (`subscribe = true`)**: The client is added to the active subscribers group (`raceDataSubscribers`). The server immediately sends the current `RaceData` snapshot and keeps broadcasting state updates as they occur.
   * **Unsubscribe (`subscribe = false`)**: The client is removed from the active subscribers group.
3. **Outgoing Broadcasts**: Subscribers receive real-time binary `RaceData` updates whenever race states update (such as lap registration, position changes, or racing pauses).

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
