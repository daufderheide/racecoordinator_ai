import { Locator } from "@playwright/test";

import { TrakmateSummaryHarnessBase } from "./trakmate-summary.harness.base";

export class TrakmateSummaryHarnessE2e implements TrakmateSummaryHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
