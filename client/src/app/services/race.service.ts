import { Injectable } from '@angular/core';
import { Driver } from '../models/driver';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RaceService {
    private racingDriversSubject = new BehaviorSubject<Driver[]>([]);
    racingDrivers$ = this.racingDriversSubject.asObservable();

    setRacingDrivers(drivers: Driver[]) {
        this.racingDriversSubject.next(drivers);
    }

    getRacingDrivers(): Driver[] {
        return this.racingDriversSubject.getValue();
    }
}
