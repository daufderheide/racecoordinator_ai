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

    private trackSubject = new BehaviorSubject<Track | undefined>(undefined);
    track$ = this.trackSubject.asObservable();

    private selectedRaceSubject = new BehaviorSubject<Race | undefined>(undefined);
    selectedRace$ = this.selectedRaceSubject.asObservable();

    setRacingDrivers(drivers: Driver[]) {
        this.racingDriversSubject.next(drivers);
    }

    getRacingDrivers(): Driver[] {
        return this.racingDriversSubject.getValue();
    }

    setTrack(track: Track) {
        this.trackSubject.next(track);
    }

    getTrack(): Track | undefined {
        return this.trackSubject.getValue();
    }

    setRace(race: Race) {
        this.selectedRaceSubject.next(race);
    }

    getRace(): Race | undefined {
        return this.selectedRaceSubject.getValue();
    }
}
