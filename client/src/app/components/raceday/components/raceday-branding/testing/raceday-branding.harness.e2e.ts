import { Locator } from "@playwright/test";

import { RacedayBrandingHarnessBase } from "./raceday-branding.harness.base";

export class RacedayBrandingHarnessE2e implements RacedayBrandingHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayBrandingHarnessBase;
  }

  private get logoText() {
    return this.locator.locator(this.base.selectors.logoText);
  }

  private get tagline() {
    return this.locator.locator(this.base.selectors.tagline);
  }

  async getLogoText(): Promise<string> {
    return await this.logoText.innerText();
  }

  async getTagline(): Promise<string> {
    return await this.tagline.innerText();
  }
}
