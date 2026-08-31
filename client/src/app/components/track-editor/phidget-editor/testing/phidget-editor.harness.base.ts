export abstract class PhidgetEditorHarnessBase {
  static readonly hostSelector = "app-phidget-editor";

  static readonly selectors = {
    container: ".arduino-config-container",
    sectionHeader: ".section-header",
    sectionContent: ".section-content",
    phidgetSectionHeader: ".phidget-section-header",
    phidgetSectionContent: ".phidget-section-content",
    mainSectionHeader: ".main-section-header",
    mainSectionContent: ".main-section-content",
    digitalInSectionHeader: ".digital-in-section-header",
    digitalInSectionContent: ".digital-in-section-content",
    digitalOutSectionHeader: ".digital-out-section-header",
    digitalOutSectionContent: ".digital-out-section-content",
    deviceSelect: "select[id^='device-']",
    statusBadge: "button[id^='phidget-status-badge-']",
    ncSensorsCheckbox: "input[id^='phidget-nc-sensors-']",
    ncRelaysCheckbox: "input[id^='phidget-nc-relays-']",
    pitBehaviorSelect: "select[id^='phidget-pit-behavior-']",
    removeButton: "button.action-btn.danger",
    boardImage: ".board-image",
  };

  abstract exists(): Promise<boolean>;
  abstract getLapPinPitBehavior(): Promise<number>;
  abstract setLapPinPitBehavior(value: number): Promise<void>;
}
