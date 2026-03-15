export abstract class ArduinoSummaryHarnessBase {
  abstract toggleExpanded(): Promise<void>;
  abstract isExpanded(): Promise<boolean>;
  abstract getBoardName(): Promise<string>;
  abstract getCommPort(): Promise<string>;
  abstract getPinCountText(): Promise<string>;
  abstract hasBehavior(label: string): Promise<boolean>;
}
