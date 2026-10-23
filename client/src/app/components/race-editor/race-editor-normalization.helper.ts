import { FuelUsageType, OutOfFuelAction } from "@app/models/fuel_options";
import { Theme } from "@app/models/theme";
import { deepCopy } from "@app/utils/clone.utils";

export class RaceEditorNormalizationHelper {
  static normalizeFuelOptions(fuel: any): any {
    if (!fuel) {
      return {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        fastest_time: 3.0,
        max_usage: 5.0,
        slowest_time: 9.0,
        min_usage: 3.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        power_stutter_on_time: 1.0,
        power_stutter_off_time: 1.0,
        custom_curve: [],
      };
    }
    return {
      ...fuel,
      custom_curve: fuel.custom_curve || [],
      fastest_time:
        Number(fuel.fastest_time) ||
        Number((Number(fuel.reference_time || 6.0) * 0.5).toFixed(2)),
      max_usage:
        Number(fuel.max_usage) ||
        (fuel.usage_type === "QUADRATIC"
          ? Number((Number(fuel.usage_rate || 4.0) * 4.0).toFixed(2))
          : fuel.usage_type === "CUBIC"
            ? Number((Number(fuel.usage_rate || 4.0) * 8.0).toFixed(2))
            : Number((Number(fuel.usage_rate || 4.0) * 1.25).toFixed(2))),
      slowest_time:
        Number(fuel.slowest_time) ||
        Number((Number(fuel.reference_time || 6.0) * 1.5).toFixed(2)),
      min_usage:
        Number(fuel.min_usage) ||
        (fuel.usage_type === "QUADRATIC"
          ? Number((Number(fuel.usage_rate || 4.0) * (4.0 / 9.0)).toFixed(2))
          : fuel.usage_type === "CUBIC"
            ? Number((Number(fuel.usage_rate || 4.0) * (8.0 / 27.0)).toFixed(2))
            : Number((Number(fuel.usage_rate || 4.0) * 0.75).toFixed(2))),
    };
  }

  static normalizeDigitalFuelOptions(digitalFuel: any): any {
    if (!digitalFuel) {
      return {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        custom_curve: [],
      };
    }
    return {
      ...digitalFuel,
      custom_curve: digitalFuel.custom_curve || [],
    };
  }

  static normalizeHeatScoring(heatScoring: any): any {
    if (!heatScoring) {
      return {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
        finishMethod: "Lap",
        finishValue: 10,
        heatRanking: "LAP_COUNT",
        heatRankingTiebreaker: "FASTEST_LAP_TIME",
        allowFinish: "None",
      };
    }
    const finishMethod =
      heatScoring.finish_method ?? heatScoring.finishMethod ?? "Lap";
    const finishValue =
      heatScoring.finish_value ?? heatScoring.finishValue ?? 10;
    const heatRanking =
      heatScoring.heat_ranking ?? heatScoring.heatRanking ?? "LAP_COUNT";
    const heatRankingTiebreaker =
      heatScoring.heat_ranking_tiebreaker ??
      heatScoring.heatRankingTiebreaker ??
      "FASTEST_LAP_TIME";
    const allowFinish =
      heatScoring.allow_finish ?? heatScoring.allowFinish ?? "None";

    return {
      ...deepCopy(heatScoring),
      finish_method: finishMethod,
      finish_value: finishValue,
      heat_ranking: heatRanking,
      heat_ranking_tiebreaker: heatRankingTiebreaker,
      allow_finish: allowFinish,
      finishMethod: finishMethod,
      finishValue: finishValue,
      heatRanking: heatRanking,
      heatRankingTiebreaker: heatRankingTiebreaker,
      allowFinish: allowFinish,
    };
  }

  static normalizeRace(race: any, themes: Theme[]): any {
    const normalized = {
      ...deepCopy(race),
      group_options: race.group_options || {
        enabled: false,
        max_groups: 2,
        balance: true,
        allow_empty_lanes: false,
        force_multiple_of_max: false,
        rotate_group_heats: false,
        min_advancing: 0,
      },
      fuel_options: this.normalizeFuelOptions(race.fuel_options),
      digital_fuel_options: this.normalizeDigitalFuelOptions(
        race.digital_fuel_options,
      ),
      team_options: race.team_options || {
        heat_lap_limit: 0,
        heat_time_limit: 0.0,
        overall_lap_limit: 0,
        overall_time_limit: 0.0,
        require_pit_stop_change_driver: false,
      },
      heat_scoring: this.normalizeHeatScoring(
        race.heat_scoring || race.heatScoring,
      ),
      overall_scoring: race.overall_scoring || {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      season_scoring: race.season_scoring || {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [3, 2, 1, 0],
      },
      custom_rotation_sequence: race.custom_rotation_sequence || [],
      custom_rotations: race.custom_rotations || [],
    };

    if (!normalized.theme_id && themes.length > 0) {
      const defaultTheme =
        themes.find(
          (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
        ) || themes[0];
      normalized.theme_id = defaultTheme.entity_id;
    }

    return normalized;
  }

  static createDefaultRaceTemplate(trackId: string, themeId: string): any {
    return {
      entity_id: "new",
      name: "",
      track_entity_id: trackId,
      theme_id: themeId,
      heat_rotation_type: "RoundRobin",
      heat_scoring: this.normalizeHeatScoring(null),
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        fastest_time: 3.0,
        max_usage: 5.0,
        slowest_time: 9.0,
        min_usage: 3.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        custom_curve: [],
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
        custom_curve: [],
      },
      min_lap_time: 1.5,
      drift_time: 0.5,
      start_time: 5.0,
      restart_time: 5.0,
      start_randomizer: 0.0,
      restart_randomizer: 0.0,
      solo_lane_index: 0,
      custom_rotation_sequence: [],
      custom_rotations: [],
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
      heat_times_through: 1,
      reverse_heats: false,
      hot_start: false,
      restart_on_false_start: false,
      start_behind_sensor: true,
      start_at_current: false,
      false_start_lap_penalty: 0,
      false_start_time_penalty: 0,
      adjust_drift_laps: false,
      group_options: {
        enabled: false,
        max_groups: 2,
        balance: true,
        allow_empty_lanes: false,
        force_multiple_of_max: false,
        rotate_group_heats: false,
        min_advancing: 0,
      },
      season_scoring: {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [3, 2, 1, 0],
      },
    };
  }

  static transformCustomRotationsToSnakeCase(rotations: any[]): any[] {
    return (rotations || []).map((rot) => ({
      num_drivers: rot.numDrivers ?? rot.num_drivers,
      heats: (rot.heats || []).map((h: any) => ({
        driver_indices: h.driverIndices ?? h.driver_indices,
      })),
    }));
  }

  static buildRacePayload(race: any): any {
    const payload = deepCopy(race);
    payload["@id"] = 1;
    delete payload.track;
    if (payload.heat_scoring) {
      const allowFinish =
        payload.heat_scoring.allow_finish ?? payload.heat_scoring.allowFinish;
      payload.heat_scoring.allow_finish = allowFinish;
      payload.heat_scoring.allowFinish = allowFinish;
    }
    return payload;
  }
}
