import { Locator } from "@playwright/test";

import { RecordsInspectorHarnessBase } from "./records-inspector.harness.base";

export class RecordsInspectorHarnessE2e implements RecordsInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RecordsInspectorHarnessBase;
  }

  private get checkboxes() {
    return this.locator.locator(this.base.selectors.checkboxes);
  }

  private get selects() {
    return this.locator.locator(this.base.selectors.selects);
  }

  private get sliders() {
    return this.locator.locator(this.base.selectors.sliders);
  }

  private get colorPickers() {
    return this.locator.locator(this.base.selectors.colorPickers);
  }

  private get resetButtons() {
    return this.locator.locator(this.base.selectors.resetButtons);
  }

  async getShowRaceRecordLap(): Promise<boolean> {
    return await this.checkboxes.nth(0).isChecked();
  }

  async setShowRaceRecordLap(val: boolean): Promise<void> {
    await this.checkboxes.nth(0).setChecked(val);
  }

  async getShowRaceRecordScore(): Promise<boolean> {
    return await this.checkboxes.nth(1).isChecked();
  }

  async setShowRaceRecordScore(val: boolean): Promise<void> {
    await this.checkboxes.nth(1).setChecked(val);
  }

  async getShowCurrentRaceBest(): Promise<boolean> {
    return await this.checkboxes.nth(2).isChecked();
  }

  async setShowCurrentRaceBest(val: boolean): Promise<void> {
    await this.checkboxes.nth(2).setChecked(val);
  }

  async getShowHeatBest(): Promise<boolean> {
    return await this.checkboxes.nth(3).isChecked();
  }

  async setShowHeatBest(val: boolean): Promise<void> {
    await this.checkboxes.nth(3).setChecked(val);
  }

  async getHeaderFontFamily(): Promise<string> {
    return (await this.selects.nth(0).getAttribute("data-value")) || "";
  }

  async setHeaderFontFamily(val: string): Promise<void> {
    const sel = this.selects.nth(0);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option:has-text("${val}")`).click();
  }

  async getHeaderFontSize(): Promise<number> {
    const val = await this.sliders.nth(0).inputValue();
    return Number(val);
  }

  async setHeaderFontSize(val: number): Promise<void> {
    await this.sliders.nth(0).fill(val.toString());
  }

  async getHeaderTextColor(): Promise<string> {
    return await this.colorPickers.nth(0).inputValue();
  }

  async setHeaderTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(0).fill(val);
  }

  async clickResetHeaderTextColor(): Promise<void> {
    const wrapper = this.locator.locator(".color-picker-wrapper").nth(0);
    await wrapper.locator(".color-reset-btn").click();
  }

  async getValueFontFamily(): Promise<string> {
    return (await this.selects.nth(1).getAttribute("data-value")) || "";
  }

  async setValueFontFamily(val: string): Promise<void> {
    const sel = this.selects.nth(1);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option:has-text("${val}")`).click();
  }

  async getValueFontSize(): Promise<number> {
    const val = await this.sliders.nth(1).inputValue();
    return Number(val);
  }

  async setValueFontSize(val: number): Promise<void> {
    await this.sliders.nth(1).fill(val.toString());
  }

  async getValueTextColor(): Promise<string> {
    return await this.colorPickers.nth(1).inputValue();
  }

  async setValueTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(1).fill(val);
  }

  async clickResetValueTextColor(): Promise<void> {
    const wrapper = this.locator.locator(".color-picker-wrapper").nth(1);
    await wrapper.locator(".color-reset-btn").click();
  }
}
