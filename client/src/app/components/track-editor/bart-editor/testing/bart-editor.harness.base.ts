export abstract class BartEditorHarnessBase {
  static readonly hostSelector = "app-bart-editor";

  static readonly selectors = {
    section: ".config-section",
    sectionHeader: ".section-header",
    sectionContent: ".section-content",
    deviceNameInput: "[id^='deviceName-']",
    minLapMsInput: "input[id^='minLapMs-']",
    lapPinPitBehaviorSelect: "[id^='lapPinPitBehavior-']",
    pinItem: ".pin-item",
    removeButton: ".action-btn.danger.small",
  };

  abstract toggleSection(name: "bart" | "main" | "rw"): Promise<void>;
  abstract isSectionExpanded(name: "bart" | "main" | "rw"): Promise<boolean>;
  abstract getDeviceName(): Promise<string>;
  abstract setDeviceName(name: string): Promise<void>;
  abstract getMinLapMs(): Promise<number>;
  abstract setMinLapMs(ms: number): Promise<void>;
  abstract getLapPinPitBehavior(): Promise<number>;
  abstract setLapPinPitBehavior(value: number): Promise<void>;
  abstract removeInterface(): Promise<void>;
}
