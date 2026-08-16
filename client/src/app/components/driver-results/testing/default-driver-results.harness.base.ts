export abstract class DefaultDriverResultsHarnessBase {
  static readonly hostSelector = "app-default-driver-results";

  abstract exists(): Promise<boolean>;
}
