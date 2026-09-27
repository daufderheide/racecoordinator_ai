import { Locator } from "@playwright/test";

import { RacedayEventNameHarnessBase } from "./raceday-event-name.harness.base";

export class RacedayEventNameHarnessE2e implements RacedayEventNameHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayEventNameHarnessBase;
  }

  private get label() {
    return this.locator.locator(this.base.selectors.label).first();
  }

  private get eventName() {
    return this.locator.locator(this.base.selectors.eventName).first();
  }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async getLabel(): Promise<string> {
    return (await this.label.isVisible())
      ? (await this.label.innerText()).trim()
      : "";
  }

  async getEventName(): Promise<string> {
    return (await this.eventName.isVisible())
      ? (await this.eventName.innerText()).trim()
      : "";
  }
}
