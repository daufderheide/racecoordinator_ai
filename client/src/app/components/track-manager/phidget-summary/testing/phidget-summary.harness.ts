import { ComponentHarness } from "@angular/cdk/testing";

import { PhidgetSummaryHarnessBase } from "./phidget-summary.harness.base";

export class PhidgetSummaryHarness
  extends ComponentHarness
  implements PhidgetSummaryHarnessBase
{
  static hostSelector = PhidgetSummaryHarnessBase.hostSelector;

  protected getHeader = this.locatorFor(
    PhidgetSummaryHarnessBase.selectors.header,
  );
  protected getContent = this.locatorForOptional(
    PhidgetSummaryHarnessBase.selectors.content,
  );
  protected getSummaryItems = this.locatorForAll(
    PhidgetSummaryHarnessBase.selectors.summaryValue,
  );
  protected getBehaviorChecks = this.locatorForAll(
    PhidgetSummaryHarnessBase.selectors.behaviorCheck,
  );
  protected getBehaviorCheckBoxes = this.locatorForAll(
    `${PhidgetSummaryHarnessBase.selectors.behaviorCheck} ${PhidgetSummaryHarnessBase.selectors.checkBox}`,
  );

  async toggleExpanded(): Promise<void> {
    const header = await this.getHeader();
    await header.click();
  }

  async isExpanded(): Promise<boolean> {
    const content = await this.getContent();
    return content !== null;
  }

  async getDeviceName(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 0 ? await items[0].text() : "";
  }

  async getSerialNumber(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 1 ? await items[1].text() : "";
  }

  async getHubPort(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 2 ? await items[2].text() : "";
  }

  async getPinCountText(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 3 ? await items[3].text() : "";
  }

  async hasBehavior(label: string): Promise<boolean> {
    const checks = await this.getBehaviorChecks();
    const boxes = await this.getBehaviorCheckBoxes();
    for (let i = 0; i < checks.length; i++) {
      const text = await checks[i].text();
      if (text.toLowerCase().includes(label.toLowerCase())) {
        return await boxes[i].hasClass("checked");
      }
    }
    return false;
  }
}
