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

  private get columnDecimalsSelects() {
    return this.locator.locator(this.base.selectors.columnDecimalsSelects);
  }

  async getColumnDecimals(columnIndex: number): Promise<number> {
    const val = await this.columnDecimalsSelects
      .nth(columnIndex)
      .getAttribute("data-value");
    return Number(val);
  }

  async setColumnDecimals(columnIndex: number, val: number): Promise<void> {
    const sel = this.columnDecimalsSelects.nth(columnIndex);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option[data-value="${val}"]`).click();
  }

  async getTimeDecimalPlaces(): Promise<number> {
    const count = await this.columnDecimalsSelects.count();
    if (count > 1) {
      return this.getColumnDecimals(1);
    }
    const val = await this.selects.nth(1).getAttribute("data-value");
    return Number(val);
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    const count = await this.columnDecimalsSelects.count();
    if (count > 1) {
      await this.setColumnDecimals(1, val);
      return;
    }
    const sel = this.selects.nth(1);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option[data-value="${val}"]`).click();
  }

  async getLapDecimalPlaces(): Promise<number> {
    const count = await this.columnDecimalsSelects.count();
    if (count > 0) {
      return this.getColumnDecimals(0);
    }
    const val = await this.selects.nth(2).getAttribute("data-value");
    return Number(val);
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    const count = await this.columnDecimalsSelects.count();
    if (count > 0) {
      await this.setColumnDecimals(0, val);
      return;
    }
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
