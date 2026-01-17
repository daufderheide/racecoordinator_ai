import { Model } from "./model";

/**
 * A lane is a track position that a driver can occupy.  For digital races,
 * each lane is effectively the car id the driver should use if asigned to
 * race in that lane.
 */
export class Lane implements Model {
    readonly entity_id: string;
    readonly foreground_color: string;
    readonly background_color: string;
    readonly length: number;

    constructor(entity_id: string, foreground_color: string, background_color: string, length: number) {
        this.entity_id = entity_id;
        this.foreground_color = foreground_color;
        this.background_color = background_color;
        this.length = length;
    }
}