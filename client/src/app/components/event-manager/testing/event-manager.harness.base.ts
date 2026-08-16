export abstract class EventManagerHarnessBase {
  static readonly hostSelector = "app-event-manager";

  static readonly selectors = {
    container: ".event-manager-container",
  };

  abstract exists(): Promise<boolean>;
}
