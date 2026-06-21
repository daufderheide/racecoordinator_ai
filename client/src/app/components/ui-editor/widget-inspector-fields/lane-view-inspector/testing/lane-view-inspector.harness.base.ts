export abstract class LaneViewInspectorHarnessBase {
  static readonly hostSelector = "app-lane-view-inspector";

  static readonly selectors = {
    selects: "select",
  };

  abstract getTimeDecimalPlaces(): Promise<number>;
  abstract setTimeDecimalPlaces(val: number): Promise<void>;
  abstract getLapDecimalPlaces(): Promise<number>;
  abstract setLapDecimalPlaces(val: number): Promise<void>;
}
