export abstract class RacedayQrHarnessBase {
  static readonly hostSelector = "app-raceday-qr";

  static readonly selectors = {
    qrImg: ".branding-qr img",
  };

  abstract getQrCodeSrc(): Promise<string | null>;
}
