export abstract class RacedaySeasonNameHarnessBase {
  static readonly hostSelector = "app-raceday-season-name";

  static readonly selectors = {
    section: ".info-section",
    labelText: ".label-text",
    valueText: ".value-text",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getLabelText(): Promise<string>;
  abstract getSeasonName(): Promise<string>;
}
