import { Car } from "./car";
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
    public gapLeaderLaps: number = 0,
    public gapPositionLaps: number = 0,
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
    public hasSegments?: boolean,
    public groupRank?: number,
    public heatsRaced: number = 0,
    public heatsRemaining: number = 0,
    public totalHeats: number = 0,
    public isStepUp: boolean = false,
    public stepUpIndex: number = 0,
    public stepUpStatus: string = "",
  ) {}

  /** Slotcar for this race (#1210): a solo driver's car or a team's shared car. */
  car?: Car;
  /** A team racing with a car per driver uses driverCars instead of car. */
  carPerDriver?: boolean;
  driverCars?: { driverId: string; car: Car }[];
}

/** The car on the track for the driver racing this entry (#1210). */
export function participantCarFor(
  p: Pick<RaceParticipant, "car" | "carPerDriver" | "driverCars"> | undefined,
  actualDriverId?: string,
): Car | undefined {
  if (!p) return undefined;
  if (p.carPerDriver) {
    return (p.driverCars || []).find((dc) => dc.driverId === actualDriverId)
      ?.car;
  }
  return p.car;
}
