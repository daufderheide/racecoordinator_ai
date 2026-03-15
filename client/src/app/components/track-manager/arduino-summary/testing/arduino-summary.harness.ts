import { ComponentHarness } from '@angular/cdk/testing';
import { ArduinoSummaryHarnessBase } from './arduino-summary.harness.base';

export class ArduinoSummaryHarness extends ComponentHarness implements ArduinoSummaryHarnessBase {
  static hostSelector = 'app-arduino-summary';

  protected getHeader = this.locatorFor('.section-header');
  protected getContent = this.locatorForOptional('.section-content');
  protected getSummaryItems = this.locatorForAll('.summary-item .value');
  protected getBehaviorChecks = this.locatorForAll('.behavior-check');

  async toggleExpanded(): Promise<void> {
    const header = await this.getHeader();
    await header.click();
  }

  async isExpanded(): Promise<boolean> {
    const content = await this.getContent();
    return content !== null;
  }

  async getBoardName(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 0 ? await items[0].text() : '';
  }

  async getCommPort(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 1 ? await items[1].text() : '';
  }

  async getPinCountText(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 2 ? await items[2].text() : '';
  }

  async hasBehavior(label: string): Promise<boolean> {
    const checks = await this.getBehaviorChecks();
    for (const check of checks) {
      const text = await check.text();
      // Use case-insensitive check or accommodate translation
      if (text.toLowerCase().includes(label.toLowerCase())) {
        const checkbox = await check.locatorFor('.check-box')();
        return await checkbox.hasClass('checked');
      }
    }
    return false;
  }
}
