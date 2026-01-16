import { Lane } from "./lane";

/**
 * A track defines what the driver are racing on.  It has virtual things like a name
 * and logo which are primarly just used for displaying oon the race day screen.  It
 * also has the lane configuration which limits the number of drivers that can race
 * at the same time and it includes the hardware connected to the track that handles
 * everything from lap counting, to lane power and visual effects like led lights.
 */
export class Track {
    readonly name: string;
    readonly lanes: Lane[];

    constructor(name: string, lanes: Lane[]) {
        this.name = name;
        this.lanes = lanes;
    }
}