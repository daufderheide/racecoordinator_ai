export abstract class TimerInspectorHarnessBase {
  static readonly hostSelector = "app-timer-inspector";

  static readonly selectors = {
    selects: "select",
    sliders: "input[type='range']",
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getTimeFontFamily(): Promise<string>;
  abstract setTimeFontFamily(val: string): Promise<void>;
  abstract getTimeFontSize(): Promise<number>;
  abstract setTimeFontSize(val: number): Promise<void>;
  abstract getTimeTextColor(): Promise<string>;
  abstract setTimeTextColor(val: string): Promise<void>;
  abstract clickResetTimeTextColor(): Promise<void>;
}
