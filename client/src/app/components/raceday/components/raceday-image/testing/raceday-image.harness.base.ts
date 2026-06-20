export abstract class RacedayImageHarnessBase {
  static readonly hostSelector = "app-raceday-image";

  static readonly selectors = {
    image: ".widget-image-content",
  };

  abstract getImageUrl(): Promise<string>;
}
