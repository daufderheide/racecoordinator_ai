export abstract class RacedayNextHeatHarnessBase {
  static readonly hostSelector = "app-raceday-next-heat";

  static readonly selectors = {
    title: ".next-heat-title",
    item: ".next-heat-item",
    driverName: ".driver-nickname",
    laneBadge: ".lane-badge",
  };

  abstract getTitle(): Promise<string>;
  abstract getEntryCount(): Promise<number>;
  abstract getEntryDriverName(index: number): Promise<string>;
  abstract getEntryLaneText(index: number): Promise<string>;
}
