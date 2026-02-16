import { Driver } from './driver';
import { Team } from './team';

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
    public team?: Team
  ) { }
}
