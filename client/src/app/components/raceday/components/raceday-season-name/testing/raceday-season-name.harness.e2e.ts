import { Locator } from "@playwright/test";

import { RacedaySeasonNameHarnessBase } from "./raceday-season-name.harness.base";

export class RacedaySeasonNameHarnessE2e implements RacedaySeasonNameHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedaySeasonNameHarnessBase;
  }

  private get labelText() {
    return this.locator.locator(this.base.selectors.labelText).first();
  }

  private get valueText() {
    return this.locator.locator(this.base.selectors.valueText).first();
  }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async getLabelText(): Promise<string> {
    if (await this.labelText.isVisible()) {
      return (await this.labelText.innerText()).trim();
    }
    return "";
  }

  async getSeasonName(): Promise<string> {
    if (await this.valueText.isVisible()) {
      return (await this.valueText.innerText()).trim();
    }
    return "";
  }
}
