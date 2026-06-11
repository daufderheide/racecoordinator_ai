import { Locator } from "@playwright/test";

import { RacedayHeatInfoHarnessBase } from "./raceday-heat-info.harness.base";

export class RacedayHeatInfoHarnessE2e implements RacedayHeatInfoHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayHeatInfoHarnessBase;
  }

  private get label() {
    return this.locator.locator(this.base.selectors.label).first();
  }

  private get heatStatus() {
    return this.locator.locator(this.base.selectors.heatStatus).first();
  }

  async getLabel(): Promise<string> {
    return (await this.label.isVisible()) ? await this.label.innerText() : "";
  }

  async getHeatStatus(): Promise<string> {
    return (await this.heatStatus.isVisible())
      ? await this.heatStatus.innerText()
      : "";
  }
}
