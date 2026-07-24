import { IPhidgetConfig, ITrackModel } from "@app/proto/antigravity";

import { PhidgetConfigConverter } from "./phidget_config.converter";
import { TrackConverter } from "./track.converter";

describe("PhidgetConfigConverter", () => {
  it("should convert from proto to model and back", () => {
    const proto: IPhidgetConfig = {
      name: "Test Phidget",
      serialNumber: 123456,
      isHubPort: true,
      hubPort: 2,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: false,
      digitalInIds: [1000, 1001],
      digitalOutIds: [4000, 4001],
      analogIds: [0, 1],
      voltageConfigs: [{ lane: 0, maxVoltage: 12.5 }],
    };

    const config = PhidgetConfigConverter.fromProto(proto);
    expect(config.name).toBe("Test Phidget");
    expect(config.serialNumber).toBe(123456);
    expect(config.isHubPort).toBeTrue();
    expect(config.hubPort).toBe(2);
    expect(config.voltageConfigs?.[0]).toBe(12.5);

    const backToProto = PhidgetConfigConverter.toProto(config);
    expect(backToProto.name).toBe("Test Phidget");
    expect(backToProto.serialNumber).toBe(123456);
    expect(backToProto.voltageConfigs?.[0].maxVoltage).toBe(12.5);
  });

  it("should preserve phidgetConfigs in TrackConverter.fromProto", () => {
    const trackProto: ITrackModel = {
      model: { entityId: "track-123" },
      name: "Phidget Speedway",
      numTrackSections: 100,
      lanes: [
        {
          objectId: "lane-1",
          backgroundColor: "#FF0000",
          foregroundColor: "#FFFFFF",
        },
      ],
      phidgetConfigs: [
        {
          name: "Phidget 1",
          serialNumber: 9999,
          isHubPort: false,
          hubPort: 0,
          digitalInIds: [1000],
        },
      ],
    };

    const track = TrackConverter.fromProto(trackProto);
    expect(track.name).toBe("Phidget Speedway");
    expect(track.phidget_configs.length).toBe(1);
    expect(track.phidget_configs[0].name).toBe("Phidget 1");
    expect(track.phidget_configs[0].serialNumber).toBe(9999);
  });
});
