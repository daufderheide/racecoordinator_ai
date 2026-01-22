import { Driver } from './driver';

export class RaceParticipant {
  constructor(
    public objectId: string,
    public driver: Driver,
    public rank: number,
    public totalLaps: number,
    public totalTime: number,
    public bestLapTime: number,
    public averageLapTime: number,
    public medianLapTime: number
  ) { }
}
