import { Model } from "./model";
import { Lane } from "./lane";

/**
 * A track defines what the driver are racing on.  It has virtual things like a name
 * and logo which are primarly just used for displaying oon the race day screen.  It
 * also has the lane configuration which limits the number of drivers that can race
 * at the same time and it includes the hardware connected to the track that handles
 * everything from lap counting, to lane power and visual effects like led lights.
 */
export class Track implements Model {
    readonly entity_id: string;
    readonly name: string;
    readonly lanes: Lane[];

    constructor(entity_id: string, name: string, lanes: Lane[]) {
        this.entity_id = entity_id;
        this.name = name;
        this.lanes = lanes;
    }

    get objectId(): string {
        return this.entity_id;
    }
}