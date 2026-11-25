import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Car } from "@app/models/car";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Heat } from "@app/race/heat";

@Injectable({
  providedIn: "root",
})
export class RaceService {
  private racingDriversSubject = new BehaviorSubject<Driver[]>([]);
  racingDrivers$ = this.racingDriversSubject.asObservable();

  private participantsSubject = new BehaviorSubject<RaceParticipant[]>([]);
  participants$ = this.participantsSubject.asObservable();

  private groupParticipantsSubject = new BehaviorSubject<RaceParticipant[]>([]);
  groupParticipants$ = this.groupParticipantsSubject.asObservable();

  private currentGroupSubject = new BehaviorSubject<number>(0);
  currentGroup$ = this.currentGroupSubject.asObservable();

  setRacingDrivers(drivers: Driver[]) {
    this.racingDriversSubject.next(drivers);
  }

  setParticipants(participants: RaceParticipant[]) {
    this.participantsSubject.next(participants);
    // Also update drivers for compatibility
    this.setRacingDrivers(participants.map((p) => p.driver));
  }

  setGroupParticipants(participants: RaceParticipant[], group: number) {
    this.groupParticipantsSubject.next(participants);
    this.currentGroupSubject.next(group);
  }

  getParticipants(): RaceParticipant[] {
    return this.participantsSubject.getValue();
  }

  private selectedRaceSubject = new BehaviorSubject<Race | undefined>(
    undefined,
  );
  selectedRace$ = this.selectedRaceSubject.asObservable();

  private hasOpenedLaneSelectionForRaceStart = false;
  private lastLaneSelectionHeatNumber = -1;
  private lastLaneSelectionStepNumber = -1;
  private openedLaneSelectionSteps = new Set<number>();

  hasOpenedLaneSelection(
    type: "RACE_START" | "HEAT_START" | "STEP_START",
    value?: number,
  ): boolean {
    if (type === "RACE_START") {
      return this.hasOpenedLaneSelectionForRaceStart;
    }
    if (type === "HEAT_START") {
      return this.lastLaneSelectionHeatNumber === value;
    }
    if (type === "STEP_START") {
      return value != null
        ? this.openedLaneSelectionSteps.has(value)
        : this.lastLaneSelectionStepNumber !== -1;
    }
    return false;
  }

  recordLaneSelectionOpened(
    type: "RACE_START" | "HEAT_START" | "STEP_START",
    value?: number,
  ): void {
    if (type === "RACE_START") {
      this.hasOpenedLaneSelectionForRaceStart = true;
    } else if (type === "HEAT_START") {
      this.lastLaneSelectionHeatNumber = value ?? -1;
    } else if (type === "STEP_START") {
      this.lastLaneSelectionStepNumber = value ?? -1;
      if (value != null) {
        this.openedLaneSelectionSteps.add(value);
      }
    }
  }

  resetLaneSelectionTracking(): void {
    this.hasOpenedLaneSelectionForRaceStart = false;
    this.lastLaneSelectionHeatNumber = -1;
    this.lastLaneSelectionStepNumber = -1;
    this.openedLaneSelectionSteps.clear();
  }

  getRacingDrivers(): Driver[] {
    return this.racingDriversSubject.getValue();
  }

  setRace(race: Race) {
    const current = this.selectedRaceSubject.getValue();
    if (!current || (race && current.entity_id !== race.entity_id)) {
      this.resetLaneSelectionTracking();
    }
    this.selectedRaceSubject.next(race);
  }

  getRace(): Race | undefined {
    return this.selectedRaceSubject.getValue();
  }

  private heatsSubject = new BehaviorSubject<Heat[]>([]);
  heats$ = this.heatsSubject.asObservable();

  setHeats(heats: Heat[]) {
    this.heatsSubject.next(heats);
  }

  getHeats(): Heat[] {
    return this.heatsSubject.getValue();
  }

  /** Cars stay in their lanes (#1210): the car on each lane right now, by lane index. */
  private laneCarsSubject = new BehaviorSubject<(Car | undefined)[]>([]);
  laneCars$ = this.laneCarsSubject.asObservable();

  setLaneCars(cars: (Car | undefined)[]) {
    this.laneCarsSubject.next(cars);
  }

  getLaneCars(): (Car | undefined)[] {
    return this.laneCarsSubject.getValue();
  }

  private currentHeatSubject = new BehaviorSubject<Heat | undefined>(undefined);
  currentHeat$ = this.currentHeatSubject.asObservable();

  setCurrentHeat(heat: Heat) {
    this.currentHeatSubject.next(heat);
    const heats = this.getHeats();
    if (heats && heats.length > 0) {
      const existing = heats.find(
        (h) =>
          (h.objectId && heat.objectId && h.objectId === heat.objectId) ||
          h.heatNumber === heat.heatNumber,
      );
      if (existing) {
        existing.started = heat.started;
        existing.heatDrivers = heat.heatDrivers;
        existing.group = heat.group;
        existing.heatNumber = heat.heatNumber;
        this.setHeats([...heats]);
      }
    }
  }

  getCurrentHeat(): Heat | undefined {
    return this.currentHeatSubject.getValue();
  }

  clear() {
    this.resetLaneSelectionTracking();
    this.racingDriversSubject.next([]);
    this.participantsSubject.next([]);
    this.groupParticipantsSubject.next([]);
    this.currentGroupSubject.next(0);
    this.selectedRaceSubject.next(undefined);
    this.heatsSubject.next([]);
    this.currentHeatSubject.next(undefined);
  }
}
