import { Locator } from "@playwright/test";

import { RacedayQrHarnessBase } from "./raceday-qr.harness.base";

export class RacedayQrHarnessE2e implements RacedayQrHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayQrHarnessBase;
  }

  private get qrImg() {
    return this.locator.locator(this.base.selectors.qrImg).first();
  }

  async getQrCodeSrc(): Promise<string | null> {
    if (await this.qrImg.isVisible()) {
      return await this.qrImg.getAttribute("src");
    }
    return null;
  }
}
