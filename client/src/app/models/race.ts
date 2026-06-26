import { AnalogFuelOptions } from "./analog_fuel_options";
import { DigitalFuelOptions } from "./digital_fuel_options";
import { GroupOptions } from "./group_options";
import { HeatScoring } from "./heat_scoring";
import { Model } from "./model";
import { OverallScoring } from "./overall_scoring";
import { TeamOptions } from "./team_options";
import { Track } from "./track";

export class Race implements Model {
  readonly entity_id: string;
  readonly name: string;
  readonly track: Track;
  readonly heat_scoring: HeatScoring;
  readonly overall_scoring: OverallScoring;
  readonly fuel_options: AnalogFuelOptions;
  readonly digital_fuel_options: DigitalFuelOptions;
  readonly team_options: TeamOptions;
  readonly auto_advance_time: number;
  readonly auto_start_time: number;
  readonly auto_advance_warmup_time: number;
  readonly auto_start_warmup_time: number;
  readonly drift_time: number;
  readonly min_lap_time: number;
  readonly start_time: number;
  readonly restart_time: number;
  readonly start_randomizer: number;
  readonly restart_randomizer: number;
  readonly heat_times_through: number;
  readonly reverse_heats: boolean;
  readonly hot_start: boolean;
  readonly restart_on_false_start: boolean;
  readonly start_behind_sensor: boolean;
  readonly false_start_lap_penalty: number;
  readonly false_start_time_penalty: number;
  readonly group_options: GroupOptions;
  readonly practice: boolean;

  readonly heat_rotation_type: string;
  readonly solo_lane_index: number;
  readonly custom_rotation_sequence: number[];
  readonly customRotationSequence?: number[];
  readonly custom_rotation_asset_id?: string;
  readonly customRotationAssetId?: string;
  readonly custom_rotations: any[];
  readonly customRotations?: any[];

  constructor(
    entity_id: string,
    name: string,
    track: Track,
    heat_rotation_type: string = "RoundRobin",
    heat_scoring: HeatScoring = new HeatScoring(),
    overall_scoring: OverallScoring = new OverallScoring(),
    fuel_options: AnalogFuelOptions = new AnalogFuelOptions(),
    digital_fuel_options: DigitalFuelOptions = new DigitalFuelOptions(),
    team_options: TeamOptions = new TeamOptions(),
    auto_advance_time: number = 0,
    auto_start_time: number = 0,
    auto_advance_warmup_time: number = 0,
    auto_start_warmup_time: number = 0,
    drift_time: number = 0.5,
    min_lap_time: number = 1.5,
    start_time: number = 5.0,
    restart_time: number = 5.0,
    start_randomizer: number = 0.0,
    restart_randomizer: number = 0.0,
    solo_lane_index: number = 0,
    custom_rotation_sequence: number[] = [],
    custom_rotation_asset_id?: string,
    custom_rotations: any[] = [],
    heat_times_through: number = 1,
    reverse_heats: boolean = false,
    hot_start: boolean = false,
    restart_on_false_start: boolean = false,
    start_behind_sensor: boolean = true,
    false_start_lap_penalty: number = 0,
    false_start_time_penalty: number = 0,
    group_options: GroupOptions = new GroupOptions(),
    practice: boolean = false,
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.track = track;
    this.heat_rotation_type = heat_rotation_type;
    this.heat_scoring = heat_scoring;
    this.overall_scoring = overall_scoring;
    this.fuel_options = fuel_options;
    this.digital_fuel_options = digital_fuel_options;
    this.team_options = team_options;
    this.auto_advance_time = auto_advance_time;
    this.auto_start_time = auto_start_time;
    this.auto_advance_warmup_time = auto_advance_warmup_time;
    this.auto_start_warmup_time = auto_start_warmup_time;
    this.drift_time = drift_time;
    this.min_lap_time = min_lap_time;
    this.start_time = start_time;
    this.restart_time = restart_time;
    this.start_randomizer = start_randomizer;
    this.restart_randomizer = restart_randomizer;
    this.solo_lane_index = solo_lane_index;
    this.custom_rotation_sequence = custom_rotation_sequence;
    this.custom_rotation_asset_id = custom_rotation_asset_id;
    this.custom_rotations = custom_rotations;
    this.heat_times_through = heat_times_through;
    this.reverse_heats = reverse_heats;
    this.hot_start = hot_start;
    this.restart_on_false_start = restart_on_false_start;
    this.start_behind_sensor = start_behind_sensor;
    this.false_start_lap_penalty = false_start_lap_penalty;
    this.false_start_time_penalty = false_start_time_penalty;
    this.group_options = group_options;
    this.practice = practice;
  }

  get objectId(): string {
    return this.entity_id;
  }
}
