import { BartConfig } from "@app/models/bart_config";

import { BartConfigConverter } from "./bart_config.converter";

describe("BartConfigConverter", () => {
  it("should convert from proto with default lapPinPitBehavior (0)", () => {
    const proto = {
      name: "BART_TEST",
      deviceName: "BART_0001",
      deviceAddress: "AA:BB:CC:DD:EE:FF",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [0, 1, 2, 3],
    };

    const config: BartConfig = BartConfigConverter.fromProto(proto);

    expect(config.name).toBe("BART_TEST");
    expect(config.deviceName).toBe("BART_0001");
    expect(config.deviceAddress).toBe("AA:BB:CC:DD:EE:FF");
    expect(config.minLapMs).toBe(1000);
    expect(config.lapPinPitBehavior).toBe(0);
    expect(config.numLanes).toBe(4);
    expect(config.lapPinBehaviors).toEqual([0, 1, 2, 3]);
  });

  it("should convert to proto maintaining lapPinPitBehavior = 0", () => {
    const config: BartConfig = {
      name: "BART_TEST",
      deviceName: "BART_0001",
      deviceAddress: "AA:BB:CC:DD:EE:FF",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [0, 1, 2, 3],
    };

    const proto = BartConfigConverter.toProto(config);

    expect(proto.name).toBe("BART_TEST");
    expect(proto.deviceName).toBe("BART_0001");
    expect(proto.deviceAddress).toBe("AA:BB:CC:DD:EE:FF");
    expect(proto.minLapMs).toBe(1000);
    expect(proto.lapPinPitBehavior).toBe(0);
    expect(proto.numLanes).toBe(4);
    expect(proto.lapPinBehaviors).toEqual([0, 1, 2, 3]);
  });
});
