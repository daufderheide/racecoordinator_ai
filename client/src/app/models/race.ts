import { Model } from "./model";
import { Track } from "./track";
import { HeatScoring } from "./heat_scoring";
import { OverallScoring } from "./overall_scoring";
import { AnalogFuelOptions } from "./analog_fuel_options";
import { DigitalFuelOptions } from "./digital_fuel_options";
import { TeamOptions } from "./team_options";

export class Race implements Model {
  readonly entity_id: string;
  readonly name: string;
  readonly track: Track;
  readonly heat_scoring: HeatScoring;
  readonly overall_scoring: OverallScoring;
  readonly fuel_options: AnalogFuelOptions;
  readonly digital_fuel_options: DigitalFuelOptions;
  readonly team_options: TeamOptions;

  constructor(
    entity_id: string,
    name: string,
    track: Track,
    heat_scoring: HeatScoring = new HeatScoring(),
    overall_scoring: OverallScoring = new OverallScoring(),
    fuel_options: AnalogFuelOptions = new AnalogFuelOptions(),
    digital_fuel_options: DigitalFuelOptions = new DigitalFuelOptions(),
    team_options: TeamOptions = new TeamOptions()
  ) {
    this.entity_id = entity_id;
    this.name = name;
    this.track = track;
    this.heat_scoring = heat_scoring;
    this.overall_scoring = overall_scoring;
    this.fuel_options = fuel_options;
    this.digital_fuel_options = digital_fuel_options;
    this.team_options = team_options;
  }

  get objectId(): string {
    return this.entity_id;
  }
}