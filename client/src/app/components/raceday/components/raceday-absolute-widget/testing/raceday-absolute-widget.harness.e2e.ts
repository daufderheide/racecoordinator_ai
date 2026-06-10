import { Locator } from "@playwright/test";

import { RacedayAbsoluteWidgetHarnessBase } from "./raceday-absolute-widget.harness.base";

export class RacedayAbsoluteWidgetHarnessE2e implements RacedayAbsoluteWidgetHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayAbsoluteWidgetHarnessBase;
  }

  private get label() {
    return this.locator.locator(this.base.selectors.label).first();
  }

  private get moveForwardBtn() {
    return this.locator.locator(this.base.selectors.moveForwardBtn).first();
  }

  private get moveBackwardBtn() {
    return this.locator.locator(this.base.selectors.moveBackwardBtn).first();
  }

  private get removeBtn() {
    return this.locator.locator(this.base.selectors.removeBtn).first();
  }

  private get dragHeader() {
    return this.locator.locator(this.base.selectors.dragHeader).first();
  }

  async getWidgetTypeLabel(): Promise<string> {
    return (await this.label.isVisible()) ? await this.label.innerText() : "";
  }

  async clickMoveForward(): Promise<void> {
    await this.moveForwardBtn.click();
  }

  async clickMoveBackward(): Promise<void> {
    await this.moveBackwardBtn.click();
  }

  async clickRemove(): Promise<void> {
    await this.removeBtn.click();
  }

  async isCustomizing(): Promise<boolean> {
    return await this.dragHeader.isVisible();
  }
}
