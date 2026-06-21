import { Locator } from "@playwright/test";

import { LaneViewInspectorHarnessBase } from "./lane-view-inspector.harness.base";

export class LaneViewInspectorHarnessE2e implements LaneViewInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return LaneViewInspectorHarnessBase;
  }

  private get selects() {
    return this.locator.locator(this.base.selectors.selects);
  }

  async getTimeDecimalPlaces(): Promise<number> {
    const val = await this.selects.nth(1).inputValue();
    return Number(val);
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    await this.selects.nth(1).selectOption({ value: val.toString() });
  }

  async getLapDecimalPlaces(): Promise<number> {
    const val = await this.selects.nth(2).inputValue();
    return Number(val);
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    await this.selects.nth(2).selectOption({ value: val.toString() });
  }
}
