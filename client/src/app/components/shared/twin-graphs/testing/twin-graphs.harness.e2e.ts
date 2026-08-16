import { Locator } from "@playwright/test";

import { TwinGraphsHarnessBase } from "./twin-graphs.harness.base";

export class TwinGraphsHarnessE2e implements TwinGraphsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
