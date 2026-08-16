import { Locator } from "@playwright/test";

import { PhidgetEditorHarnessBase } from "./phidget-editor.harness.base";

export class PhidgetEditorHarnessE2e implements PhidgetEditorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
