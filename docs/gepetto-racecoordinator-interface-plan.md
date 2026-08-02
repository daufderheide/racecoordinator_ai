# Proposed Integration: Gepetto Lap Counter & Race Coordinator

Date: 08/01/2026

## IMPORTANT: Proposal Scope

> [!IMPORTANT]
> **Documentation Proposal Only**:
> This document is submitted as a design blueprint and API proposal for the Race Coordinator codeowners to review and approve. **No code modifications are included in this PR**.
> 
> Once the codeowners review, provide feedback, and merge this proposal, we will proceed with the code implementation phase and submit a separate PR containing the complete code changes.

---

## 1. Overview

The goal is to allow the external camera-based **Gepetto Lap Counter** Kotlin Multiplatform (KMP) app to connect over WebSockets to the **Race Coordinator AI** backend and act as a virtual track hardware interface. This allows counting laps, recording sector times, and handling track pause events without needing direct physical connection (like Arduino/Trackmate serial cables) to the host computer.

---

## 2. Proposed Database & Configuration Changes

### A. Protobuf Configuration & Interface Schema (`track_model.proto` & `interface_event.proto`)
We propose representing the virtual network-based lap counter with a new config message `WebSocketConfig` in `track_model.proto`:
```protobuf
syntax = "proto3";
package com.antigravity;

message WebSocketConfig {
  string name = 1;
  int32 port = 2; // Unique identifier/virtual port indexing
}
```
And adding it to `TrackModel`:
```protobuf
message TrackModel {
  ...
  repeated WebSocketConfig websocket_configs = 11;
}
```

To support section-based pit stop entry and exit (refueling), we propose adding `PitInEvent` and `PitOutEvent` to `InterfaceEvent` in `interface_event.proto`:
```protobuf
message InterfaceEvent {
  oneof event {
    LapEvent lap = 1;
    SegmentEvent segment = 2;
    InterfaceStatusEvent status = 3;
    CallbuttonEvent callbutton = 4;
    InterfaceAnalogDataEvent analogData = 5;
    InterfaceDigitalPinEvent digitalPin = 6;
    PitInEvent pit_in = 7;
    PitOutEvent pit_out = 8;
  }
}

message PitInEvent {
  int32 lane = 1;
  int32 interface_index = 2;
}

message PitOutEvent {
  int32 lane = 1;
  int32 interface_index = 2;
}
```

### B. Track Configurations & UI
When a user defines a slot car track in the settings, they can add a WebSocket interface. If selected, the Race Coordinator will register a virtual client listener.

---

## 3. Proposed Backend & Routing Changes

### A. Virtual Protocol Class (`WebSocketProtocol.java`)
We will create a virtual protocol `WebSocketProtocol` that **extends `DefaultProtocol`**:
* By extending the abstract `DefaultProtocol` class instead of directly implementing `IProtocol`, `WebSocketProtocol` inherits all the shared, robust logic implemented for physical track hardware (e.g. pit-lane state tracking, trigger throttle trims, refueling timer loops, and lane power relay sync).
* It registers the assigned `interfaceIndex` and delegates standard state transitions (`initializeHardwareState`, `close`, `open`) to the base implementations.

### B. WebSocket Handler Expansion (`App.java`)
We will update the `/api/interface-data` WebSocket endpoint to process incoming message payloads from clients:
```java
app.ws(
    "/api/interface-data",
    ws -> {
      ws.onConnect(ctx -> ClientSubscriptionManager.getInstance().addInterfaceSession(ctx));
      ws.onClose(ctx -> ClientSubscriptionManager.getInstance().removeInterfaceSession(ctx));
      ws.onBinaryMessage(
          ctx -> {
            try {
              InterfaceEvent event = InterfaceEvent.parseFrom(ctx.data());
              ClientSubscriptionManager.getInstance().handleIncomingInterfaceEvent(ctx, event);
            } catch (Exception e) {
              logger.error("Failed to parse incoming interface event over WebSocket", e);
            }
          });
    });
```

### C. Event Routing (`ClientSubscriptionManager.java`)
We will implement `handleIncomingInterfaceEvent(WsContext ctx, InterfaceEvent event)`:
1. **Authentication**: Verify that the session has the `Role.DIRECTOR` privilege. All events sent by standard `VIEWER` roles are rejected.
2. **Interface Mapping**: Resolve the virtual `interfaceIndex` (mapped to the configured `WebSocketProtocol`).
3. **Race Integration**: If a race is running (`currentRace != null`), map the received event:
   - **LapEvent**: Call `currentRace.onLap(lap.getLane(), lap.getLapTime(), lap.getInterfaceId(), resolvedInterfaceIndex)`
   - **SegmentEvent**: Call `currentRace.onSegment(...)`
   - **CallbuttonEvent**: Call `currentRace.onCallbutton(...)`
   - **PitInEvent**: Extract `WebSocketProtocol` from the active race and invoke `webSocketProtocol.updatePitState(pit_in.getLane(), true)`
   - **PitOutEvent**: Extract `WebSocketProtocol` from the active race and invoke `webSocketProtocol.updatePitState(pit_out.getLane(), false)`
4. **Re-broadcast**: Broadcast the event to all other clients connected to `/api/interface-data` for overlay updates.

---

## 4. Proposed Network Discovery

We propose adding JmDNS (`org.jmdns:jmdns:3.5.8` or similar) to `pom.xml`. On server startup, the server will advertise itself:
* **Service Type**: `_racecoordinator._tcp.local.`
* **Service Name**: `RaceCoordinatorServer`
* **Port**: `7070`

This enables automatic zero-configuration discovery so that Gepetto Lap Counter nodes on the local Wi-Fi network can discover and connect to the server without needing the user to look up and type local IP addresses.
