import { Locator } from "@playwright/test";

import { TextInfoInspectorHarnessBase } from "./text-info-inspector.harness.base";

export class TextInfoInspectorHarnessE2e implements TextInfoInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return TextInfoInspectorHarnessBase;
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

  async getLabelFontFamily(): Promise<string> {
    return (await this.selects.nth(0).getAttribute("data-value")) || "";
  }

  async setLabelFontFamily(val: string): Promise<void> {
    const sel = this.selects.nth(0);
    await sel.locator(".custom-select-trigger").click();
    await sel.locator(`.custom-select-option:has-text("${val}")`).click();
  }

  async getLabelFontSize(): Promise<number> {
    const val = await this.sliders.nth(0).inputValue();
    return Number(val);
  }

  async setLabelFontSize(val: number): Promise<void> {
    await this.sliders.nth(0).fill(val.toString());
  }

  async getLabelTextColor(): Promise<string> {
    return await this.colorPickers.nth(0).inputValue();
  }

  async setLabelTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(0).fill(val);
  }

  async clickResetLabelTextColor(): Promise<void> {
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
