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

  private get removeBtn() {
    return this.locator.locator(this.base.selectors.removeBtn).first();
  }

  private get dragHeader() {
    return this.locator.locator(this.base.selectors.dragHeader).first();
  }

  private get widgetWrapper() {
    return this.locator.locator(this.base.selectors.widgetWrapper).first();
  }

  async isVisible(): Promise<boolean> {
    return await this.widgetWrapper.isVisible();
  }

  async getWidgetTypeLabel(): Promise<string> {
    return (await this.label.isVisible()) ? await this.label.innerText() : "";
  }

  async clickRemove(): Promise<void> {
    await this.removeBtn.click();
  }

  async isCustomizing(): Promise<boolean> {
    return await this.dragHeader.isVisible();
  }
}
