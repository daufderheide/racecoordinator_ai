export abstract class PhidgetSummaryHarnessBase {
  static readonly hostSelector = "app-phidget-summary";

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
  abstract getSerialNumber(): Promise<string>;
  abstract getHubPort(): Promise<string>;
  abstract getPinCountText(): Promise<string>;
  abstract hasBehavior(label: string): Promise<boolean>;
}
