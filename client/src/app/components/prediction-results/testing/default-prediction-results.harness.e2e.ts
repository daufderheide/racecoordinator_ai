import { Locator } from "@playwright/test";

import { DefaultPredictionResultsHarnessBase } from "./default-prediction-results.harness.base";

export class DefaultPredictionResultsHarnessE2e implements DefaultPredictionResultsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
