import { Locator } from "@playwright/test";

import { EventEditorHarnessBase } from "./event-editor.harness.base";

export class EventEditorHarnessE2e implements EventEditorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
