export abstract class RacedayOnDeckHarnessBase {
  static readonly hostSelector = "app-raceday-on-deck";

  static readonly selectors = {
    title: ".on-deck-title",
    item: ".on-deck-item",
    driverName: ".driver-nickname",
    laneBadge: ".lane-badge",
  };

  abstract getTitle(): Promise<string>;
  abstract getEntryCount(): Promise<number>;
  abstract getEntryDriverName(index: number): Promise<string>;
  abstract getEntryLaneText(index: number): Promise<string>;
}
