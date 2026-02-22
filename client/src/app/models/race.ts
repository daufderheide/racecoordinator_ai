import { Model } from "./model";
import { Track } from "./track";
import { HeatScoring } from "./heat_scoring";
import { OverallScoring } from "./overall_scoring";
import { AnalogFuelOptions } from "./analog_fuel_options";

export class Race implements Model {
    readonly entity_id: string;
    readonly name: string;
    readonly track: Track;
    readonly heat_scoring: HeatScoring;
    readonly overall_scoring: OverallScoring;
    readonly fuel_options: AnalogFuelOptions;

    constructor(
        entity_id: string,
        name: string,
        track: Track,
        heat_scoring: HeatScoring = new HeatScoring(),
        overall_scoring: OverallScoring = new OverallScoring(),
        fuel_options: AnalogFuelOptions = new AnalogFuelOptions()
    ) {
        this.entity_id = entity_id;
        this.name = name;
        this.track = track;
        this.heat_scoring = heat_scoring;
        this.overall_scoring = overall_scoring;
        this.fuel_options = fuel_options;
    }

    get objectId(): string {
        return this.entity_id;
    }
}