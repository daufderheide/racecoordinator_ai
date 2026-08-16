import { Locator } from "@playwright/test";

import { AudioSetEditorHarnessBase } from "./audio-set-editor.harness.base";

export class AudioSetEditorHarnessE2e implements AudioSetEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AudioSetEditorHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get cancelBtn() {
    return this.locator.locator(this.base.selectors.cancelBtn);
  }

  private get saveBtn() {
    return this.locator.locator(this.base.selectors.saveBtn);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async clickSave(): Promise<void> {
    await this.saveBtn.click();
  }
}
