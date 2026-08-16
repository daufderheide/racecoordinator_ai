import { ComponentHarness } from "@angular/cdk/testing";

import { LockOverlayHarnessBase } from "./lock-overlay.harness.base";

export class LockOverlayHarness
  extends ComponentHarness
  implements LockOverlayHarnessBase
{
  static hostSelector = LockOverlayHarnessBase.hostSelector;

  protected getOverlay = this.locatorForOptional(
    LockOverlayHarnessBase.selectors.overlay,
  );
  protected getDismissButton = this.locatorForOptional(
    LockOverlayHarnessBase.selectors.dismissButton,
  );

  async isLocked(): Promise<boolean> {
    const overlay = await this.getOverlay();
    return overlay !== null;
  }

  async clickDismiss(): Promise<void> {
    const btn = await this.getDismissButton();
    if (btn) {
      await btn.click();
    }
  }
}
