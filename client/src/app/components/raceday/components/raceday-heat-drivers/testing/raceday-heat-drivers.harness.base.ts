export abstract class RacedayHeatDriversHarnessBase {
  static readonly hostSelector = "app-raceday-heat-drivers";

  static readonly selectors = {
    panel: ".panel-card",
    title: ".on-deck-title, .next-heat-title",
    item: ".on-deck-item, .next-heat-item",
    driverName: ".driver-nickname span",
    laneBadge: ".lane-badge",
    empty: ".on-deck-empty, .next-heat-empty",
    teammateSelect: ".teammate-select",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getDriverCount(): Promise<number>;
  abstract getDriverNames(): Promise<string[]>;
  abstract getDriverName(index: number): Promise<string>;
  abstract getLaneBadges(): Promise<string[]>;
  abstract isEmpty(): Promise<boolean>;
}
