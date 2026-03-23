import { RaceParticipant } from "./race_participant";
import { Driver } from "../models/driver";

/**
 * Data for a driver in a specific heat.
 */
export class DriverHeatData {
    readonly laneIndex: number;
    readonly objectId: string;
    readonly participant: RaceParticipant;
    readonly actualDriver?: Driver;

    private laps!: number[];
    private _currentLapSegments: number[] = [];
    private _lapsWithDrivers: { time: number, driverId: string }[] = [];

    // These are all updated by the addLapTime method.
    private _bestLapTime!: number;
    private _lastLapTime!: number;
    private _averageLapTime!: number;
    private _medianLapTime!: number;
    private _reactionTime: number = 0;
    private _gapLeader: number = 0;
    private _gapPosition: number = 0;

    constructor(objectId: string, participant: RaceParticipant, laneIndex: number, actualDriver?: Driver) {
        this.objectId = objectId;
        this.participant = participant;
        this.laneIndex = laneIndex;
        this.actualDriver = actualDriver;
        this.reset();
    }

    get driver(): Driver {
        return this.actualDriver ?? this.participant.driver;
    }

    reset(): void {
        this.laps = [];
        this._lapsWithDrivers = [];
        
        this._bestLapTime = 0;
        this._lastLapTime = 0;
        this._averageLapTime = 0;
        this._medianLapTime = 0;
        this._reactionTime = 0;
        this._gapLeader = 0;
        this._gapPosition = 0;
        this._currentLapSegments = [];
    }

    addLapTime(lapNumber: number, lapTime: number, averageLapTime: number, medianLapTime: number, bestLapTime: number, driverId?: string): void {
        const lapIndex = lapNumber - 1;

        // Fill missing laps with 0
        while (this.laps.length < lapIndex) {
            this.laps.push(0);
            this._lapsWithDrivers.push({ time: 0, driverId: '' });
        }

        // Store or update the lap time
        if (this.laps.length <= lapIndex) {
            this.laps.push(lapTime);
            this._lapsWithDrivers.push({ time: lapTime, driverId: driverId || '' });
        } else {
            this.laps[lapIndex] = lapTime;
            this._lapsWithDrivers[lapIndex] = { time: lapTime, driverId: driverId || '' };
        }

        // When a lap is handled, clear current segments for the next lap
        this._currentLapSegments = [];

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

    get lapTimes(): number[] {
        return [...this.laps];
    }

    get lapsWithDrivers(): { time: number, driverId: string }[] {
        return [...this._lapsWithDrivers];
    }

    get gapLeader(): number {
        return this._gapLeader;
    }

    set gapLeader(value: number) {
        this._gapLeader = value;
    }

    get gapPosition(): number {
        return this._gapPosition;
    }

    set gapPosition(value: number) {
        this._gapPosition = value;
    }

    addSegmentTime(index: number, segmentTime: number): void {
        // Ensure array is large enough
        while (this._currentLapSegments.length < index) {
            this._currentLapSegments.push(0);
        }

        if (this._currentLapSegments.length <= index) {
            this._currentLapSegments.push(segmentTime);
        } else {
            this._currentLapSegments[index] = segmentTime;
        }
    }

    get currentLapSegments(): number[] {
        return this._currentLapSegments;
    }

    get lastSegmentTime(): number {
        return this._currentLapSegments.length > 0
            ? this._currentLapSegments[this._currentLapSegments.length - 1]
            : 0;
    }
}