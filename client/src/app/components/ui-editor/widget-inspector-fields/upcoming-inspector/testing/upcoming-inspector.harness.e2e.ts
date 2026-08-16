import { Locator } from "@playwright/test";

import { UpcomingInspectorHarnessBase } from "./upcoming-inspector.harness.base";

export class UpcomingInspectorHarnessE2e implements UpcomingInspectorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
