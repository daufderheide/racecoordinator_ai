export abstract class RacedayRaceNameHarnessBase {
  static readonly hostSelector = "app-raceday-race-name";

  static readonly selectors = {
    label: ".info-section .label-text",
    raceName: ".info-section .value-text",
  };

  abstract getLabel(): Promise<string>;
  abstract getRaceName(): Promise<string>;
}
