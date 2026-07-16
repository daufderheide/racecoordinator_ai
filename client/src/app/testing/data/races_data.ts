import { AnalogFuelOptions } from "../../models/analog_fuel_options";
import { DigitalFuelOptions } from "../../models/digital_fuel_options";
import { FuelUsageType, OutOfFuelAction } from "../../models/fuel_options";
import {
  AllowFinish,
  FinishMethod,
  HeatRanking,
  HeatRankingTiebreaker,
  HeatScoring,
} from "../../models/heat_scoring";
import {
  OverallRanking,
  OverallRankingTiebreaker,
  OverallScoring,
} from "../../models/overall_scoring";
import { Race } from "../../models/race";
import { TeamOptions } from "../../models/team_options";
import { Track } from "../../models/track";

export const MOCK_RACES = [
  {
    entity_id: "r1",
    name: "Grand Prix",
    track_entity_id: "t1",
    heat_rotation_type: "RoundRobin",
    heat_scoring: {
      finish_method: "Lap",
      finish_value: 10,
      heat_ranking: "LAP_COUNT",
      heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
      allow_finish: "None",
    },
    overall_scoring: {
      dropped_heats: 0,
      ranking_method: "LAP_COUNT",
      tiebreaker: "FASTEST_LAP_TIME",
    },
    fuel_options: {
      enabled: false,
      capacity: 100,
      usage_type: FuelUsageType.LINEAR,
      usage_rate: 4.0,
      start_level: 100,
      refuel_rate: 10,
      pit_stop_delay: 2.0,
      reference_time: 6.0,
      out_of_fuel_action: OutOfFuelAction.POWER_STUTTER,
      power_stutter_on_time: 0.5,
      power_stutter_off_time: 1.5,
    },
    digital_fuel_options: {
      enabled: false,
      capacity: 100,
      usage_type: FuelUsageType.LINEAR,
      usage_rate: 4.0,
      start_level: 100,
      refuel_rate: 10,
      pit_stop_delay: 2.0,
      out_of_fuel_action: OutOfFuelAction.POWER_STUTTER,
    },
    team_options: {
      heat_lap_limit: 0,
      heat_time_limit: 0,
      overall_lap_limit: 0,
      overall_time_limit: 0,
      require_pit_stop_change_driver: false,
    },
    min_lap_time: 1.5,
    drift_time: 0.5,
    start_time: 5.0,
    restart_time: 5.0,
    start_randomizer: 0.0,
    restart_randomizer: 0.0,
  },
  {
    entity_id: "r2",
    name: "Endurance Challenge",
    track_entity_id: "t1",
    heat_rotation_type: "RoundRobin",
    heat_scoring: {
      finish_method: "Timed",
      finish_value: 300,
      heat_ranking: "LAP_COUNT",
      heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
      allow_finish: "None",
    },
    overall_scoring: {
      dropped_heats: 1,
      ranking_method: "LAP_COUNT",
      tiebreaker: "FASTEST_LAP_TIME",
    },
    min_lap_time: 1.5,
    drift_time: 0.5,
    start_time: 5.0,
    restart_time: 5.0,
    start_randomizer: 0.0,
    restart_randomizer: 0.0,
  },
  {
    entity_id: "r3",
    name: "Digital Sprint",
    track_entity_id: "t1",
    heat_rotation_type: "RoundRobin",
    heat_scoring: {
      finish_method: "Lap",
      finish_value: 5,
      heat_ranking: "LAP_COUNT",
      heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
      allow_finish: "None",
    },
    overall_scoring: {
      dropped_heats: 0,
      ranking_method: "LAP_COUNT",
      tiebreaker: "FASTEST_LAP_TIME",
    },
    min_lap_time: 1.5,
    drift_time: 0.5,
    start_time: 5.0,
    restart_time: 5.0,
    start_randomizer: 0.0,
    restart_randomizer: 0.0,
  },
];

export const MOCK_RACE_INSTANCES = MOCK_RACES.map((r: any) => {
  const hs = r.heat_scoring || {};
  const heatScoring = new HeatScoring(
    hs.finish_method as FinishMethod,
    hs.finish_value,
    hs.heat_ranking as HeatRanking,
    hs.heat_ranking_tiebreaker as HeatRankingTiebreaker,
    hs.allow_finish as AllowFinish,
  );

  const os = r.overall_scoring || {};
  const overallScoring = new OverallScoring(
    os.dropped_heats,
    os.ranking_method as OverallRanking,
    os.tiebreaker as OverallRankingTiebreaker,
  );

  const fo = r.fuel_options || {};
  const fuelOptions = new AnalogFuelOptions(
    fo.enabled,
    false, // reset_fuel_at_heat_start
    fo.out_of_fuel_action ?? OutOfFuelAction.DO_NOT_COUNT_LAPS, // out_of_fuel_action
    fo.capacity,
    fo.usage_type as FuelUsageType,
    fo.usage_rate,
    fo.start_level,
    fo.refuel_rate,
    fo.pit_stop_delay,
    fo.power_stutter_on_time,
    fo.power_stutter_off_time,
  );

  const df = r.digital_fuel_options || {};
  const digitalFuelOptions = new DigitalFuelOptions(
    df.enabled,
    false, // reset_fuel_at_heat_start
    df.out_of_fuel_action ?? OutOfFuelAction.DO_NOT_COUNT_LAPS, // out_of_fuel_action
    df.capacity,
    df.usage_type as FuelUsageType,
    df.usage_rate,
    df.start_level,
    df.refuel_rate,
    df.pit_stop_delay,
  );

  return new Race(
    r.entity_id,
    r.name,
    new Track({
      entity_id: r.track_entity_id || "",
      name: "",
      num_track_sections: 100,
      lanes: [],
    }),
    r.heat_rotation_type || "RoundRobin",
    heatScoring,
    overallScoring,
    fuelOptions,
    digitalFuelOptions,
    r.team_options || new TeamOptions(),
    r.auto_advance_time ?? 0,
    r.auto_start_time ?? 0,
    r.auto_advance_warmup_time ?? 0,
    r.auto_start_warmup_time ?? 0,
    r.drift_time ?? 0.5,
    r.min_lap_time ?? 1.5,
    r.start_time ?? 5.0,
    r.restart_time ?? 5.0,
    r.start_randomizer ?? 0.0,
    r.restart_randomizer ?? 0.0,
    r.solo_lane_index || 0,
    [], // custom_rotation_sequence
    undefined, // custom_rotation_asset_id
    [], // custom_rotations
    1, // heat_times_through
    false, // reverse_heats
    false, // hot_start
    false, // restart_on_false_start
    true, // start_behind_sensor
    0, // false_start_lap_penalty
    0, // false_start_time_penalty
    r.group_options || {
      enabled: false,
      max_groups: 2,
      balance: true,
      allow_empty_lanes: false,
      force_multiple_of_max: false,
      rotate_group_heats: false,
    },
  );
});
