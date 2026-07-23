# Hardware Interface Addition Guide & Checklist

This guide documents the complete checklist and step-by-step procedure for adding a new hardware interface to **Race Coordinator AI**.

Following this checklist ensures that the new hardware interface:
1. Persists properly in track configurations (DB <-> Proto <-> Client Models).
2. Renders and syncs correctly in the Angular track editor (including lane reordering and lane deletion).
3. Displays a clear interface summary in the Track Manager summary dashboard.
4. Instantiates correctly on the server during real race execution.

---

## Architecture Overview

A hardware interface spans the full stack:
- **Protobuf Schemas (`proto/track.proto`)**: Interface message definition and inclusion in `TrackModel`, `InitializeInterfaceRequest`, and `UpdateInterfaceConfigRequest`.
- **Server Protocol & Factory (`server/.../protocols`)**: Java config class, `IProtocol` implementation, and registration in `HardwareProtocolFactory`.
- **Server DB & Models (`server/.../models`, `converters`)**: Jackson/Mongo annotations in `Track.java`, DB handlers, and `TrackConverter.java`.
- **Client Models & Converters (`client/src/app/models`, `converters`)**: TypeScript interface in `track.ts`, converter class (`[Interface]ConfigConverter`), and mapping in `TrackConverter.ts`.
- **Client UI Editor (`client/src/app/components/track-editor`)**: Editor component (`[interface]-editor`), rendering in `track-editor.component.html`, state handling & pin remapping in `track-editor.component.ts`.
- **Client Track Manager Summary (`client/src/app/components/track-manager`)**: Summary component (`[interface]-summary`), displaying connection details (board/device type, port/serial number, hub port, configured pin count) and active pin behavior badges on the Track Manager screen.

---

## Step-by-Step Checklist

### 1. Protobuf Definitions (`proto/track.proto`)
- [ ] Define the interface configuration message (e.g. `message MyInterfaceConfig { ... }`).
- [ ] Add repeated field to `TrackModel`: `repeated MyInterfaceConfig my_interface_configs = X;`.
- [ ] Add repeated field to `InitializeInterfaceRequest`: `repeated MyInterfaceConfig my_interface_configs = X;`.
- [ ] Add optional field to `UpdateInterfaceConfigRequest`: `optional MyInterfaceConfig my_interface_config = X;`.
- [ ] Run protobuf generation script (`npm run build:proto` or equivalent).

### 2. Server Implementation (`server/`)
- [ ] Create `MyInterfaceConfig` model class (with Jackson/BSON annotations if needed).
- [ ] Create `MyInterfaceConfigConverter` (`MyInterfaceConfig` <-> `com.antigravity.proto.MyInterfaceConfig`).
- [ ] Create `MyInterfaceProtocol` implementing `IProtocol`.
- [ ] Add `myInterfaceConfigs` list to `Track.java` (fields, constructor, builder, getter).
- [ ] Update `TrackConverter.java` (`toProto`) to map `myInterfaceConfigs`.
- [ ] Register `MyInterfaceConfig` in `HardwareProtocolFactory.createProtocolsForTrack(...)`.
- [ ] Update `ClientCommandTaskHandler.java` for `initializeInterface` and `updateInterfaceConfig` if specific commands target this protocol.

### 3. Client Implementation (`client/`)
- [ ] Define `MyInterfaceConfig` interface in `client/src/app/models/track.ts`.
- [ ] Add `my_interface_configs?: MyInterfaceConfig[]` to `TrackParams` and `Track` class in `track.ts`.
- [ ] Initialize `this.my_interface_configs ??= []` in `Track` constructor defaults in `track.ts`.
- [ ] Create `client/src/app/converters/my_interface_config.converter.ts` with `fromProto` and `toProto`.
- [ ] Update `client/src/app/converters/track.converter.ts` (`fromProto`) to map `my_interface_configs`.
- [ ] Add helper methods in `DataService` (`mapMyInterfaceConfigsToProto`, update `initializeInterface`).

### 4. Client Track Editor Component (`client/src/app/components/track-editor/`)
- [ ] Create `my-interface-editor` component in `track-editor/my-interface-editor/`.
- [ ] Add `myInterfaceConfigs: MyInterfaceConfig[] = []` state array in `track-editor.component.ts`.
- [ ] Include `myInterfaceConfigs` in `captureState()`, `deepCopy()`, and `reset()` logic in `track-editor.component.ts`.
- [ ] Include `myInterfaceConfigs` in `updateInterfaceConfigsOnLaneOrderChange` and `updateInterfaceConfigsOnLaneDeletion` so pin mappings are updated when lanes are reordered or removed.
- [ ] Add UI tab and `*ngFor="let config of myInterfaceConfigs"` section in `track-editor.component.html`.
- [ ] Add "Add MyInterface" button handler (`addMyInterfaceConfig()`) and removal handler (`removeMyInterfaceConfig(index)`).

### 5. Client Track Manager Summary Component (`client/src/app/components/track-manager/`)
- [ ] Create `my-interface-summary` component in `track-manager/my-interface-summary/`.
- [ ] Implement `MyInterfaceSummaryComponent` with standalone inputs `config = input<MyInterfaceConfig>()` and optional `index = input<number>()`.
- [ ] Display core device connection fields (Device Name, Port/Serial Number, Hub Port, Configured Pin count).
- [ ] Implement behavior check indicators (`hasBehavior(...)`) for active pin features (Laps, Segments, Call Buttons, Relays, Voltage level, LEDs).
- [ ] Add `MyInterfaceSummaryComponent` to `TrackManagerComponent` imports array in `track-manager.component.ts`.
- [ ] Ensure `loadTracks()` in `track-manager.component.ts` maps `my_interface_configs: t.my_interface_configs`.
- [ ] Add conditional template block in `track-manager.component.html` rendering `<app-my-interface-summary>` for each item in `selectedTrack.my_interface_configs`.
- [ ] Create ComponentHarness (`my-interface-summary.harness.ts` and `my-interface-summary.harness.base.ts`).
- [ ] Add translation keys for summary titles and field labels in all `i18n/*.json` files.

### 6. Automated Tests
- [ ] Add server unit test verifying `TrackConverter` round-trip with `MyInterfaceConfig`.
- [ ] Add server unit test verifying `HardwareProtocolFactory` creates `MyInterfaceProtocol`.
- [ ] Add client unit test verifying `TrackConverter.fromProto` preserves `my_interface_configs`.
- [ ] Add client component test verifying track editor saving, lane reordering, and lane deletion for `MyInterfaceConfig`.
- [ ] Add client unit test verifying `MyInterfaceSummaryComponent` logic (pin counting, behavior checking, collapsed/expanded toggling).
- [ ] Add client test verifying `TrackManagerComponent` renders `<app-my-interface-summary>` when track has `my_interface_configs`.

