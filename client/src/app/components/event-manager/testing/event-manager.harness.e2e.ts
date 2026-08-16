import { Locator } from "@playwright/test";

import { EventManagerHarnessBase } from "./event-manager.harness.base";

export class EventManagerHarnessE2e implements EventManagerHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
