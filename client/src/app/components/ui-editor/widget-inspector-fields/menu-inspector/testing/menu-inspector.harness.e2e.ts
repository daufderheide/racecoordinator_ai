import { Locator } from "@playwright/test";

import { MenuInspectorHarnessBase } from "./menu-inspector.harness.base";

export class MenuInspectorHarnessE2e implements MenuInspectorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
