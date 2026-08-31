import { ITrackModel } from "@app/proto/antigravity";

import { TrackConverter } from "./track.converter";

describe("TrackConverter", () => {
  beforeEach(() => {
    TrackConverter.clearCache();
  });

  it("should return fallback Track when proto is null or undefined", () => {
    const track = TrackConverter.fromProto(null as any);
    expect(track).toBeTruthy();
    expect(track.name).toBe("Unknown Track");
  });

  it("should convert valid TrackModel from proto", () => {
    const proto: ITrackModel = {
      model: { entityId: "track-1" },
      name: "Super Speedway",
      numTrackSections: 120,
      hasDigitalFuel: true,
      hasPerLaneRelays: true,
      hasMainRelay: true,
      lanes: [
        {
          objectId: "lane-1",
          foregroundColor: "#ff0000",
          backgroundColor: "#000000",
          length: 50,
        },
      ],
      arduinoConfigs: [],
      trackmateConfigs: [],
      phidgetConfigs: [],
      bartConfigs: [],
    };

    const track = TrackConverter.fromProto(proto);
    expect(track.entity_id).toBe("track-1");
    expect(track.name).toBe("Super Speedway");
    expect(track.lanes.length).toBe(1);
    expect(track.has_digital_fuel).toBeTrue();
    expect(track.has_per_lane_relays).toBeTrue();
    expect(track.has_main_relay).toBeTrue();
    expect(track.track_scale).toBe(1.0);
  });

  it("should convert custom trackScale from proto", () => {
    const proto: ITrackModel = {
      model: { entityId: "track-2" },
      name: "HO Scale Track",
      numTrackSections: 100,
      trackScale: 1 / 64,
      lanes: [],
    };

    const track = TrackConverter.fromProto(proto);
    expect(track.entity_id).toBe("track-2");
    expect(track.track_scale).toBeCloseTo(0.015625, 5);
  });
});
