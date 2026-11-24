import { catchError, of } from "rxjs";
import { CarPickDriver } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { Car } from "@app/models/car";
import {
  CarChoice,
  cleanCarChoice,
  emptyCarChoice,
  hasAnyCar,
  toCarChoiceProto,
} from "@app/models/car-choice";
import { IParticipantCarChoice } from "@app/proto/antigravity";

import {
  getParticipantUniqueId,
  getTeam,
  isDriver,
  Participant,
} from "./raceday-setup-participant.helper";

/**
 * Slotcars in Race Day Setup (#1210): the cars from the Slotcar database, the
 * pick per roster entry (remembered in the settings, keyed by the d_/t_ id),
 * and what goes to the server at race start.
 */
export class RacedaySetupCarsHelper {
  static loadCars(host: any): void {
    const cars$ = host.dataService?.getCars?.();
    if (!cars$) return;
    cars$.pipe(catchError(() => of([]))).subscribe((list: any[]) => {
      host.allCars = (list || []).map((c: any) => Car.fromJSON(c));
      const stored = host.settingsService?.getSettings?.()?.selectedCarChoices;
      const choices: Record<string, CarChoice> = {};
      for (const [id, raw] of Object.entries(stored || {})) {
        const choice = cleanCarChoice(raw as Partial<CarChoice>, host.allCars);
        if (hasAnyCar(choice) || choice.carPerDriver) choices[id] = choice;
      }
      host.carChoices = choices;
      host.cdr?.detectChanges?.();
    });
  }

  static choiceFor(host: any, p: Participant): CarChoice {
    return host.carChoices?.[getParticipantUniqueId(p)] || emptyCarChoice();
  }

  /** The drivers of a team entry, for "a car per driver". Empty for a driver. */
  static teamDrivers(host: any, p: Participant): CarPickDriver[] {
    if (isDriver(p)) return [];
    const team = getTeam(p);
    return (team?.driverIds || [])
      .map((id: string) =>
        (host.allDrivers || []).find((d: any) => d.entity_id === id),
      )
      .filter(Boolean)
      .map((d: any) => ({ id: d.entity_id, name: d.name }));
  }

  /** The picked car name(s) shown on the roster row; "" for no car. */
  static summary(host: any, p: Participant): string {
    const choice = RacedaySetupCarsHelper.choiceFor(host, p);
    const name = (id: string) =>
      (host.allCars || []).find((c: Car) => c.entity_id === id)?.name;
    if (choice.carPerDriver) {
      const names = Object.values(choice.driverCars)
        .map(name)
        .filter(Boolean) as string[];
      return [...new Set(names)].join(" / ");
    }
    return name(choice.carId) || "";
  }

  static open(host: any, p: Participant, event?: Event): void {
    event?.stopPropagation();
    host.carPickTarget = p;
  }

  static save(host: any, choice: CarChoice): void {
    const p = host.carPickTarget;
    host.carPickTarget = null;
    if (!p) return;
    const id = getParticipantUniqueId(p);
    const next = { ...(host.carChoices || {}) };
    if (hasAnyCar(choice) || choice.carPerDriver) next[id] = choice;
    else delete next[id];
    host.carChoices = next;
    const settings = host.settingsService?.getSettings?.();
    if (settings) {
      settings.selectedCarChoices = next;
      host.settingsService.saveSettings(settings);
    }
  }

  /** The picks of the entries in the race, for InitializeRaceRequest. */
  static launchChoices(host: any): IParticipantCarChoice[] {
    return (host.selectedParticipants || [])
      .map((p: Participant) => {
        const id = getParticipantUniqueId(p);
        const choice = host.carChoices?.[id];
        return choice && hasAnyCar(choice)
          ? toCarChoiceProto(id, choice)
          : null;
      })
      .filter(Boolean) as IParticipantCarChoice[];
  }
}
