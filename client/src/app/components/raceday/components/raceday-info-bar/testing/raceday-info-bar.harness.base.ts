export abstract class RacedayInfoBarHarnessBase {
  static readonly hostSelector = "app-raceday-info-bar";

  static readonly selectors = {
    raceName: ".info-section:nth-child(1) .value-text",
    heatStatus: ".info-section:nth-child(2) .value-text",
    trackName: ".info-section:nth-child(3) .track-text",
  };

  abstract getRaceName(): Promise<string>;
  abstract getHeatStatus(): Promise<string>;
  abstract getTrackName(): Promise<string>;
}
