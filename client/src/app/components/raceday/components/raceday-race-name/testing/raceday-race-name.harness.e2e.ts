import { Locator } from "@playwright/test";

import { RacedayRaceNameHarnessBase } from "./raceday-race-name.harness.base";

export class RacedayRaceNameHarnessE2e implements RacedayRaceNameHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayRaceNameHarnessBase;
  }

  private get label() {
    return this.locator.locator(this.base.selectors.label).first();
  }

  private get raceName() {
    return this.locator.locator(this.base.selectors.raceName).first();
  }

  async getLabel(): Promise<string> {
    return (await this.label.isVisible()) ? await this.label.innerText() : "";
  }

  async getRaceName(): Promise<string> {
    return (await this.raceName.isVisible())
      ? await this.raceName.innerText()
      : "";
  }
}
