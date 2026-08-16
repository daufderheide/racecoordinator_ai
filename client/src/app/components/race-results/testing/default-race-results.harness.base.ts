export abstract class DefaultRaceResultsHarnessBase {
  static readonly hostSelector = "app-default-race-results";

  abstract exists(): Promise<boolean>;
}
