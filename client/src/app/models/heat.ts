import { HeatDriver } from "./heat_driver";

/**
 * A heat is a single time on the track for a race.  A race will include one or
 * more heats.  Each heat will have a finish order and the result of each heat
 * will be applied to the overall race standings based on how the race is
 * configured.
 */
export class Heat {
    readonly heatNumber: number;
    readonly heatDrivers: HeatDriver[];

    constructor(heatNumber: number, heatDrivers: HeatDriver[]) {
        this.heatNumber = heatNumber;
        this.heatDrivers = heatDrivers;
    }
}