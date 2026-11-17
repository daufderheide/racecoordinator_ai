import { Locator } from "@playwright/test";

import { FlagInspectorHarnessBase } from "./flag-inspector.harness.base";

export class FlagInspectorHarnessE2e implements FlagInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return FlagInspectorHarnessBase;
  }

  private get colorPickers() {
    return this.locator.locator(this.base.selectors.colorPickers);
  }

  async getBackgroundColor(): Promise<string> {
    return await this.colorPickers.nth(0).inputValue();
  }

  async setBackgroundColor(val: string): Promise<void> {
    await this.colorPickers.nth(0).fill(val);
  }

  async clickResetBackgroundColor(): Promise<void> {
    const wrapper = this.locator.locator(".color-picker-wrapper").nth(0);
    await wrapper.locator(".color-reset-btn").click();
  }
}
