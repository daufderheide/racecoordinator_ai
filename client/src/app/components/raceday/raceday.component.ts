import { Component } from '@angular/core';
import { Heat } from 'src/app/models/heat';
import { HeatDriver } from 'src/app/models/heat_driver';
import { Driver } from 'src/app/models/driver';
import { Track } from 'src/app/models/track';
import { Lane } from 'src/app/models/lane';

@Component({
    selector: 'app-raceday',
    templateUrl: './raceday.component.html',
    styleUrls: ['./raceday.component.css'],
    standalone: false
})
export class RacedayComponent {
    heat: Heat;
    track: Track;

    constructor() {
        this.track = new Track('Bright Plume Raceway', [
            new Lane('black', '#ef4444', 100),
            new Lane('black', '#ffffff', 100),
            new Lane('black', '#3b82f6', 100),
            new Lane('black', '#fbbf24', 100),
        ]);
        const drivers = [
            new HeatDriver(new Driver('Driver 1')),
            new HeatDriver(new Driver('Driver 2')),
            new HeatDriver(new Driver('Driver 3')),
            new HeatDriver(new Driver('Driver 4')),
        ];
        drivers[0].addLapTime(0.987654321);
        drivers[1].addLapTime(1.111);
        drivers[2].addLapTime(2.222);
        drivers[3].addLapTime(3.333);

        this.heat = new Heat(1, drivers);
    }
}
