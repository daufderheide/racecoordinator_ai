import { CarPickDriver } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { CarChoice, emptyCarChoice } from "@app/models/car-choice";

import { RacedaySetupCarsHelper } from "./raceday-setup-cars.helper";
import { Participant } from "./raceday-setup-participant.helper";

/**
 * Race Day Setup, the car pick per racer (#1210, #1251): what the template
 * needs for the pick dialog and the car line on a roster row. The state
 * (`carChoices`, `carPickTarget`) lives on the host.
 */
export class RacedaySetupCarPick {
  constructor(private host: any) {}

  /** The pick of the entry the dialog is open for. */
  choice(): CarChoice {
    const p = this.host.carPickTarget;
    return p
      ? RacedaySetupCarsHelper.choiceFor(this.host, p)
      : emptyCarChoice();
  }

  /** The drivers of the team the dialog is open for; empty for a driver. */
  teamDrivers(): CarPickDriver[] {
    const p = this.host.carPickTarget;
    return p ? RacedaySetupCarsHelper.teamDrivers(this.host, p) : [];
  }

  /** The cars the other entries in the race have (car id → entry name). */
  taken(): Record<string, string> {
    const p = this.host.carPickTarget;
    return p ? RacedaySetupCarsHelper.takenBy(this.host, p) : {};
  }

  /** The other entry that has one of this entry's cars, or "". */
  conflict(p: Participant): string {
    return RacedaySetupCarsHelper.conflict(this.host, p);
  }
}
