import { Locator } from "@playwright/test";

import { RacedayHeatDriversHarnessBase } from "./raceday-heat-drivers.harness.base";

export class RacedayHeatDriversHarnessE2e implements RacedayHeatDriversHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayHeatDriversHarnessBase;
  }

  private get title() {
    return this.locator.locator(this.base.selectors.title).first();
  }

  private get items() {
    return this.locator.locator(this.base.selectors.item);
  }

  private get driverNames() {
    return this.locator.locator(this.base.selectors.driverName);
  }

  private get laneBadges() {
    return this.locator.locator(this.base.selectors.laneBadge);
  }

  private get empty() {
    return this.locator.locator(this.base.selectors.empty).first();
  }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async getTitle(): Promise<string> {
    if (await this.title.isVisible()) {
      return (await this.title.innerText()).trim();
    }
    return "";
  }

  async getDriverCount(): Promise<number> {
    return await this.items.count();
  }

  async getDriverNames(): Promise<string[]> {
    return (await this.driverNames.allInnerTexts()).map((s) => s.trim());
  }

  async getDriverName(index: number): Promise<string> {
    const names = await this.getDriverNames();
    return names[index] || "";
  }

  async getLaneBadges(): Promise<string[]> {
    return (await this.laneBadges.allInnerTexts()).map((s) => s.trim());
  }

  async isEmpty(): Promise<boolean> {
    return await this.empty.isVisible();
  }
}
