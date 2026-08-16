import { Locator } from "@playwright/test";

import { RacedayHarnessBase } from "./raceday.harness.base";

export class RacedayHarnessE2e implements RacedayHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
