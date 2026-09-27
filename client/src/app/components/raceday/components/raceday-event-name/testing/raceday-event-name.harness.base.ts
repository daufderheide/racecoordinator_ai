export abstract class RacedayEventNameHarnessBase {
  static readonly hostSelector = "app-raceday-event-name";

  static readonly selectors = {
    label: ".info-section .label-text",
    eventName: ".info-section .value-text",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getLabel(): Promise<string>;
  abstract getEventName(): Promise<string>;
}
