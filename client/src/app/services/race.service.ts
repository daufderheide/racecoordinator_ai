import { Injectable } from '@angular/core';
import { Track } from '../models/track';
import { Driver } from '../models/driver';
import { Race } from '../models/race';
import { BehaviorSubject } from 'rxjs';

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

    private heatsSubject = new BehaviorSubject<any[]>([]);
    heats$ = this.heatsSubject.asObservable();

    setHeats(heats: any[]) {
        this.heatsSubject.next(heats);
    }

    getHeats(): any[] {
        return this.heatsSubject.getValue();
    }
}
