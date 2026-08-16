import { Locator } from "@playwright/test";

import { DefaultRaceResultsHarnessBase } from "./default-race-results.harness.base";

export class DefaultRaceResultsHarnessE2e implements DefaultRaceResultsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
