import { calculateAverage, calculateMedian } from "src/app/utils/math";

import { Driver } from "./driver";

/**
 * Data for a driver in a specific heat.
 */
export class HeatDriver {
    readonly driver: Driver;

    private laps!: number[];

    // These are all updated by the addLapTime method.
    private _bestLapTime!: number;
    private _lastLapTime!: number;
    private _averageLapTime!: number;
    private _medianLapTime!: number;

    constructor(driver: Driver) {
        this.driver = driver;
        this.reset();
    }

    reset(): void {
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
        this._averageLapTime = calculateAverage(this.laps);
        this._medianLapTime = calculateMedian(this.laps);
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

    get lapCount(): number {
        return this.laps.length;
    }
}