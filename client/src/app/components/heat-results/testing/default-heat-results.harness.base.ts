export abstract class DefaultHeatResultsHarnessBase {
  static readonly hostSelector = "app-default-heat-results";

  abstract exists(): Promise<boolean>;
}
