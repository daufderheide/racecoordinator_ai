export abstract class LaneViewInspectorHarnessBase {
  static readonly hostSelector = "app-lane-view-inspector";

  static readonly selectors = {
    selects: "app-custom-select",
    columnWidthInputs: ".col-width-input",
    columnDecimalsSelects: ".col-decimals-select app-custom-select",
  };

  abstract getTimeDecimalPlaces(): Promise<number>;
  abstract setTimeDecimalPlaces(val: number): Promise<void>;
  abstract getLapDecimalPlaces(): Promise<number>;
  abstract setLapDecimalPlaces(val: number): Promise<void>;
  abstract getColumnWidth(columnIndex: number): Promise<number>;
  abstract setColumnWidth(columnIndex: number, val: number): Promise<void>;
  abstract getColumnDecimals(columnIndex: number): Promise<number>;
  abstract setColumnDecimals(columnIndex: number, val: number): Promise<void>;
}
