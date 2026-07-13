# Race Coordinator AI: Server API Reference (`localhost:7070`)

This document provides a comprehensive reference of all REST API endpoints and WebSocket channels exposed by the Race Coordinator AI backend server running on port `7070`.

---

## Access Control & Authorization

The server uses an access control mechanism with three hierarchy levels defined in `Role`:
1. **Viewer**: Read-only access to stats, configuration, list of drivers/tracks.
2. **Director**: Write access to start/stop races, adjust laps, manage participants.
3. **Admin**: Server settings management, database CRUD/switch operations.

### Automatic Elevation
* **Localhost Request**: Requests originating from the local machine (`127.0.0.1` or `::1`) are **automatically elevated to `ADMIN`** role without requiring authentication tokens.
* **Token-based**: External connections require a `Bearer <token>` string in the `Authorization` header to authenticate as a `DIRECTOR`.

---

## 1. Authentication APIs (`AuthTaskHandler`)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | `VIEWER` | `{ "password": "..." }` | `{ "success": true, "token": "...", "error": null }` | Authenticates a Director and returns a Bearer token. |
| `PUT` | `/api/auth/password` | `ADMIN` | `{ "newPassword": "..." }` | `{ "success": true }` | Updates the Director password. |
| `GET` | `/api/auth/password` | `ADMIN` | None | `{ "password": "..." }` | Retrieves the current Director password. |
| `GET` | `/api/auth/role` | `VIEWER` | None | `{ "role": "ADMIN" }` | Returns the caller's determined authorization role based on headers/IP. |

---

## 2. Server Settings (`SettingsTaskHandler`)

| Method | Path | Allowed Role | Parameters | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/settings/log-level` | `ADMIN` | `level` (query parameter) | None | Plaintext confirmation | Changes the log level of `com.antigravity` package at runtime (e.g. `DEBUG`, `INFO`, `WARN`). |
| `POST` | `/api/settings/director-password` | `ADMIN` | None | `{ "password": "..." }` | Plaintext confirmation | Changes the Director password. |
| `GET` | `/api/settings/auth` | `ADMIN` | None | None | `{ "hasDirectorPassword": true }` | Checks whether a Director password has been set. |

---

## 3. Themes APIs (`ThemeTaskHandler`)

Themes define the colors and audio properties of the UI slots.

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/themes` | `VIEWER` | None | Array of Theme JSON objects | Retrieves all themes. |
| `GET` | `/api/themes/default` | `VIEWER` | None | Theme JSON object | Retrieves the system default theme. |
| `GET` | `/api/themes/{id}` | `VIEWER` | None | Theme JSON object | Retrieves a specific theme by entity ID. |
| `POST` | `/api/themes` | `VIEWER` | Theme JSON | Created Theme JSON | Creates a new theme. |
| `PUT` | `/api/themes/{id}` | `VIEWER` | Theme JSON | Updated Theme JSON | Updates a theme. (Cannot modify default theme). |
| `DELETE` | `/api/themes/{id}` | `VIEWER` | None | None (status `204`) | Deletes a theme. (Cannot delete default theme). |
| `POST` | `/api/themes/{id}/duplicate` | `VIEWER` | `{ "name": "..." }` (optional) | Created Theme JSON | Duplicates a theme with a new name. |

---

## 4. Asset Management APIs (`AssetTaskHandler`)

Assets are divided into images, audios, and custom rotations. Most assets API requests and responses use **Protocol Buffers (Protobuf)** via binary byte streams (`application/octet-stream`).

| Method | Path | Request Format | Response Format | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/api/assets/list` | None | `ListAssetsResponse` (Protobuf) | Lists all saved assets. |
| `POST` | `/api/assets/upload` | `UploadAssetRequest` (Protobuf) | `UploadAssetResponse` (Protobuf) | Uploads binary image/audio assets. |
| `POST` | `/api/assets/delete` | `DeleteAssetRequest` (Protobuf) | `DeleteAssetResponse` (Protobuf) | Deletes an asset. |
| `POST` | `/api/assets/rename` | `RenameAssetRequest` (Protobuf) | `RenameAssetResponse` (Protobuf) | Renames an asset. |
| `POST` | `/api/assets/save-image-set` | `SaveImageSetRequest` (Protobuf) | `SaveImageSetResponse` (Protobuf) | Saves a sequence of images. |
| `POST` | `/api/assets/save-audio-set` | `SaveAudioSetRequest` (Protobuf) | `SaveAudioSetResponse` (Protobuf) | Saves a sequence of audios. |
| `POST` | `/api/assets/save-custom-rotation` | `SaveCustomRotationRequest` (Protobuf) | `SaveCustomRotationResponse` (Protobuf) | Saves custom lane rotation tables. |
| `GET` | `/api/assets/download/{id}` | None | Binary File Stream | Downloads or displays a file asset. |
| `GET` | `/assets/{filename}` | None | Binary File Stream | Serves static assets from the current DB asset storage. |

---

## 5. Database & Entity APIs (`DatabaseTaskHandler`)

Entities (Drivers, Tracks, Teams, Races) and Database Management.

### Database Administration (Admin Role)

| Method | Path | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/api/databases` | None | Array of Database Stats JSON | Lists all available MongoDB databases. |
| `POST` | `/api/databases/switch` | `{ "name": "..." }` | Database Stats JSON | Switches the active database. |
| `POST` | `/api/databases/create` | `{ "name": "..." }` | Database Stats JSON | Creates and initializes a database. |
| `POST` | `/api/databases/copy` | `{ "name": "...", "source": "..." }` | Database Stats JSON | Copies one database to a new name. |
| `POST` | `/api/databases/reset` | `{ "name": "..." }` (optional) | Database Stats JSON | Resets the specified DB to factory defaults. |
| `POST` | `/api/databases/delete` | `{ "name": "..." }` | None (status `204`) | Deletes a database (Cannot delete active DB). |
| `GET` | `/api/databases/current` | None | Database Stats JSON | Returns details of the active database. |
| `GET` | `/api/databases/{name}/export` | None | ZIP File Stream | Exports a database as a ZIP file. |
| `POST` | `/api/databases/import` | Multipart: `name` & `file` (ZIP) | Database Stats JSON | Imports a database from a ZIP export. |

### Drivers (Viewer / Director Roles)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/drivers` | `VIEWER` | None | Array of Driver JSON | Lists all drivers. |
| `POST` | `/api/drivers` | `DIRECTOR` | Driver JSON | Created Driver JSON | Creates a new driver. |
| `PUT` | `/api/drivers/{id}` | `DIRECTOR` | Driver JSON | Updated Driver JSON | Updates a driver. |
| `DELETE` | `/api/drivers/{id}` | `DIRECTOR` | None | None (status `204`) | Deletes a driver. |

### Teams (Viewer / Director Roles)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/teams` | `VIEWER` | None | Array of Team JSON | Lists all teams. |
| `POST` | `/api/teams` | `DIRECTOR` | Team JSON | Created Team JSON | Creates a new team. |
| `PUT` | `/api/teams/{id}` | `DIRECTOR` | Team JSON | Updated Team JSON | Updates a team. |
| `DELETE` | `/api/teams/{id}` | `DIRECTOR` | None | None (status `204`) | Deletes a team. |

### Tracks (Viewer / Director Roles)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/tracks` | `VIEWER` | None | Array of Track JSON | Lists all tracks. |
| `GET` | `/api/tracks/factory-settings` | `VIEWER` | None | Track JSON | Returns system factory track template. |
| `POST` | `/api/tracks` | `DIRECTOR` | Track JSON | Created Track JSON | Creates a new track. |
| `PUT` | `/api/tracks/{id}` | `DIRECTOR` | Track JSON | Updated Track JSON | Updates a track. |
| `DELETE` | `/api/tracks/{id}` | `DIRECTOR` | None | None (status `204`) | Deletes a track. |

### Races (Viewer / Director Roles)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/races` | `VIEWER` | None | Array of Race maps | Lists all configured races. |
| `POST` | `/api/races` | `DIRECTOR` | Race JSON | Created Race JSON | Creates a new race config. |
| `PUT` | `/api/races/{id}` | `DIRECTOR` | Race JSON | Updated Race JSON | Updates a race config. |
| `DELETE` | `/api/races/{id}` | `DIRECTOR` | None | None (status `204`) | Deletes a race and cascades deletion. |
| `POST` | `/api/races/{id}/generate-heats` | `DIRECTOR` | `{ "driverCount": X }` | Heats Structure JSON | Generates a heat schedule for X drivers. |
| `POST` | `/api/heats/preview` | `DIRECTOR` | Heat Parameters JSON | Heats Structure JSON | Generates a preview heat schedule without saving. |

### Race History & Statistics (Viewer Role)

| Method | Path | Parameters | Response Body | Description |
|:---|:---|:---|:---|:---|
| `GET` | `/api/history/races` | `demo=true/false` (optional) | Array of History Records | Lists completed/saved historical races. |
| `GET` | `/api/history/races/{id}` | `demo=true/false` (optional) | History Record JSON | Retrieves details of a specific historical race. |
| `GET` | `/api/history/races/{id}/export` | `demo=true/false` (optional) | CSV File Stream | Exports a completed race history to CSV. |
| `GET` | `/api/history/stats` | `demo=true/false`, `raceId` (optional) | GlobalStatistics JSON | Global performance stats across races. |
| `GET` | `/api/history/drivers/{driverId}/stats` | `demo=true/false`, `raceId` (optional) | DriverStatistics JSON | Performance stats of a specific driver. |

---

## 6. Client / Race Operations (`ClientCommandTaskHandler`)

Endpoints for running live races, pit stops, and hardware interfaces. Many write commands use **Protocol Buffers**.

### Race Controller State Actions

| Method | Path | Allowed Role | Request Format | Response Format | Description |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/initialize-race` | `DIRECTOR` | `InitializeRaceRequest` (Protobuf) | `InitializeRaceResponse` (Protobuf) | Initializes a race with selected drivers. |
| `POST` | `/api/start-race` | `DIRECTOR` | None | `StartRaceResponse` (Protobuf) | Starts the current race or warmup. |
| `POST` | `/api/pause-race` | `DIRECTOR` | None | `PauseRaceResponse` (Protobuf) | Pauses the race. |
| `POST` | `/api/end-race` | `DIRECTOR` | `EndRaceRequest` (Protobuf) | `EndRaceResponse` (Protobuf) | Forcibly terminates the active race. |
| `POST` | `/api/next-heat` | `DIRECTOR` | None | `NextHeatResponse` (Protobuf) | Moves the heat schedule forward. |
| `POST` | `/api/restart-heat` | `DIRECTOR` | None | `RestartHeatResponse` (Protobuf) | Restarts the current active heat. |
| `POST` | `/api/skip-heat` | `DIRECTOR` | None | `SkipHeatResponse` (Protobuf) | Skips the current heat. |
| `POST` | `/api/skip-race` | `DIRECTOR` | None | `SkipRaceResponse` (Protobuf) | Skips to the end of the race. |
| `POST` | `/api/defer-heat` | `DIRECTOR` | None | `DeferHeatResponse` (Protobuf) | Postpones the current heat to the end. |
| `POST` | `/api/abort-timers` | `DIRECTOR` | None | `PauseRaceResponse` (Protobuf) | Cancels auto-timers (advance/start). |

### Track & Hardware Control

| Method | Path | Allowed Role | Request Format | Response Format | Description |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/update-interface-config` | `DIRECTOR` | `UpdateInterfaceConfigRequest` (Protobuf) | `UpdateInterfaceConfigResponse` (Protobuf) | Dynamically updates a connected interface's settings. |
| `POST` | `/api/initialize-interface` | `DIRECTOR` | `InitializeInterfaceRequest` (Protobuf) | `InitializeInterfaceResponse` (Protobuf) | Re-initializes connections to serial ports. |
| `POST` | `/api/set-interface-pin-state` | `DIRECTOR` | `SetInterfacePinStateRequest` (Protobuf) | `SetInterfacePinStateResponse` (Protobuf) | Sets high/low level of output pins. |
| `POST` | `/api/set-interface-rgb-led-state` | `DIRECTOR` | `SetInterfaceRgbLedStateRequest` (Protobuf) | `SetInterfaceRgbLedStateResponse` (Protobuf) | Drives RGB addressable LEDs. |
| `POST` | `/api/close-interface` | `DIRECTOR` | None | Plaintext ("OK") | Closes serial interfaces. |
| `GET` | `/api/serial-ports` | `VIEWER` | None | JSON array of strings | Lists available serial ports on the host. |
| `POST` | `/api/track/power/main` | `DIRECTOR` | Query `on=true/false` | Plaintext | Switches main track power relay. |
| `POST` | `/api/track/power/lane/{lane}` | `DIRECTOR` | Query `on=true/false` | Plaintext | Switches power for a specific lane. |

### Live Heat Modifications

| Method | Path | Allowed Role | Request / Params | Response Format | Description |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/races/current-heat/drivers/{fromLane}/change-lane/{toLane}` | `DIRECTOR` | None | Plaintext | Swaps or shifts lane assignments. |
| `POST` | `/api/races/current-heat/drivers/{lane}/reset` | `DIRECTOR` | Path `{lane}` (or `"all"`) | Plaintext | Resets heat lap counts and times. |
| `POST` | `/api/races/current-heat/drivers/{lane}/actual-driver` | `DIRECTOR` | `{ "driverId": "..." }` | status `200` / error | Changes actual driver in pit stops. |
| `POST` | `/api/races/heats/{heatNumber}/drivers/{lane}/actual-driver` | `DIRECTOR` | `{ "driverId": "..." }` | status `200` / error | Changes actual driver for historical heat. |
| `POST` | `/api/races/current-heat/drivers/{lane}/user-laps` | `DIRECTOR` | `{ "userLaps": X }` | `{ "adjustedLapCount": Y }` | Modifies active lane lap section count. |
| `POST` | `/api/races/heats/{heatNumber}/drivers/{lane}/user-laps` | `DIRECTOR` | `{ "userLaps": X }` | `{ "adjustedLapCount": Y }` | Modifies a completed heat's lap sections. |
| `POST` | `/api/races/heats/user-laps/batch` | `DIRECTOR` | Array of user laps modifications | Plaintext ("OK") | Batch updates multiple heat lane lap offsets. |
| `POST` | `/api/modify-heats` | `DIRECTOR` | `ModifyHeatsRequest` (Protobuf) | `ModifyHeatsResponse` (Protobuf) | Begins interactive heat modification session. |
| `POST` | `/api/regenerate-heats` | `DIRECTOR` | `RegenerateHeatsRequest` (Protobuf) | `RegenerateHeatsResponse` (Protobuf) | Regenerates heat matrices interactively. |
| `POST` | `/api/finalize-modify-heats` | `DIRECTOR` | None | Plaintext ("OK") | Saves interactive heat modifications. |

### Race Saving, Loading & Export

| Method | Path | Allowed Role | Request / Params | Response Format | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/races/current/export-csv` | `VIEWER` | None | CSV File stream | Exports the current running race status. |
| `POST` | `/api/save-race` | `DIRECTOR` | None | Plaintext confirmation | Saves active race state to a JSON file. |
| `GET` | `/api/saved-races` | `VIEWER` | `demo=true/false` | JSON list of files | Lists available manual race saves. |
| `DELETE` | `/api/saved-races/{filename}` | `DIRECTOR` | `demo=true/false` | Plaintext confirmation | Deletes a manual race save. |
| `POST` | `/api/load-race` | `DIRECTOR` | `{ "filename": "...", "isDemo": true/false }` | Plaintext confirmation | Loads a race state and opens interfaces. |
| `GET` | `/api/analytics/config` | `VIEWER` | None | `{ "clientId": "...", "measurementId": "..." }` | Analytics credentials. |
| `POST` | `/api/analytics/toggle` | `ADMIN` | `{ "enabled": true/false }` (local only) | Plaintext confirmation | Enables or disables telemetry metrics. |

---

## 7. App & Update System (Direct `App.java` mapping)

| Method | Path | Allowed Role | Request Body | Response Body | Description |
|:---|:---|:---|:---|:---|:---|
| `GET` | `/api/version` | `VIEWER` | None | Plaintext | Returns the server's semantic version. |
| `GET` | `/api/server-ip` | `VIEWER` | None | Plaintext | Returns the server host's primary IPv4 address. |
| `GET` | `/api/update/check` | `VIEWER` | None | JSON object of update info | Checks remote repository for newer app versions. |
| `POST` | `/api/update/skip` | `VIEWER` | `{ "version": "X.Y.Z" }` | Plaintext | Suppresses prompt for a specific version. |
| `POST` | `/api/update/install` | `VIEWER` | `{ "downloadUrl": "..." }` | Plaintext | Downloads and triggers installer asynchronously. |

---

## 8. WebSocket Channels

Real-time state changes and hardware events are streamed via WebSockets. To see detailed documentation on subscription flows, session roles, automatic cleanups, and connection keepalives, refer to [WEBSOCKETS.md](file:///Users/luizvaldetaro/racecoordinator_ai/WEBSOCKETS.md).
