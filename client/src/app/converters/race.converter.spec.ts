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

  it("should map SingleHeatSoloAllLanes and SingleHeatSoloAllLanesAccumulate from proto", () => {
    const mockProto1: IRaceModel = {
      model: { entityId: "r5a" },
      name: "Test Race 1",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatRotationType: 7, // SINGLE_HEAT_SOLO_ALL_LANES
    };
    const result1 = RaceConverter.fromProto(mockProto1);
    expect(result1.heat_rotation_type).toBe("SingleHeatSoloAllLanes");

    const mockProto2: IRaceModel = {
      model: { entityId: "r5b" },
      name: "Test Race 2",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatRotationType: 8, // SINGLE_HEAT_SOLO_ALL_LANES_ACCUMULATE
    };
    const result2 = RaceConverter.fromProto(mockProto2);
    expect(result2.heat_rotation_type).toBe("SingleHeatSoloAllLanesAccumulate");
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

  it("should map start_at_current from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r8" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      startAtCurrent: true,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.start_at_current).toBeTrue();
  });

  it("should default start_at_current to false if missing in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r9" },
      name: "Test Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.start_at_current).toBeFalse();
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

  it("should preserve startTime and restartTime when set to 0", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r12" },
      name: "Test Race 0 Duration",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      startTime: 0,
      restartTime: 0,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.start_time).toBe(0);
    expect(result.restart_time).toBe(0);
  });

  it("should map group options and group names from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r13" },
      name: "Group Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      groupOptions: {
        enabled: true,
        maxGroups: 2,
        names: ["Novice Group", "Pro Group"],
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.group_options).toBeDefined();
    expect(result.group_options.enabled).toBeTrue();
    expect(result.group_options.max_groups).toBe(2);
    expect(result.group_options.names).toEqual(["Novice Group", "Pro Group"]);
  });

  it("should map minLapTime from proto and default to 1.5 when not provided", () => {
    const mockProtoDefault: IRaceModel = {
      model: { entityId: "r14" },
      name: "Default Min Lap Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };
    const resultDefault = RaceConverter.fromProto(mockProtoDefault);
    expect(resultDefault.min_lap_time).toBe(1.5);

    const mockProtoExplicit: IRaceModel = {
      model: { entityId: "r15" },
      name: "Explicit Min Lap Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      minLapTime: 3.2,
    };
    const resultExplicit = RaceConverter.fromProto(mockProtoExplicit);
    expect(resultExplicit.min_lap_time).toBe(3.2);
  });

  it("should map themeId / theme_id from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r16" },
      name: "Themed Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      themeId: "practice_theme_rc_ai",
    };
    const result = RaceConverter.fromProto(mockProto);
    expect(result.theme_id).toBe("practice_theme_rc_ai");
  });
});
