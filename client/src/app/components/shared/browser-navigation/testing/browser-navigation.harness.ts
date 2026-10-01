import { ComponentHarness } from "@angular/cdk/testing";

import { BrowserNavigationHarnessBase } from "./browser-navigation.harness.base";

export class BrowserNavigationHarness
  extends ComponentHarness
  implements BrowserNavigationHarnessBase
{
  static hostSelector = BrowserNavigationHarnessBase.hostSelector;

  protected getContainerElement = this.locatorForOptional(
    BrowserNavigationHarnessBase.selectors.container,
  );
  protected getBackButtonElement = this.locatorForOptional(
    BrowserNavigationHarnessBase.selectors.backButton,
  );
  protected getForwardButtonElement = this.locatorForOptional(
    BrowserNavigationHarnessBase.selectors.forwardButton,
  );
  protected getCloseButtonElement = this.locatorForOptional(
    BrowserNavigationHarnessBase.selectors.closeButton,
  );

  async isVisible(): Promise<boolean> {
    const container = await this.getContainerElement();
    return container !== null;
  }

  async clickBack(): Promise<void> {
    const btn = await this.getBackButtonElement();
    if (btn) await btn.click();
  }

  async clickForward(): Promise<void> {
    const btn = await this.getForwardButtonElement();
    if (btn) await btn.click();
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseButtonElement();
    if (btn) await btn.click();
  }

  async isBackDisabled(): Promise<boolean> {
    const btn = await this.getBackButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute("disabled")) !== null;
  }

  async isForwardDisabled(): Promise<boolean> {
    const btn = await this.getForwardButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute("disabled")) !== null;
  }

  async hasBackButton(): Promise<boolean> {
    const btn = await this.getBackButtonElement();
    return btn !== null;
  }

  async hasForwardButton(): Promise<boolean> {
    const btn = await this.getForwardButtonElement();
    return btn !== null;
  }

  async hasCloseButton(): Promise<boolean> {
    const btn = await this.getCloseButtonElement();
    return btn !== null;
  }
}
