import { ComponentHarness } from '@angular/cdk/testing';
import { ArduinoSummaryHarnessBase } from './arduino-summary.harness.base';

export class ArduinoSummaryHarness extends ComponentHarness implements ArduinoSummaryHarnessBase {
  static hostSelector = ArduinoSummaryHarnessBase.hostSelector;

  protected getHeader = this.locatorFor(ArduinoSummaryHarnessBase.selectors.header);
  protected getContent = this.locatorForOptional(ArduinoSummaryHarnessBase.selectors.content);
  protected getSummaryItems = this.locatorForAll(ArduinoSummaryHarnessBase.selectors.summaryValue);
  protected getBehaviorChecks = this.locatorForAll(ArduinoSummaryHarnessBase.selectors.behaviorCheck);

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
      if (text.toLowerCase().includes(label.toLowerCase())) {
        const checkbox = await check.locatorFor(ArduinoSummaryHarnessBase.selectors.checkBox)();
        return await checkbox.hasClass('checked');
      }
    }
    return false;
  }
}
