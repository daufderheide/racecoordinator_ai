import { Locator } from "@playwright/test";

import { TimerInspectorHarnessBase } from "./timer-inspector.harness.base";

export class TimerInspectorHarnessE2e implements TimerInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return TimerInspectorHarnessBase;
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

  async getTimeFontFamily(): Promise<string> {
    return await this.selects.nth(0).inputValue();
  }

  async setTimeFontFamily(val: string): Promise<void> {
    await this.selects.nth(0).selectOption({ label: val });
  }

  async getTimeFontSize(): Promise<number> {
    const val = await this.sliders.nth(0).inputValue();
    return Number(val);
  }

  async setTimeFontSize(val: number): Promise<void> {
    await this.sliders.nth(0).fill(val.toString());
  }

  async getTimeTextColor(): Promise<string> {
    return await this.colorPickers.nth(0).inputValue();
  }

  async setTimeTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(0).fill(val);
  }

  async clickResetTimeTextColor(): Promise<void> {
    const wrapper = this.locator.locator(".color-picker-wrapper").nth(0);
    await wrapper.locator(".color-reset-btn").click();
  }
}
