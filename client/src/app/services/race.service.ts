import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
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

  getRacingDrivers(): Driver[] {
    return this.racingDriversSubject.getValue();
  }

  setRace(race: Race) {
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

  private currentHeatSubject = new BehaviorSubject<Heat | undefined>(undefined);
  currentHeat$ = this.currentHeatSubject.asObservable();

  setCurrentHeat(heat: Heat) {
    this.currentHeatSubject.next(heat);
    const heats = this.getHeats();
    if (heats && heats.length > 0) {
      const existing = heats.find((h) => h.objectId === heat.objectId);
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
    this.racingDriversSubject.next([]);
    this.participantsSubject.next([]);
    this.groupParticipantsSubject.next([]);
    this.currentGroupSubject.next(0);
    this.selectedRaceSubject.next(undefined);
    this.heatsSubject.next([]);
    this.currentHeatSubject.next(undefined);
  }
}
