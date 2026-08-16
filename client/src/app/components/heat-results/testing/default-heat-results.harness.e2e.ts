import { Locator } from "@playwright/test";

import { DefaultHeatResultsHarnessBase } from "./default-heat-results.harness.base";

export class DefaultHeatResultsHarnessE2e implements DefaultHeatResultsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
