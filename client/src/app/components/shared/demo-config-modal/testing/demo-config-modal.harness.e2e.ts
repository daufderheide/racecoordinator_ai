import { Locator } from "@playwright/test";

import { DemoConfigModalHarnessBase } from "./demo-config-modal.harness.base";

export class DemoConfigModalHarnessE2e implements DemoConfigModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return DemoConfigModalHarnessBase;
  }

  private get overlay() {
    return this.locator.locator(this.base.selectors.overlay);
  }

  private get closeButton() {
    return this.locator.locator(this.base.selectors.closeButton);
  }

  async isVisible(): Promise<boolean> {
    return await this.overlay.isVisible();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }
}
