import { AnalogFuelOptions } from "./analog_fuel_options";
import { DigitalFuelOptions } from "./digital_fuel_options";
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
  readonly start_delay: number;
  readonly restart_delay: number;

  readonly heat_rotation_type: string;
  readonly solo_lane_index: number;

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
    start_delay: number = 0.0,
    restart_delay: number = 0.0,
    solo_lane_index: number = 0,
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
    this.start_delay = start_delay;
    this.restart_delay = restart_delay;
    this.solo_lane_index = solo_lane_index;
  }

  get objectId(): string {
    return this.entity_id;
  }
}
