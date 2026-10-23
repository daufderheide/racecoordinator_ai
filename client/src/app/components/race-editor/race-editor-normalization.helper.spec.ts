import { OutOfFuelAction } from "@app/models/fuel_options";
import { Theme } from "@app/models/theme";

import { RaceEditorNormalizationHelper } from "./race-editor-normalization.helper";

describe("RaceEditorNormalizationHelper", () => {
  describe("normalizeFuelOptions", () => {
    it("should return defaults when null or undefined", () => {
      const result = RaceEditorNormalizationHelper.normalizeFuelOptions(null);
      expect(result.enabled).toBeFalse();
      expect(result.capacity).toBe(100);
      expect(result.out_of_fuel_action).toBe(OutOfFuelAction.DO_NOT_COUNT_LAPS);
      expect(result.fastest_time).toBe(3.0);
      expect(result.max_usage).toBe(5.0);
    });

    it("should preserve existing properties and normalize times and rates", () => {
      const fuel = {
        enabled: true,
        reference_time: 10.0,
        usage_rate: 6.0,
        usage_type: "QUADRATIC",
        custom_curve: [{ x: 0, y: 1 }],
      };
      const result = RaceEditorNormalizationHelper.normalizeFuelOptions(fuel);
      expect(result.enabled).toBeTrue();
      expect(result.fastest_time).toBe(5.0); // 10 * 0.5
      expect(result.slowest_time).toBe(15.0); // 10 * 1.5
      expect(result.max_usage).toBe(24.0); // 6 * 4
    });

    it("should handle cubic fuel calculations", () => {
      const fuel = {
        reference_time: 8.0,
        usage_rate: 3.0,
        usage_type: "CUBIC",
      };
      const result = RaceEditorNormalizationHelper.normalizeFuelOptions(fuel);
      expect(result.max_usage).toBe(24.0); // 3 * 8
      expect(result.min_usage).toBe(0.89); // 3 * (8/27)
    });
  });

  describe("normalizeDigitalFuelOptions", () => {
    it("should return defaults when null or undefined", () => {
      const result =
        RaceEditorNormalizationHelper.normalizeDigitalFuelOptions(null);
      expect(result.enabled).toBeFalse();
      expect(result.capacity).toBe(100);
      expect(result.usage_rate).toBe(4.0);
      expect(result.custom_curve).toEqual([]);
    });

    it("should preserve digital options", () => {
      const digital = {
        enabled: true,
        capacity: 120,
        usage_rate: 5.5,
      };
      const result =
        RaceEditorNormalizationHelper.normalizeDigitalFuelOptions(digital);
      expect(result.enabled).toBeTrue();
      expect(result.capacity).toBe(120);
      expect(result.usage_rate).toBe(5.5);
    });
  });

  describe("normalizeHeatScoring", () => {
    it("should return defaults when null or undefined", () => {
      const result = RaceEditorNormalizationHelper.normalizeHeatScoring(null);
      expect(result.finish_method).toBe("Lap");
      expect(result.finish_value).toBe(10);
      expect(result.heat_ranking).toBe("LAP_COUNT");
      expect(result.allow_finish).toBe("None");
      expect(result.finishMethod).toBe("Lap");
    });

    it("should bridge snake_case and camelCase", () => {
      const hs = {
        finishMethod: "Timed",
        finishValue: 60,
        heatRanking: "FASTEST_LAP",
        heatRankingTiebreaker: "LAP_COUNT",
        allowFinish: "LeadLap",
      };
      const result = RaceEditorNormalizationHelper.normalizeHeatScoring(hs);
      expect(result.finish_method).toBe("Timed");
      expect(result.finish_value).toBe(60);
      expect(result.heat_ranking).toBe("FASTEST_LAP");
      expect(result.allow_finish).toBe("LeadLap");
    });
  });

  describe("normalizeRace", () => {
    it("should populate default options and select default theme if missing", () => {
      const themes: Theme[] = [
        { entity_id: "default_classic_rc_ai", is_default: true } as any,
        { entity_id: "dark_mode" } as any,
      ];
      const rawRace = {
        name: "Test Race",
      };
      const result = RaceEditorNormalizationHelper.normalizeRace(
        rawRace,
        themes,
      );
      expect(result.group_options).toBeDefined();
      expect(result.fuel_options).toBeDefined();
      expect(result.digital_fuel_options).toBeDefined();
      expect(result.team_options).toBeDefined();
      expect(result.heat_scoring).toBeDefined();
      expect(result.overall_scoring).toBeDefined();
      expect(result.season_scoring).toBeDefined();
      expect(result.theme_id).toBe("default_classic_rc_ai");
    });
  });

  describe("createDefaultRaceTemplate", () => {
    it("should create a complete default race template", () => {
      const template = RaceEditorNormalizationHelper.createDefaultRaceTemplate(
        "track-1",
        "theme-1",
      );
      expect(template.entity_id).toBe("new");
      expect(template.track_entity_id).toBe("track-1");
      expect(template.theme_id).toBe("theme-1");
      expect(template.min_lap_time).toBe(1.5);
      expect(template.heat_times_through).toBe(1);
      expect(template.season_scoring.position_points.length).toBe(10);
    });
  });

  describe("transformCustomRotationsToSnakeCase", () => {
    it("should transform camelCase rotation structures to snake_case", () => {
      const rotations = [
        {
          numDrivers: 4,
          heats: [{ driverIndices: [0, 1, 2, 3] }],
        },
      ];
      const result =
        RaceEditorNormalizationHelper.transformCustomRotationsToSnakeCase(
          rotations,
        );
      expect(result[0].num_drivers).toBe(4);
      expect(result[0].heats[0].driver_indices).toEqual([0, 1, 2, 3]);
    });
  });

  describe("buildRacePayload", () => {
    it("should clean up payload for persistence", () => {
      const race = {
        entity_id: "r1",
        name: "Grand Prix",
        track: { name: "Monaco" },
        heat_scoring: {
          finish_method: "Lap",
          allowFinish: "None",
        },
      };
      const payload = RaceEditorNormalizationHelper.buildRacePayload(race);
      expect(payload["@id"]).toBe(1);
      expect(payload.track).toBeUndefined();
      expect(payload.heat_scoring.allow_finish).toBe("None");
    });
  });
});
