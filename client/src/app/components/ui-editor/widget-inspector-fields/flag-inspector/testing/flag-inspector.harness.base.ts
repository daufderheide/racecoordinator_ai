export abstract class FlagInspectorHarnessBase {
  static readonly hostSelector = "app-flag-inspector";

  static readonly selectors = {
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getBackgroundColor(): Promise<string>;
  abstract setBackgroundColor(val: string): Promise<void>;
  abstract clickResetBackgroundColor(): Promise<void>;
}
