import { catchError, of } from "rxjs";
import { CarPickDriver } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { Car } from "@app/models/car";
import {
  applyChoiceToParticipant,
  CarChoice,
  choiceFromParticipant,
  participantCarSummary,
  teamCarDrivers,
} from "@app/models/car-choice";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";

/**
 * Slotcars in Modify Heats (#1210): the cars from the Slotcar database and
 * the racer being picked for. A new car applies to the heats that haven't
 * run; the server keeps the car of heats that have.
 */
export class ModifyHeatsCars {
  allCars: Car[] = [];
  target: RaceParticipant | null = null;

  constructor(
    private allDrivers: () => Driver[],
    /** The race: with IROC the cars stay in their lanes, so racers have no car here. */
    private race: () => { cars_stay_in_lanes?: boolean } | undefined = () =>
      undefined,
  ) {}

  /** The car parts show when there are cars and the racers keep their own car. */
  get show(): boolean {
    return this.allCars.length > 0 && !this.race()?.cars_stay_in_lanes;
  }

  load(dataService: any): void {
    const cars$ = dataService?.getCars?.();
    if (!cars$) return;
    cars$.pipe(catchError(() => of([]))).subscribe((list: any[]) => {
      this.allCars = (list || []).map((c: any) => Car.fromJSON(c));
    });
  }

  summary(p: RaceParticipant): string {
    return participantCarSummary(p);
  }

  choiceFor(p: RaceParticipant | null): CarChoice {
    return choiceFromParticipant(p || undefined);
  }

  teamDrivers(p: RaceParticipant | null): CarPickDriver[] {
    return teamCarDrivers(p?.team?.driverIds, this.allDrivers());
  }

  open(p: RaceParticipant, event?: Event): void {
    event?.stopPropagation();
    this.target = p;
  }

  /** Puts the pick on the racer; true when something was picked for. */
  pick(choice: CarChoice): boolean {
    const p = this.target;
    this.target = null;
    if (!p) return false;
    applyChoiceToParticipant(p, choice, this.allCars);
    return true;
  }
}
