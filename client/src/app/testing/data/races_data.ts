import { AnalogFuelOptions } from "../../models/analog_fuel_options";
import { DigitalFuelOptions } from "../../models/digital_fuel_options";
import { FuelUsageType } from "../../models/fuel_options";
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
    },
    digital_fuel_options: {
      enabled: false,
      capacity: 100,
      usage_type: FuelUsageType.LINEAR,
      usage_rate: 4.0,
      start_level: 100,
      refuel_rate: 10,
      pit_stop_delay: 2.0,
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
    start_delay: 0.0,
    restart_delay: 0.0,
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
    start_delay: 0.0,
    restart_delay: 0.0,
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
    start_delay: 0.0,
    restart_delay: 0.0,
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
    false, // end_heat_on_out_of_fuel
    fo.capacity,
    fo.usage_type as FuelUsageType,
    fo.usage_rate,
    fo.start_level,
    fo.refuel_rate,
    fo.pit_stop_delay,
  );

  const df = r.digital_fuel_options || {};
  const digitalFuelOptions = new DigitalFuelOptions(
    df.enabled,
    false, // reset_fuel_at_heat_start
    false, // end_heat_on_out_of_fuel
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
    new Track(r.track_entity_id || "", "", []),
    heatScoring,
    overallScoring,
    fuelOptions,
    digitalFuelOptions,
    r.team_options,
    r.auto_advance_time ?? 0,
    r.auto_start_time ?? 0,
    r.auto_advance_warmup_time ?? 0,
    r.auto_start_warmup_time ?? 0,
    r.drift_time ?? 0.5,
    r.min_lap_time ?? 1.5,
    r.start_time ?? 5.0,
    r.restart_time ?? 5.0,
    r.start_delay ?? 0.0,
    r.restart_delay ?? 0.0,
  );
});
