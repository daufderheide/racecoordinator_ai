export interface BartConfig {
  name: string;
  deviceName: string;
  deviceAddress: string;
  debounce: number;
  numLanes: number;
  minLapMs: number;
  lapPinPitBehavior: number;
  lapPinBehaviors: number[];
}
