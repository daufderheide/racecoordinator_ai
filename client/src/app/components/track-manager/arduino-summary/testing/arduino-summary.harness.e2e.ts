import { Locator } from '@playwright/test';
import { ArduinoSummaryHarnessBase } from './arduino-summary.harness.base';

export class ArduinoSummaryHarnessE2e implements ArduinoSummaryHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ArduinoSummaryHarnessBase; }

  private get header() { return this.locator.locator(this.base.selectors.header); }
  private get content() { return this.locator.locator(this.base.selectors.content); }
  private get summaryItems() { return this.locator.locator(this.base.selectors.summaryValue); }
  private get behaviorChecks() { return this.locator.locator(this.base.selectors.behaviorCheck); }

  async toggleExpanded(): Promise<void> {
    await this.header.click();
  }

  async isExpanded(): Promise<boolean> {
    return await this.content.isVisible();
  }

  async getBoardName(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(0).innerText();
  }

  async getCommPort(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(1).innerText();
  }

  async getPinCountText(): Promise<string> {
    const items = this.summaryItems;
    return await items.nth(2).innerText();
  }

  async hasBehavior(label: string): Promise<boolean> {
    const checks = this.behaviorChecks;
    const count = await checks.count();
    for (let i = 0; i < count; i++) {
       const check = checks.nth(i);
       const text = await check.innerText();
       if (text.toLowerCase().includes(label.toLowerCase())) {
         const checkbox = check.locator(this.base.selectors.checkBox);
         const classes = await checkbox.getAttribute('class');
         return classes ? classes.includes('checked') : false;
       }
    }
    return false;
  }
}
