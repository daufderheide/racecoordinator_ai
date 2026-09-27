export abstract class RecordsInspectorHarnessBase {
  static readonly hostSelector = "app-records-inspector";

  static readonly selectors = {
    checkboxes: "input[type='checkbox']",
    selects: "app-custom-select",
    sliders: "input[type='range']",
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getShowRaceRecordLap(): Promise<boolean>;
  abstract setShowRaceRecordLap(val: boolean): Promise<void>;
  abstract getShowRaceRecordScore(): Promise<boolean>;
  abstract setShowRaceRecordScore(val: boolean): Promise<void>;
  abstract getShowCurrentRaceBest(): Promise<boolean>;
  abstract setShowCurrentRaceBest(val: boolean): Promise<void>;
  abstract getShowHeatBest(): Promise<boolean>;
  abstract setShowHeatBest(val: boolean): Promise<void>;

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
