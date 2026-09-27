export abstract class RacedayGhostPacingHarnessBase {
  static readonly hostSelector = "app-raceday-ghost-pacing";

  static readonly selectors = {
    widget: ".ghost-pacing-widget",
    empty: ".pacing-empty",
    noBenchmarkText: ".no-benchmark-text",
    benchmarkTag: ".benchmark-tag",
    benchmarkName: ".benchmark-name",
    deltaBadge: ".delta-badge",
    deltaArrow: ".delta-arrow",
    deltaValue: ".delta-value",
    targetTime: ".pacing-target-time",
    stackedContent: ".pacing-stacked-content",
    benchmarkLabel: ".pacing-benchmark-label",
  };

  abstract isVisible(): Promise<boolean>;
  abstract isEmpty(): Promise<boolean>;
  abstract getBenchmarkName(): Promise<string>;
  abstract getDeltaText(): Promise<string>;
  abstract isAhead(): Promise<boolean>;
  abstract isBehind(): Promise<boolean>;
  abstract getTargetTimeText(): Promise<string>;
}
