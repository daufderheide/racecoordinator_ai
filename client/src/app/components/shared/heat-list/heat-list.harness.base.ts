export interface LaneItemData {
  laneNumberLabel: string;
  driverNumberLabel: string;
  bgColor: string;
  fgColor: string;
}

export abstract class HeatListHarnessBase {
  abstract hasHeader(): Promise<boolean>;
  abstract getHeatCount(): Promise<number>;
  abstract getHeatNumberLabel(heatIndex: number): Promise<string>;
  abstract getLanesForHeat(heatIndex: number): Promise<LaneItemData[]>;
}
