// Force refresh for unit tests
import { IRaceModel } from "@app/proto/antigravity";

import {} from "../models/race";
import { RaceConverter } from "./race.converter";

describe("RaceConverter", () => {
  beforeEach(() => {
    RaceConverter.clearCache();
  });

  it("should map fuel options from proto", () => {
    const mockProto: IRaceModel = {
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
    const mockProto: IRaceModel = {
      model: { entityId: "r2" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.fuel_options).toBeDefined();
    expect(result.fuel_options.enabled).toBeFalse();
  });

  it("should map drift time from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r3" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      driftTime: 1.5,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.drift_time).toBe(1.5);
  });

  it("should fallback to 0.5 drift time if missing in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r4" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.drift_time).toBe(0.5);
  });

  it("should map heat rotation type from enum in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r5" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatRotationType: 4, // SINGLE_HEAT_SOLO
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.heat_rotation_type).toBe("SingleHeatSolo");
  });

  it("should map start_behind_sensor from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r6" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      startBehindSensor: false,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.start_behind_sensor).toBeFalse();
  });

  it("should default start_behind_sensor to true if missing in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r7" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.start_behind_sensor).toBeTrue();
  });

  it("should map practice from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r8" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      practice: true,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.practice).toBeTrue();
  });

  it("should default practice to false if missing in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r9" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.practice).toBeFalse();
  });

  it("should parse finishValue in heatScoring", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r10" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatScoring: {
        finishMethod: 1,
        finishValue: 42,
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.heat_scoring.finishValue).toBe(42);
  });

  it("should handle null finishValue in heatScoring", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r11" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatScoring: {
        finishMethod: 1,
        finishValue: null,
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.heat_scoring.finishValue).toBe(0);
  });
});
