export interface LaneItemData {
  laneNumberLabel: string;
  driverNumberLabel: string;
  bgColor: string;
  fgColor: string;
}

export abstract class HeatListHarnessBase {
  static readonly hostSelector = 'app-heat-list';

  static readonly selectors = {
    header: '.heat-list-header',
    heatItem: '.heat-item',
    heatNumber: '.heat-number',
    laneItem: '.lane-item',
    laneLabel: '.lane-label',
    driverNumber: '.driver-number'
  };

  abstract hasHeader(): Promise<boolean>;
  abstract getHeatCount(): Promise<number>;
  abstract getHeatNumberLabel(heatIndex: number): Promise<string>;
  abstract getLanesForHeat(heatIndex: number): Promise<LaneItemData[]>;
}
