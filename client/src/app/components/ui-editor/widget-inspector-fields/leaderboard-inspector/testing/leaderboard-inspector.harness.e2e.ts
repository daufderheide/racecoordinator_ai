import { Locator } from "@playwright/test";

import { LeaderboardInspectorHarnessBase } from "./leaderboard-inspector.harness.base";

export class LeaderboardInspectorHarnessE2e implements LeaderboardInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return LeaderboardInspectorHarnessBase;
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

  async getTitleFontFamily(): Promise<string> {
    return await this.selects.nth(0).inputValue();
  }

  async setTitleFontFamily(val: string): Promise<void> {
    await this.selects.nth(0).selectOption({ label: val });
  }

  async getTitleFontSize(): Promise<number> {
    const val = await this.sliders.nth(0).inputValue();
    return Number(val);
  }

  async setTitleFontSize(val: number): Promise<void> {
    await this.sliders.nth(0).fill(val.toString());
  }

  async getTitleTextColor(): Promise<string> {
    return await this.colorPickers.nth(0).inputValue();
  }

  async setTitleTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(0).fill(val);
  }

  async clickResetTitleTextColor(): Promise<void> {
    await this.resetButtons.nth(0).click();
  }

  async getOverallLeaderFontFamily(): Promise<string> {
    return await this.selects.nth(1).inputValue();
  }

  async setOverallLeaderFontFamily(val: string): Promise<void> {
    await this.selects.nth(1).selectOption({ label: val });
  }

  async getOverallLeaderFontSize(): Promise<number> {
    const val = await this.sliders.nth(1).inputValue();
    return Number(val);
  }

  async setOverallLeaderFontSize(val: number): Promise<void> {
    await this.sliders.nth(1).fill(val.toString());
  }

  async getOverallLeaderTextColor(): Promise<string> {
    return await this.colorPickers.nth(1).inputValue();
  }

  async setOverallLeaderTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(1).fill(val);
  }

  async clickResetOverallLeaderTextColor(): Promise<void> {
    // There are up to 3 reset buttons. Depending on which are visible, we click the second one.
    // However, to be more robust, we can locate specifically by the context:
    // overallLeaderTextColor is inside the second config section or color-picker-wrapper.
    // Let's just find the reset button within the corresponding wrapper:
    const overallWrapper = this.locator.locator(".color-picker-wrapper").nth(1);
    await overallWrapper.locator(".color-reset-btn").click();
  }

  async getRestFontFamily(): Promise<string> {
    return await this.selects.nth(2).inputValue();
  }

  async setRestFontFamily(val: string): Promise<void> {
    await this.selects.nth(2).selectOption({ label: val });
  }

  async getRestFontSize(): Promise<number> {
    const val = await this.sliders.nth(2).inputValue();
    return Number(val);
  }

  async setRestFontSize(val: number): Promise<void> {
    await this.sliders.nth(2).fill(val.toString());
  }

  async getRestTextColor(): Promise<string> {
    return await this.colorPickers.nth(2).inputValue();
  }

  async setRestTextColor(val: string): Promise<void> {
    await this.colorPickers.nth(2).fill(val);
  }

  async clickResetRestTextColor(): Promise<void> {
    const restWrapper = this.locator.locator(".color-picker-wrapper").nth(2);
    await restWrapper.locator(".color-reset-btn").click();
  }
}
