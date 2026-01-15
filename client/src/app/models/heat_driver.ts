import { Driver } from "./driver";

export class HeatDriver {
    readonly driver: Driver;

    private laps: number[];

    private _bestLapTime: number;
    private _lastLapTime: number;
    private _averageLapTime: number;
    private _medianLapTime: number;

    constructor(driver: Driver) {
        this.driver = driver;
        this.laps = [];

        this._bestLapTime = 0;
        this._lastLapTime = 0;
        this._averageLapTime = 0;
        this._medianLapTime = 0;
    }

    addLapTime(lapTime: number): void {
        this.laps.push(lapTime);

        if (lapTime < this._bestLapTime || this._bestLapTime === 0) {
            this._bestLapTime = lapTime;
        }

        this._lastLapTime = lapTime;
        this._averageLapTime = this.laps.reduce((a, b) => a + b) / this.laps.length;
        this._medianLapTime = this.laps.sort((a, b) => a - b)[Math.floor(this.laps.length / 2)];
    }

    get bestLapTime(): number {
        return this._bestLapTime;
    }

    get lastLapTime(): number {
        return this._lastLapTime;
    }

    get averageLapTime(): number {
        return this._averageLapTime;
    }

    get medianLapTime(): number {
        return this._medianLapTime;
    }
}