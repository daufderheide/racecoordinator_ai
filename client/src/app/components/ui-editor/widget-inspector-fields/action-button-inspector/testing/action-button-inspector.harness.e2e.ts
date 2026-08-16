import { Locator } from "@playwright/test";

import { ActionButtonInspectorHarnessBase } from "./action-button-inspector.harness.base";

export class ActionButtonInspectorHarnessE2e implements ActionButtonInspectorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
