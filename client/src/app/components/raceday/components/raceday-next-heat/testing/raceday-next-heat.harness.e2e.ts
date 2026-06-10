import { Locator } from "@playwright/test";

import { RacedayNextHeatHarnessBase } from "./raceday-next-heat.harness.base";

export class RacedayNextHeatHarnessE2e implements RacedayNextHeatHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayNextHeatHarnessBase;
  }

  private get title() {
    return this.locator.locator(this.base.selectors.title).first();
  }

  private get items() {
    return this.locator.locator(this.base.selectors.item);
  }

  async getTitle(): Promise<string> {
    return await this.title.innerText();
  }

  async getEntryCount(): Promise<number> {
    return await this.items.count();
  }

  async getEntryDriverName(index: number): Promise<string> {
    return await this.items
      .nth(index)
      .locator(this.base.selectors.driverName)
      .innerText();
  }

  async getEntryLaneText(index: number): Promise<string> {
    return await this.items
      .nth(index)
      .locator(this.base.selectors.laneBadge)
      .innerText();
  }
}
