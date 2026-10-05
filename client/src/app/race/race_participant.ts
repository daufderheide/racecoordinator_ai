import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";

export class RaceParticipant {
  readonly driver: Driver;
  readonly objectId: string;
  readonly team?: Team;

  constructor(
    objectId: string,
    driver: Driver,
    public rank: number = 0,
    public totalLaps: number = 0,
    public totalTime: number = 0,
    public bestLapTime: number = 0,
    public averageLapTime: number = 0,
    public medianLapTime: number = 0,
    public rankValue: number = 0,
    public seed: number = 0,
    public fuelLevel: number = 100,
    public gapLeader: number = 0,
    public gapPosition: number = 0,
    team?: Team,
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
  ) {
    this.driver = driver;
    this.objectId = objectId;
    this.team = team;
  }
}
