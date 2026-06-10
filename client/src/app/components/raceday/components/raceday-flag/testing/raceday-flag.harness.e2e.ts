import { Locator } from "@playwright/test";

import { RacedayFlagHarnessBase } from "./raceday-flag.harness.base";

export class RacedayFlagHarnessE2e implements RacedayFlagHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayFlagHarnessBase;
  }

  private get flagImage() {
    return this.locator.locator(this.base.selectors.flagImage);
  }

  async getFlagUrl(): Promise<string | null> {
    return await this.flagImage.getAttribute("src");
  }
}
