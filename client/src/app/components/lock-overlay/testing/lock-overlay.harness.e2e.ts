import { Locator } from "@playwright/test";

import { LockOverlayHarnessBase } from "./lock-overlay.harness.base";

export class LockOverlayHarnessE2e implements LockOverlayHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return LockOverlayHarnessBase;
  }

  private get overlay() {
    return this.locator.locator(this.base.selectors.overlay);
  }

  private get dismissButton() {
    return this.locator.locator(this.base.selectors.dismissButton);
  }

  async isLocked(): Promise<boolean> {
    return await this.overlay.isVisible();
  }

  async clickDismiss(): Promise<void> {
    await this.dismissButton.click();
  }
}
