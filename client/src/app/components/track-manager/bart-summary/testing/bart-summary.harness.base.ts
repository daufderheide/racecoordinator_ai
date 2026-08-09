export abstract class BartSummaryHarnessBase {
  static readonly hostSelector = "app-bart-summary";

  static readonly selectors = {
    header: ".section-header",
    content: ".section-content",
    summaryValue: ".summary-item .value",
    behaviorCheck: ".behavior-check",
    checkBox: ".check-box",
  };

  abstract toggleExpanded(): Promise<void>;
  abstract isExpanded(): Promise<boolean>;
  abstract getDeviceName(): Promise<string>;
  abstract getMinLapTime(): Promise<string>;
  abstract getPitBehavior(): Promise<string>;
  abstract getChannelCountText(): Promise<string>;
  abstract hasBehavior(label: string): Promise<boolean>;
}
