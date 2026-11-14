// Force refresh for unit tests
import { IRaceModel } from "@app/proto/antigravity";

import {
  OverallRanking,
  OverallRankingTiebreaker,
} from "../models/overall_scoring";
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

  it("should map step_up from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r-stepup" },
      name: "Test Step Up Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      stepUp: 2,
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.step_up).toBe(2);
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

  it("should map allowFinish from proto enum values including SingleLapAutoSegments", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r17" },
      name: "Auto Segments Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatScoring: {
        finishMethod: 1,
        finishValue: 60,
        allowFinish: 4, // AF_SINGLE_LAP_AUTO_SEGMENTS
      },
    };
    const result = RaceConverter.fromProto(mockProto);
    expect(result.heat_scoring.allowFinish).toBe("SingleLapAutoSegments");
  });

  it("should preserve custom and 0 startTime and restartTime without falling back to 5.0", () => {
    const mockProtoZero: IRaceModel = {
      model: { entityId: "r18" },
      name: "Zero Countdown Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      startTime: 0,
      restartTime: 0,
    };
    const resultZero = RaceConverter.fromProto(mockProtoZero);
    expect(resultZero.start_time).toBe(0);
    expect(resultZero.restart_time).toBe(0);

    const mockProtoCustom: IRaceModel = {
      model: { entityId: "r19" },
      name: "3s Countdown Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      startTime: 3.0,
      restartTime: 2.0,
    };
    const resultCustom = RaceConverter.fromProto(mockProtoCustom);
    expect(resultCustom.start_time).toBe(3.0);
    expect(resultCustom.restart_time).toBe(2.0);
  });

  it("should map custom rotation asset name when provided as customRotationAssetName or custom_rotation_asset_name", () => {
    const mockProto: any = {
      model: { entityId: "r20" },
      name: "Custom Rotation Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      customRotationAssetName: "Llany Rotations",
    };
    const result = RaceConverter.fromProto(mockProto);
    expect(result.custom_rotation_asset_id).toBe("Llany Rotations");
    expect(result.custom_rotation_asset_name).toBe("Llany Rotations");
  });

  it("should map heatRankingTiebreaker enum values correctly", () => {
    const makeProto = (tiebreaker: number): IRaceModel => ({
      model: { entityId: "r21" },
      name: "Tiebreaker Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      heatScoring: {
        finishMethod: 1,
        finishValue: 10,
        heatRanking: 2, // FASTEST_LAP
        heatRankingTiebreaker: tiebreaker,
      },
    });

    expect(
      RaceConverter.fromProto(makeProto(0)).heat_scoring.heatRankingTiebreaker,
    ).toBe("FASTEST_LAP_TIME");
    expect(
      RaceConverter.fromProto(makeProto(1)).heat_scoring.heatRankingTiebreaker,
    ).toBe("MEDIAN_LAP_TIME");
    expect(
      RaceConverter.fromProto(makeProto(2)).heat_scoring.heatRankingTiebreaker,
    ).toBe("AVERAGE_LAP_TIME");
    expect(
      RaceConverter.fromProto(makeProto(3)).heat_scoring.heatRankingTiebreaker,
    ).toBe("FIRST_TO_SET_TIME");
    expect(
      RaceConverter.fromProto(makeProto(4)).heat_scoring.heatRankingTiebreaker,
    ).toBe("SECOND_BEST_LAP_TIME");
  });

  it("should map points scoring and POINTS overall ranking from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r22" },
      name: "Points Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      overallScoring: {
        rankingMethod: 4, // OR_POINTS
        tiebreaker: 4, // ORT_LAP_COUNT
        droppedHeats: 1,
      },
      pointsScoring: {
        positionPoints: [10, 8, 6, 5],
        heatPositionPoints: [3, 2, 1],
        heatCarryOverPct: 50,
        heatBonusFastestLap: 1,
        heatBonusLedLap: 0.5,
        heatBonusMostLapsLed: 2,
        heatOneBonusPerDriver: true,
        overallBonusFastestLap: 2,
        overallBonusFastestLapPerLane: 1,
        overallBonusLedLap: 0.5,
        overallBonusMostLapsLed: 3,
        overallOneBonusPerDriver: false,
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.overall_scoring.rankingMethod).toBe(OverallRanking.OR_POINTS);
    expect(result.overall_scoring.tiebreaker).toBe(
      OverallRankingTiebreaker.ORT_LAP_COUNT,
    );
    expect(result.overall_scoring.droppedHeats).toBe(1);

    expect(result.points_scoring).toBeDefined();
    expect(result.points_scoring!.position_points).toEqual([10, 8, 6, 5]);
    expect(result.points_scoring!.heat_position_points).toEqual([3, 2, 1]);
    expect(result.points_scoring!.heat_carry_over_pct).toBe(50);
    expect(result.points_scoring!.heat_bonus_fastest_lap).toBe(1);
    expect(result.points_scoring!.heat_bonus_led_lap).toBe(0.5);
    expect(result.points_scoring!.heat_bonus_most_laps_led).toBe(2);
    expect(result.points_scoring!.heat_one_bonus_per_driver).toBeTrue();
    expect(result.points_scoring!.overall_bonus_fastest_lap).toBe(2);
    expect(result.points_scoring!.overall_bonus_fastest_lap_per_lane).toBe(1);
    expect(result.points_scoring!.overall_bonus_led_lap).toBe(0.5);
    expect(result.points_scoring!.overall_bonus_most_laps_led).toBe(3);
    expect(result.points_scoring!.overall_one_bonus_per_driver).toBeFalse();
  });

  it("should handle missing points scoring gracefully in fromProto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r23" },
      name: "Standard Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.points_scoring).toBeUndefined();
  });

  it("should map crash and learn options from proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r24" },
      name: "CNL Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
      crashAndLearnOptions: {
        enabled: true,
        automatedCrashTime: 12.5,
        maxCrashes: 4,
        pauseHeatOnCrash: true,
        allowMultipleCrashesPerLap: false,
        resetCrashesEachHeat: true,
        resetDqEachHeat: false,
        heatCrashLapPenalty: 1.0,
        heatTimePenalty: 5.0,
        dqHeatScorePercentage: 75.0,
      },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.crash_and_learn_options).toBeDefined();
    expect(result.crash_and_learn_options.enabled).toBeTrue();
    expect(result.crash_and_learn_options.automated_crash_time).toBe(12.5);
    expect(result.crash_and_learn_options.max_crashes).toBe(4);
    expect(result.crash_and_learn_options.pause_heat_on_crash).toBeTrue();
    expect(
      result.crash_and_learn_options.allow_multiple_crashes_per_lap,
    ).toBeFalse();
    expect(result.crash_and_learn_options.reset_crashes_each_heat).toBeTrue();
    expect(result.crash_and_learn_options.reset_dq_each_heat).toBeFalse();
    expect(result.crash_and_learn_options.heat_crash_lap_penalty).toBe(1.0);
    expect(result.crash_and_learn_options.heat_time_penalty).toBe(5.0);
    expect(result.crash_and_learn_options.dq_heat_score_percentage).toBe(75.0);
  });

  it("should provide default crash and learn options when missing in proto", () => {
    const mockProto: IRaceModel = {
      model: { entityId: "r25" },
      name: "Default CNL Race",
      track: { model: { entityId: "t1" }, name: "Track", lanes: [] },
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.crash_and_learn_options).toBeDefined();
    expect(result.crash_and_learn_options.enabled).toBeFalse();
    expect(result.crash_and_learn_options.max_crashes).toBe(3);
    expect(result.crash_and_learn_options.pause_heat_on_crash).toBeTrue();
    expect(
      result.crash_and_learn_options.allow_multiple_crashes_per_lap,
    ).toBeTrue();
    expect(result.crash_and_learn_options.reset_crashes_each_heat).toBeTrue();
    expect(result.crash_and_learn_options.reset_dq_each_heat).toBeTrue();
    expect(result.crash_and_learn_options.dq_heat_score_percentage).toBe(100.0);
  });
});
