export abstract class RacedayBrandingHarnessBase {
  static readonly hostSelector = "app-raceday-branding";

  static readonly selectors = {
    logoText: ".logo-text",
    tagline: ".branding-tagline",
    qrImg: ".branding-qr img",
  };

  abstract getLogoText(): Promise<string>;
  abstract getTagline(): Promise<string>;
  abstract getQrCodeSrc(): Promise<string | null>;
}
