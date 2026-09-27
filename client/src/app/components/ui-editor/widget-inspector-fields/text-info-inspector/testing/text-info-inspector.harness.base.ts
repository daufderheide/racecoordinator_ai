export abstract class TextInfoInspectorHarnessBase {
  static readonly hostSelector = "app-text-info-inspector";

  static readonly selectors = {
    selects: "app-custom-select",
    sliders: "input[type='range']",
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getLabelFontFamily(): Promise<string>;
  abstract setLabelFontFamily(val: string): Promise<void>;
  abstract getLabelFontSize(): Promise<number>;
  abstract setLabelFontSize(val: number): Promise<void>;
  abstract getLabelTextColor(): Promise<string>;
  abstract setLabelTextColor(val: string): Promise<void>;
  abstract clickResetLabelTextColor(): Promise<void>;

  abstract getValueFontFamily(): Promise<string>;
  abstract setValueFontFamily(val: string): Promise<void>;
  abstract getValueFontSize(): Promise<number>;
  abstract setValueFontSize(val: number): Promise<void>;
  abstract getValueTextColor(): Promise<string>;
  abstract setValueTextColor(val: string): Promise<void>;
  abstract clickResetValueTextColor(): Promise<void>;
}
