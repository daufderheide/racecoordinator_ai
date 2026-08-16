import { Locator } from "@playwright/test";

import { DefaultSeasonResultsHarnessBase } from "./default-season-results.harness.base";

export class DefaultSeasonResultsHarnessE2e implements DefaultSeasonResultsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
