import { HeatDriver } from "./heat_driver";

/**
 * A heat is a single time on the track for a race.  Each heat a driver participates
 * in constitutes that drivers entire race.  Because slot car races often have more
 * drivers than can be on the track at a single time, or want to do things like 
 * have each driver drive in each lane, a race is usually broken down into several
 * heats with drivers rotating on/off the track and into different lanes.
 */
export class Heat {
    readonly heatNumber: number;
    readonly heatDrivers: HeatDriver[];

    constructor(heatNumber: number, heatDrivers: HeatDriver[]) {
        this.heatNumber = heatNumber;
        this.heatDrivers = heatDrivers;
    }
}