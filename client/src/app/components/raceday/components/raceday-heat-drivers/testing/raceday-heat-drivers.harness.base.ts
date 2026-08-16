export abstract class RacedayHeatDriversHarnessBase {
  static readonly hostSelector = "app-raceday-heat-drivers";

  static readonly selectors = {
    panel: ".drivers-panel",
  };

  abstract exists(): Promise<boolean>;
}
