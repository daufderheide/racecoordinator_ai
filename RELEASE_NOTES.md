### 🐛 Hotfix Notes

- **hardware / serial**: Abort serial port teardown after a 2-second write timeout when closing or disconnecting unresponsive or stalled serial ports, preventing server shutdown hangs and orphaned background `javaw.exe` processes ([#1039](https://github.com/daufderheide/racecoordinator_ai/issues/1039)).
- **client**: Correctly handle the `/api/close-interface` response format in the client data service to ensure clean UI disconnection without unhandled error alerts.

### 📋 Cumulative Updates (Included from v1.0.2)

This hotfix builds directly on top of the recent `v1.0.2` release and includes all its features, fixes, and improvements:

#### 🐛 Key Fixes from v1.0.2
- **serial**: Increased microcontroller heartbeat watchdog tolerance to 5s (was 2s) in `DefaultProtocol` to prevent false disconnections and destructive auto-reconnect loops between heats over Bluetooth SPP / wireless serial links ([#1040](https://github.com/daufderheide/racecoordinator_ai/issues/1040)).
- **connection**: Extended client interface watchdog timeout default to 10s to ensure clean server disconnection handling without premature "No Status" alert popups.

<details>
<summary>🔍 <b>Full Commit History</b></summary>

<p>View full commit comparison on <a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.2...v1.0.3">GitHub</a></p>
</details>
