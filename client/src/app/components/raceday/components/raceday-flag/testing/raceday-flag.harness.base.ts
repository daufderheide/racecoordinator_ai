export abstract class RacedayFlagHarnessBase {
  static readonly hostSelector = "app-raceday-flag";

  static readonly selectors = {
    flagImage: ".flag-image",
    raceStateIndicator: ".race-state-indicator",
  };

  abstract getFlagUrl(): Promise<string | null>;
  abstract getRaceStateColorClass(): Promise<string | null>;
}
