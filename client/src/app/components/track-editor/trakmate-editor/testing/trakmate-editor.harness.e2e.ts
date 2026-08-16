import { Locator } from "@playwright/test";

import { TrakmateEditorHarnessBase } from "./trakmate-editor.harness.base";

export class TrakmateEditorHarnessE2e implements TrakmateEditorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
