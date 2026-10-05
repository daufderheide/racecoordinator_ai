import { Driver } from "./driver";
import { Team } from "./team";

export class RaceParticipant {
  constructor(
    public objectId: string,
    public driver: Driver,
    public rank: number,
    public totalLaps: number,
    public totalTime: number,
    public bestLapTime: number,
    public averageLapTime: number,
    public medianLapTime: number,
    public rankValue: number,
    public seed: number,
    public fuelLevel: number,
    public gapLeader: number = 0,
    public gapPosition: number = 0,
    public team?: Team,
    public gapLeaderF1: number = 0,
    public gapPositionF1: number = 0,
    public lapsDownLeader: number = 0,
    public lapsDownPosition: number = 0,
    public consistencyScore: number = 0,
    public physicalLapCount: number = 0,
    public standardDeviation: number = 0,
    public lapsLed: number = 0,
    public trackCalls: number = 0,
    public totalPoints: number = 0,
    public averageTop5: number = 0,
    public averageTop10: number = 0,
    public averageTop15: number = 0,
    public top2Consecutive: number = 0,
    public top3Consecutive: number = 0,
  ) {}
}
