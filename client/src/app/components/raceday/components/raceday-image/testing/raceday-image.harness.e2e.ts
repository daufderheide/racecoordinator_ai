import { Locator } from "@playwright/test";

import { RacedayImageHarnessBase } from "./raceday-image.harness.base";

export class RacedayImageHarnessE2e implements RacedayImageHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayImageHarnessBase;
  }

  private get image() {
    return this.locator.locator(this.base.selectors.image);
  }

  async getImageUrl(): Promise<string> {
    return (await this.image.getAttribute("src")) || "";
  }
}
