import { LaneCarLane } from "@app/components/shared/lane-cars-dialog/lane-cars-dialog.component";

import { RacedaySetupCarsHelper } from "./raceday-setup-cars.helper";

/**
 * Race Day Setup, cars stay in their lanes (IROC, #1210): what the template
 * needs for the lane cars bar. The state (`laneCars`, by track id) lives on
 * the host, like the other slotcar picks.
 */
export class RacedaySetupLaneCars {
  constructor(private host: any) {}

  /** The selected race keeps its cars in the lanes and there are cars to pick. */
  active(): boolean {
    return RacedaySetupCarsHelper.carsInLanes(this.host);
  }

  lanes(): LaneCarLane[] {
    return RacedaySetupCarsHelper.lanes(this.host);
  }

  ids(): string[] {
    return RacedaySetupCarsHelper.laneCarIds(this.host);
  }

  save(ids: string[]): void {
    RacedaySetupCarsHelper.saveLaneCars(this.host, ids);
  }
}
