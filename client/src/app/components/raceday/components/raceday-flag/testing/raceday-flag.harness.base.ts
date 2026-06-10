export abstract class RacedayFlagHarnessBase {
  static readonly hostSelector = "app-raceday-flag";

  static readonly selectors = {
    flagImage: ".flag-image",
  };

  abstract getFlagUrl(): Promise<string | null>;
}
