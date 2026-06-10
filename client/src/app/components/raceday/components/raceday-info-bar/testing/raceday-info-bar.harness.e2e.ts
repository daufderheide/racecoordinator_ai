import { Locator } from "@playwright/test";

import { RacedayInfoBarHarnessBase } from "./raceday-info-bar.harness.base";

export class RacedayInfoBarHarnessE2e implements RacedayInfoBarHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayInfoBarHarnessBase;
  }

  private get raceName() {
    return this.locator.locator(this.base.selectors.raceName).first();
  }

  private get heatStatus() {
    return this.locator.locator(this.base.selectors.heatStatus).first();
  }

  private get trackName() {
    return this.locator.locator(this.base.selectors.trackName).first();
  }

  async getRaceName(): Promise<string> {
    return (await this.raceName.isVisible())
      ? await this.raceName.innerText()
      : "";
  }

  async getHeatStatus(): Promise<string> {
    return (await this.heatStatus.isVisible())
      ? await this.heatStatus.innerText()
      : "";
  }

  async getTrackName(): Promise<string> {
    return (await this.trackName.isVisible())
      ? await this.trackName.innerText()
      : "";
  }
}
