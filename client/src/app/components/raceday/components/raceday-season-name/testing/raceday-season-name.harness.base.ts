export abstract class RacedaySeasonNameHarnessBase {
  static readonly hostSelector = "app-raceday-season-name";

  static readonly selectors = {
    panel: ".info-panel",
    valueText: ".value-text",
  };

  abstract getSeasonName(): Promise<string>;
}
