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

  private get qrImg() {
    return this.locator.locator(this.base.selectors.qrImg).first();
  }

  async getLogoText(): Promise<string> {
    return await this.logoText.innerText();
  }

  async getTagline(): Promise<string> {
    return await this.tagline.innerText();
  }

  async getQrCodeSrc(): Promise<string | null> {
    if (await this.qrImg.isVisible()) {
      return await this.qrImg.getAttribute("src");
    }
    return null;
  }
}
