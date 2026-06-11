import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayBrandingHarnessBase } from "./raceday-branding.harness.base";

export class RacedayBrandingHarness
  extends ComponentHarness
  implements RacedayBrandingHarnessBase
{
  static hostSelector = RacedayBrandingHarnessBase.hostSelector;

  protected getLogoTextEl = this.locatorFor(
    RacedayBrandingHarnessBase.selectors.logoText,
  );
  protected getTaglineEl = this.locatorFor(
    RacedayBrandingHarnessBase.selectors.tagline,
  );

  async getLogoText(): Promise<string> {
    return await (await this.getLogoTextEl()).text();
  }

  async getTagline(): Promise<string> {
    return await (await this.getTaglineEl()).text();
  }
}
