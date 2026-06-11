export abstract class RacedayHeatInfoHarnessBase {
  static readonly hostSelector = "app-raceday-heat-info";

  static readonly selectors = {
    label: ".info-section .label-text",
    heatStatus: ".info-section .value-text",
  };

  abstract getLabel(): Promise<string>;
  abstract getHeatStatus(): Promise<string>;
}
