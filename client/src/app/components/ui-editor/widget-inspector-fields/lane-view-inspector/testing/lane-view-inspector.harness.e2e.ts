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

  private get widthInputs() {
    return this.locator.locator(this.base.selectors.columnWidthInputs);
  }

  async getTimeDecimalPlaces(): Promise<number> {
    const val = await this.selects.nth(1).getAttribute("data-value");
    return Number(val);
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    const sel = this.selects.nth(1);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option[data-value="${val}"]`).click();
  }

  async getLapDecimalPlaces(): Promise<number> {
    const val = await this.selects.nth(2).getAttribute("data-value");
    return Number(val);
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    const sel = this.selects.nth(2);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option[data-value="${val}"]`).click();
  }

  async getColumnWidth(columnIndex: number): Promise<number> {
    const val = await this.widthInputs.nth(columnIndex).inputValue();
    return Number(val);
  }

  async setColumnWidth(columnIndex: number, val: number): Promise<void> {
    await this.widthInputs.nth(columnIndex).fill(val.toString());
  }
}
