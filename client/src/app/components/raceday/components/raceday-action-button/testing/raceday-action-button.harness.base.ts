export abstract class RacedayActionButtonHarnessBase {
  static readonly hostSelector = "app-raceday-action-button";

  static readonly selectors = {
    button: ".action-button",
  };

  abstract click(): Promise<void>;
  abstract isDisabled(): Promise<boolean>;
}
