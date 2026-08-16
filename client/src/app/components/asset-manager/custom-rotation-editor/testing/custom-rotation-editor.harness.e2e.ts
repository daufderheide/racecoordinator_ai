import { Locator } from "@playwright/test";

import { CustomRotationEditorHarnessBase } from "./custom-rotation-editor.harness.base";

export class CustomRotationEditorHarnessE2e implements CustomRotationEditorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
