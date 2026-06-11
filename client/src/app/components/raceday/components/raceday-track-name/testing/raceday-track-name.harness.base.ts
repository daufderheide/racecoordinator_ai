export abstract class RacedayTrackNameHarnessBase {
  static readonly hostSelector = "app-raceday-track-name";

  static readonly selectors = {
    label: ".info-section .label-text",
    trackName: ".info-section .track-text",
  };

  abstract getLabel(): Promise<string>;
  abstract getTrackName(): Promise<string>;
}
