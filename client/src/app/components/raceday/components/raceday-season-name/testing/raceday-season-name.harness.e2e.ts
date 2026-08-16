import { Locator } from "@playwright/test";

import { RacedaySeasonNameHarnessBase } from "./raceday-season-name.harness.base";

export class RacedaySeasonNameHarnessE2e implements RacedaySeasonNameHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedaySeasonNameHarnessBase;
  }

  private get valueText() {
    return this.locator.locator(this.base.selectors.valueText);
  }

  async getSeasonName(): Promise<string> {
    return (await this.valueText.textContent()) || "";
  }
}
