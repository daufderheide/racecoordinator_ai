import { Locator } from "@playwright/test";

import { RacedayActionButtonHarnessBase } from "./raceday-action-button.harness.base";

export class RacedayActionButtonHarnessE2e implements RacedayActionButtonHarnessBase {
  constructor(private locator: Locator) {}

  private get button() {
    return this.locator.locator("button");
  }

  async click(): Promise<void> {
    await this.button.click();
  }

  async isDisabled(): Promise<boolean> {
    return await this.button.isDisabled();
  }
}
