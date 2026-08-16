import { ComponentHarness } from "@angular/cdk/testing";

import { DemoConfigModalHarnessBase } from "./demo-config-modal.harness.base";

export class DemoConfigModalHarness
  extends ComponentHarness
  implements DemoConfigModalHarnessBase
{
  static hostSelector = DemoConfigModalHarnessBase.hostSelector;

  protected getOverlay = this.locatorForOptional(
    DemoConfigModalHarnessBase.selectors.overlay,
  );
  protected getCloseButton = this.locatorFor(
    DemoConfigModalHarnessBase.selectors.closeButton,
  );

  async isVisible(): Promise<boolean> {
    const overlay = await this.getOverlay();
    return overlay !== null;
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseButton();
    await btn.click();
  }
}
