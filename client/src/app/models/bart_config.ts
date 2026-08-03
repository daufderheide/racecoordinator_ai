export interface BartConfig {
  name: string;
  deviceName: string;
  deviceAddress: string;
  numLanes: number;
  minLapMs: number;
  lapPinPitBehavior: number;
  lapPinBehaviors: number[];
}
