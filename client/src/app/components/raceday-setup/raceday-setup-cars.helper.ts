import { catchError, of } from "rxjs";
import { CarPickDriver } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { LaneCarLane } from "@app/components/shared/lane-cars-dialog/lane-cars-dialog.component";
import { Car } from "@app/models/car";
import {
  CarChoice,
  choiceCarIds,
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
      host.laneCars = {
        ...(host.settingsService?.getSettings?.()?.selectedLaneCars || {}),
      };
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

  /**
   * The cars the other entries in the race already have (car id → entry
   * name). One car can't race for two entries (#1251), so the pick dialog
   * greys these out.
   */
  static takenBy(host: any, p: Participant): Record<string, string> {
    const me = getParticipantUniqueId(p);
    const taken: Record<string, string> = {};
    for (const other of host.selectedParticipants || []) {
      const id = getParticipantUniqueId(other);
      if (id === me) continue;
      for (const carId of choiceCarIds(host.carChoices?.[id])) {
        taken[carId] ??= host.getLocalizedName?.(other) ?? other.name ?? "";
      }
    }
    return taken;
  }

  /**
   * The other entry that has one of this entry's cars, or "" (a remembered
   * pick can clash once both entries are in the race).
   */
  static conflict(host: any, p: Participant): string {
    const taken = RacedaySetupCarsHelper.takenBy(host, p);
    const clash = choiceCarIds(RacedaySetupCarsHelper.choiceFor(host, p)).find(
      (carId) => taken[carId] !== undefined,
    );
    return clash ? taken[clash] : "";
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

  // ---- Cars stay in their lanes, IROC (step 4 of #1210) ----

  /** The selected race keeps its cars in the lanes and there are cars to pick. */
  static carsInLanes(host: any): boolean {
    return (
      (host.allCars?.length || 0) > 0 && !!host.selectedRace?.cars_stay_in_lanes
    );
  }

  /** The selected race's track: from the track list (races only name its id). */
  static raceTrack(host: any): any {
    const race = host.selectedRace;
    const id = race?.track_entity_id || race?.track?.entity_id;
    return (
      (host.tracks || []).find((t: any) => id && t.entity_id === id) ||
      race?.track
    );
  }

  /** The lanes of the selected race's track, with their colours. */
  static lanes(host: any): LaneCarLane[] {
    return (RacedaySetupCarsHelper.raceTrack(host)?.lanes || []).map(
      (l: any, lane: number) => ({ lane, color: l?.background_color || "" }),
    );
  }

  /** The car id per lane for the selected race's track ("" = none), known cars only. */
  static laneCarIds(host: any): string[] {
    const trackId = RacedaySetupCarsHelper.raceTrack(host)?.entity_id || "";
    const stored: string[] = host.laneCars?.[trackId] || [];
    const known = new Set((host.allCars || []).map((c: Car) => c.entity_id));
    return RacedaySetupCarsHelper.lanes(host).map((l) =>
      known.has(stored[l.lane]) ? stored[l.lane] : "",
    );
  }

  /** Remembers the lane cars per track, so the next race on it starts with them. */
  static saveLaneCars(host: any, ids: string[]): void {
    const trackId = RacedaySetupCarsHelper.raceTrack(host)?.entity_id;
    if (!trackId) return;
    const next = { ...(host.laneCars || {}) };
    if (ids.some(Boolean)) next[trackId] = [...ids];
    else delete next[trackId];
    host.laneCars = next;
    const settings = host.settingsService?.getSettings?.();
    if (settings) {
      settings.selectedLaneCars = next;
      host.settingsService.saveSettings(settings);
    }
  }

  /** The lane cars for InitializeRaceRequest; empty unless the cars stay in their lanes. */
  static launchLaneCarIds(host: any): string[] {
    if (!RacedaySetupCarsHelper.carsInLanes(host)) return [];
    const ids = RacedaySetupCarsHelper.laneCarIds(host);
    return ids.some(Boolean) ? ids : [];
  }

  /** The picks of the entries in the race, for InitializeRaceRequest. */
  static launchChoices(host: any): IParticipantCarChoice[] {
    // With the cars in their lanes the racers' own picks don't apply.
    if (RacedaySetupCarsHelper.carsInLanes(host)) return [];
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
