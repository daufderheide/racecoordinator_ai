export abstract class TrakmateSummaryHarnessBase {
  static readonly hostSelector = "app-trakmate-summary";

  static readonly selectors = {
    summaryContainer: ".trakmate-summary",
  };

  abstract exists(): Promise<boolean>;
}
