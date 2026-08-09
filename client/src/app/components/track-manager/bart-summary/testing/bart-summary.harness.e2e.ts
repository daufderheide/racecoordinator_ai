import { Locator } from "@playwright/test";

import { BartSummaryHarnessBase } from "./bart-summary.harness.base";

export class BartSummaryHarnessE2e implements BartSummaryHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return BartSummaryHarnessBase;
  }

  private get header() {
    return this.locator.locator(this.base.selectors.header);
  }
  private get content() {
    return this.locator.locator(this.base.selectors.content);
  }
  private get summaryItems() {
    return this.locator.locator(this.base.selectors.summaryValue);
  }
  private get behaviorChecks() {
    return this.locator.locator(this.base.selectors.behaviorCheck);
  }

  async toggleExpanded(): Promise<void> {
    await this.header.click();
  }

  async isExpanded(): Promise<boolean> {
    return await this.content.isVisible();
  }

  async getDeviceName(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(0).innerText();
  }

  async getMinLapTime(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(1).innerText();
  }

  async getPitBehavior(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(2).innerText();
  }

  async getChannelCountText(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(3).innerText();
  }

  async hasBehavior(label: string): Promise<boolean> {
    const checks = this.behaviorChecks;
    const count = await checks.count();
    for (let i = 0; i < count; i++) {
      const check = checks.nth(i);
      const text = await check.innerText();
      if (text.toLowerCase().includes(label.toLowerCase())) {
        const checkbox = check.locator(this.base.selectors.checkBox);
        const classes = await checkbox.getAttribute("class");
        return classes ? classes.includes("checked") : false;
      }
    }
    return false;
  }
}
