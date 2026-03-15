export abstract class ArduinoSummaryHarnessBase {
  static readonly hostSelector = 'app-arduino-summary';

  static readonly selectors = {
    header: '.section-header',
    content: '.section-content',
    summaryValue: '.summary-item .value',
    behaviorCheck: '.behavior-check',
    checkBox: '.check-box'
  };

  abstract toggleExpanded(): Promise<void>;
  abstract isExpanded(): Promise<boolean>;
  abstract getBoardName(): Promise<string>;
  abstract getCommPort(): Promise<string>;
  abstract getPinCountText(): Promise<string>;
  abstract hasBehavior(label: string): Promise<boolean>;
}
