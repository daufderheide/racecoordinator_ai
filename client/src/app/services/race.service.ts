import { Injectable } from '@angular/core';
import { Track } from '../models/track';
import { Driver } from '../models/driver';
import { Race } from '../models/race';
import { BehaviorSubject } from 'rxjs';
import { Heat } from '../race/heat';

@Injectable({
    providedIn: 'root'
})
export class RaceService {
    private racingDriversSubject = new BehaviorSubject<Driver[]>([]);
    racingDrivers$ = this.racingDriversSubject.asObservable();

    private selectedRaceSubject = new BehaviorSubject<Race | undefined>(undefined);
    selectedRace$ = this.selectedRaceSubject.asObservable();

    setRacingDrivers(drivers: Driver[]) {
        this.racingDriversSubject.next(drivers);
    }

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
    }

    getCurrentHeat(): Heat | undefined {
        return this.currentHeatSubject.getValue();
    }
}
