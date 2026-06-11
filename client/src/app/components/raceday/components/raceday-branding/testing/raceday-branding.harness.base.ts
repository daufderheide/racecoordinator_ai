export abstract class RacedayBrandingHarnessBase {
  static readonly hostSelector = "app-raceday-branding";

  static readonly selectors = {
    logoText: ".logo-text",
    tagline: ".branding-tagline",
  };

  abstract getLogoText(): Promise<string>;
  abstract getTagline(): Promise<string>;
}
