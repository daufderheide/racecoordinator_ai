import { Locator } from "@playwright/test";

import { RacedayHeatDriversHarnessBase } from "./raceday-heat-drivers.harness.base";

export class RacedayHeatDriversHarnessE2e implements RacedayHeatDriversHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
