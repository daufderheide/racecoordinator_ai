export abstract class RecordsInspectorHarnessBase {
  static readonly hostSelector = "app-records-inspector";

  static readonly selectors = {
    selects: "select",
    sliders: "input[type='range']",
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getHeaderFontFamily(): Promise<string>;
  abstract setHeaderFontFamily(val: string): Promise<void>;
  abstract getHeaderFontSize(): Promise<number>;
  abstract setHeaderFontSize(val: number): Promise<void>;
  abstract getHeaderTextColor(): Promise<string>;
  abstract setHeaderTextColor(val: string): Promise<void>;
  abstract clickResetHeaderTextColor(): Promise<void>;

  abstract getValueFontFamily(): Promise<string>;
  abstract setValueFontFamily(val: string): Promise<void>;
  abstract getValueFontSize(): Promise<number>;
  abstract setValueFontSize(val: number): Promise<void>;
  abstract getValueTextColor(): Promise<string>;
  abstract setValueTextColor(val: string): Promise<void>;
  abstract clickResetValueTextColor(): Promise<void>;
}
