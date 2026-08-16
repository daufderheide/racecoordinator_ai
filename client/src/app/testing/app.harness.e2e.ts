import { Locator } from "@playwright/test";

import { AppHarnessBase } from "./app.harness.base";

export class AppHarnessE2e implements AppHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
