import { Locator } from "@playwright/test";

import { HeatDriverExpanderHarnessBase } from "./heat-driver-expander.harness.base";

export class HeatDriverExpanderHarnessE2e implements HeatDriverExpanderHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
