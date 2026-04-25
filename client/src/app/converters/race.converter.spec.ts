// Force refresh for unit tests
import { Race } from "../models/race";
import { com } from "../proto/message";
import { RaceConverter } from "./race.converter";

describe("RaceConverter", () => {
  beforeEach(() => {
    RaceConverter.clearCache();
  });

  it("should map fuel options from proto", () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: "r1" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      fuelOptions: {
        enabled: true,
        capacity: 120,
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.fuel_options).toBeDefined();
    expect(result.fuel_options.enabled).toBeTrue();
    expect(result.fuel_options.capacity).toBe(120);
  });

  it("should handle missing fuel options", () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: "r2" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.fuel_options).toBeDefined();
    expect(result.fuel_options.enabled).toBeFalse();
  });

  it("should map drift time from proto", () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: "r3" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      driftTime: 1.5,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.drift_time).toBe(1.5);
  });

  it("should fallback to 0.5 drift time if missing in proto", () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: "r4" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.drift_time).toBe(0.5);
  });

  it("should map heat rotation type from enum in proto", () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: "r5" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatRotationType: 4, // SINGLE_HEAT_SOLO
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.heat_rotation_type).toBe("SingleHeatSolo");
  });
});
