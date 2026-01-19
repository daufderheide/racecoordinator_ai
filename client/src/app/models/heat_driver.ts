

import { RaceParticipant } from "./race-participant";
import { Driver } from "./driver";

/**
 * Data for a driver in a specific heat.
 */
export class HeatDriver {
    readonly participant: RaceParticipant;

    private laps!: number[];

    // These are all updated by the addLapTime method.
    private _bestLapTime!: number;
    private _lastLapTime!: number;
    private _averageLapTime!: number;
    private _medianLapTime!: number;

    constructor(participant: RaceParticipant) {
        this.participant = participant;
        this.reset();
    }

    get driver(): Driver {
        return this.participant.driver;
    }

    reset(): void {
        this.laps = [];

        this._bestLapTime = 0;
        this._lastLapTime = 0;
        this._averageLapTime = 0;
        this._medianLapTime = 0;
    }

    addLapTime(lapNumber: number, lapTime: number, averageLapTime: number, medianLapTime: number, bestLapTime: number): void {
        const lapIndex = lapNumber - 1;

        // Fill missing laps with 0
        while (this.laps.length < lapIndex) {
            this.laps.push(0);
        }

        // Store or update the lap time
        if (this.laps.length <= lapIndex) {
            this.laps.push(lapTime);
        } else {
            this.laps[lapIndex] = lapTime;
        }

        this._bestLapTime = bestLapTime;
        this._averageLapTime = averageLapTime;
        this._medianLapTime = medianLapTime;

        // Only update lastLapTime if we just updated the latest lap
        if (lapIndex === this.laps.length - 1) {
            this._lastLapTime = lapTime;
        }
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