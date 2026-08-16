export abstract class DefaultSeasonResultsHarnessBase {
  static readonly hostSelector = "app-default-season-results";

  abstract exists(): Promise<boolean>;
}
