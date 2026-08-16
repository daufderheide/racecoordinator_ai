export abstract class DefaultPredictionResultsHarnessBase {
  static readonly hostSelector = "app-default-prediction-results";

  abstract exists(): Promise<boolean>;
}
