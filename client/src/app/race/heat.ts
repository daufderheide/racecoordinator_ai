import { DriverHeatData } from "./driver_heat_data";

/**
 * A heat is a single time on the track for a race.  A race will include one or
 * more heats.  Each heat will have a finish order and the result of each heat
 * will be applied to the overall race standings based on how the race is
 * configured.
 */
export class Heat {
  readonly objectId: string;
  heatNumber: number;
  heatDrivers: DriverHeatData[];
  readonly standings: string[];
  started: boolean = false;
  group: number = 0;
  masterTrackCalls?: number = 0;
  trackCalls?: number = 0;

  constructor(
    objectId: string,
    heatNumber: number,
    heatDrivers: DriverHeatData[],
    standings: string[] = [],
    started: boolean = false,
  ) {
    this.objectId = objectId;
    this.heatNumber = heatNumber;
    this.heatDrivers = heatDrivers;
    this.standings = standings;
    this.started = started;
  }
}
