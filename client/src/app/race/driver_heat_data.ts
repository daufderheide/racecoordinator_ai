import { Driver } from "@app/models/driver";
import { LapType } from "@app/proto/antigravity";

import { RaceParticipant } from "./race_participant";

export interface LapDetail {
  time: number;
  driverId: string;
  isDrift: boolean;
  countTowardsRecords?: boolean;
  segments?: number[];
}

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
  private _lapsWithDetails: LapDetail[] = [];

  // These are all updated by the addLapTime method.
  private _bestLapTime!: number;
  private _lastLapTime!: number;
  private _averageLapTime!: number;
  private _medianLapTime!: number;
  private _reactionTime: number = 0;
  private _gapLeader: number = 0;
  private _gapPosition: number = 0;
  private _gapLeaderF1: number = 0;
  private _gapPositionF1: number = 0;
  private _lapsDownLeader: number = 0;
  private _lapsDownPosition: number = 0;
  public penaltyLaps: number = 0;
  public userLaps: number = 0;
  public autoCalculatedLaps: number = 0;
  private _adjustedLapCount: number = 0;
  public isRefueling: boolean = false;
  public currentLocation: number = -1;
  public rank: number = 0;
  public flag: number = 0;
  public lapsLed: number = 0;
  public isFinished: boolean = false;
  public trackCalls: number = 0;
  public initialFuelLevel: number = 0;
  public consistencyScore: number | null = null;
  public standardDeviation: number | null = null;
  public averageTop5: number | null = null;
  public averageTop10: number | null = null;
  public averageTop15: number | null = null;
  public top2Consecutive: number | null = null;
  public top3Consecutive: number | null = null;

  constructor(
    objectId: string,
    participant: RaceParticipant,
    laneIndex: number,
    actualDriver?: Driver,
  ) {
    this.objectId = objectId;
    this.participant = participant;
    this.laneIndex = laneIndex;
    this.actualDriver = actualDriver;
    this.reset();
  }

  get driver(): Driver {
    return this.actualDriver ?? this.participant?.driver;
  }

  reset(): void {
    this.laps = [];
    this._lapsWithDetails = [];

    this._bestLapTime = 0;
    this._lastLapTime = 0;
    this._averageLapTime = 0;
    this._medianLapTime = 0;
    this._reactionTime = 0;
    this._gapLeader = 0;
    this._gapPosition = 0;
    this._gapLeaderF1 = 0;
    this._gapPositionF1 = 0;
    this._lapsDownLeader = 0;
    this._lapsDownPosition = 0;
    this._currentLapSegments = [];
    this.penaltyLaps = 0;
    this.userLaps = 0;
    this.autoCalculatedLaps = 0;
    this._adjustedLapCount = 0;
    this.isRefueling = false;
    this.currentLocation = -1;
    this.flag = 0;
    this.lapsLed = 0;
    this.isFinished = false;
    this.trackCalls = 0;
    this.consistencyScore = null;
    this.standardDeviation = null;
    this.averageTop5 = null;
    this.averageTop10 = null;
    this.averageTop15 = null;
    this.top2Consecutive = null;
    this.top3Consecutive = null;
  }

  addLapTime(
    lapNumber: number,
    lapTime: number,
    averageLapTime: number,
    medianLapTime: number,
    bestLapTime: number,
    adjustedLapCount: number,
    driverId?: string,
    isDrift?: boolean,
    _type?: LapType,
    segments?: number[],
    countTowardsRecords: boolean = true,
  ): void {
    this._adjustedLapCount = adjustedLapCount;
    if (
      lapNumber === undefined ||
      lapNumber === null ||
      isNaN(lapNumber) ||
      lapNumber <= 0
    ) {
      return;
    }
    const lapIndex = lapNumber - 1;

    // Fill missing laps with 0
    while (this.laps.length < lapIndex) {
      this.laps.push(0);
      this._lapsWithDetails.push({
        time: 0,
        driverId: "",
        isDrift: false,
        countTowardsRecords: true,
      });
    }

    // Store or update the lap time
    if (this.laps.length <= lapIndex) {
      this.laps.push(lapTime);
      this._lapsWithDetails.push({
        time: lapTime,
        driverId: driverId || "",
        isDrift: !!isDrift,
        countTowardsRecords: countTowardsRecords !== false,
        segments: segments ? [...segments] : undefined,
      });
    } else {
      this.laps[lapIndex] = lapTime;
      this._lapsWithDetails[lapIndex] = {
        time: lapTime,
        driverId: driverId || "",
        isDrift: !!isDrift,
        countTowardsRecords: countTowardsRecords !== false,
        segments: segments ? [...segments] : undefined,
      };
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

  updateLapRecordStatus(lapIndex: number, countTowardsRecords: boolean): void {
    if (this._lapsWithDetails && this._lapsWithDetails[lapIndex]) {
      this._lapsWithDetails[lapIndex].countTowardsRecords = countTowardsRecords;
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
    if (this._adjustedLapCount !== 0) {
      return this._adjustedLapCount;
    }
    return (
      this.laps.length +
      this.penaltyLaps +
      this.userLaps +
      this.autoCalculatedLaps
    );
  }

  get physicalLapCount(): number {
    return this.laps ? this.laps.length : 0;
  }

  get adjustedLapCount(): number {
    return this._adjustedLapCount;
  }

  set adjustedLapCount(value: number) {
    this._adjustedLapCount = value;
  }

  get totalTime(): number {
    return this.laps.reduce((acc, curr) => acc + curr, 0);
  }

  get lapTimes(): number[] {
    return [...this.laps];
  }

  get lapsWithDetails(): LapDetail[] {
    return [...this._lapsWithDetails];
  }

  get isLastLapDrift(): boolean {
    return this._lapsWithDetails.length > 0
      ? this._lapsWithDetails[this._lapsWithDetails.length - 1].isDrift
      : false;
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

  get gapLeaderF1(): number {
    return this._gapLeaderF1;
  }

  set gapLeaderF1(value: number) {
    this._gapLeaderF1 = value;
  }

  get gapPositionF1(): number {
    return this._gapPositionF1;
  }

  set gapPositionF1(value: number) {
    this._gapPositionF1 = value;
  }

  get lapsDownLeader(): number {
    return this._lapsDownLeader;
  }

  set lapsDownLeader(value: number) {
    this._lapsDownLeader = value;
  }

  get lapsDownPosition(): number {
    return this._lapsDownPosition;
  }

  set lapsDownPosition(value: number) {
    this._lapsDownPosition = value;
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

  get validLaps(): number[] {
    if (this._lapsWithDetails && this._lapsWithDetails.length > 0) {
      return this._lapsWithDetails.map((l) => l.time).filter((t) => t > 0);
    }
    return (this.laps || []).filter((t) => t > 0);
  }
}
