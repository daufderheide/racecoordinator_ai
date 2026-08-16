import { Locator } from "@playwright/test";

import { DefaultDriverResultsHarnessBase } from "./default-driver-results.harness.base";

export class DefaultDriverResultsHarnessE2e implements DefaultDriverResultsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
