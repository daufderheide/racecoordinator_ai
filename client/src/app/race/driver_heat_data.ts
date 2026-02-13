

import { RaceParticipant } from "./race_participant";
import { Driver } from "../models/driver";

/**
 * Data for a driver in a specific heat.
 */
export class DriverHeatData {
    readonly laneIndex: number;
    readonly objectId: string;
    readonly participant: RaceParticipant;

    private laps!: number[];

    // These are all updated by the addLapTime method.
    private _bestLapTime!: number;
    private _lastLapTime!: number;
    private _averageLapTime!: number;
    private _medianLapTime!: number;
    private _reactionTime: number = 0;

    constructor(objectId: string, participant: RaceParticipant, laneIndex: number) {
        this.objectId = objectId;
        this.participant = participant;
        this.laneIndex = laneIndex;
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
        this._reactionTime = 0;
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

    set reactionTime(value: number) {
        this._reactionTime = value;
    }

    get reactionTime(): number {
        return this._reactionTime;
    }

    get lapCount(): number {
        return this.laps.length;
    }

    get totalTime(): number {
        return this.laps.reduce((acc, curr) => acc + curr, 0);
    }
}