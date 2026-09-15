export abstract class CameraSummaryHarnessBase {
  static readonly hostSelector = "app-camera-summary";

  static readonly selectors = {
    header: ".section-header",
    content: ".section-content",
    summaryValue: ".summary-item .value",
    behaviorCheck: ".behavior-check",
    checkBox: ".check-box",
  };

  abstract toggleExpanded(): Promise<void>;
  abstract isExpanded(): Promise<boolean>;
  abstract getTargetFps(): Promise<string>;
  abstract getAutoDetectLanes(): Promise<string>;
  abstract getGateCountText(): Promise<string>;
  abstract hasBehavior(label: string): Promise<boolean>;
}
