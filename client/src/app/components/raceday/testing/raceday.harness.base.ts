export abstract class RacedayHarnessBase {
  static readonly hostSelector = "app-raceday";

  abstract exists(): Promise<boolean>;
}
