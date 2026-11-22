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

  constructor(private allDrivers: () => Driver[]) {}

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
