import { Locator } from "@playwright/test";

import { DriverViewHarnessBase } from "./driver-view.harness.base";

export class DriverViewHarnessE2e implements DriverViewHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
