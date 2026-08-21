import { TrackmateConfig } from "@app/models/track";
import { ITrackmateConfig } from "@app/proto/antigravity";

import { TrackmateConfigConverter } from "./trackmate_config.converter";

describe("TrackmateConfigConverter", () => {
  it("should convert from proto correctly", () => {
    const proto: ITrackmateConfig = {
      name: "Trackmate 1",
      commPort: "COM1",
      normallyClosedRelays: true,
      normallyClosedLaneSensors: false,
      useIr: false,
      debounce: 2,
      numLanes: 4,
      hasPerLaneRelays: true,
      lapPinPitBehavior: 1,
      lapPinBehaviors: [100, 101, 102, 103],
    };

    const config = TrackmateConfigConverter.fromProto(proto);
    expect(config.name).toBe("Trackmate 1");
    expect(config.commPort).toBe("COM1");
    expect(config.normallyClosedRelays).toBeTrue();
    expect(config.normallyClosedLaneSensors).toBeFalse();
    expect(config.useIR).toBeFalse();
    expect(config.debounce).toBe(2);
    expect(config.numLanes).toBe(4);
    expect(config.hasPerLaneRelays).toBeTrue();
    expect(config.lapPinPitBehavior).toBe(1);
    expect(config.lapPinBehaviors).toEqual([100, 101, 102, 103]);
  });

  it("should convert to proto correctly", () => {
    const config: TrackmateConfig = {
      name: "Trackmate 2",
      commPort: "COM2",
      normallyClosedRelays: false,
      normallyClosedLaneSensors: true,
      useIR: true,
      debounce: 1,
      numLanes: 6,
      hasPerLaneRelays: false,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [200, 201],
    };

    const proto = TrackmateConfigConverter.toProto(config);
    expect(proto.name).toBe("Trackmate 2");
    expect(proto.commPort).toBe("COM2");
    expect(proto.normallyClosedRelays).toBeFalse();
    expect(proto.normallyClosedLaneSensors).toBeTrue();
    expect(proto.useIr).toBeTrue();
    expect(proto.debounce).toBe(1);
    expect(proto.numLanes).toBe(6);
    expect(proto.hasPerLaneRelays).toBeFalse();
    expect(proto.lapPinPitBehavior).toBe(0);
    expect(proto.lapPinBehaviors).toEqual([200, 201]);
  });
});
