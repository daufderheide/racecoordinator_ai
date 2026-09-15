import { ComponentHarness } from "@angular/cdk/testing";

import { CameraSummaryHarnessBase } from "./camera-summary.harness.base";

export class CameraSummaryHarness
  extends ComponentHarness
  implements CameraSummaryHarnessBase
{
  static hostSelector = CameraSummaryHarnessBase.hostSelector;

  protected getHeader = this.locatorFor(
    CameraSummaryHarnessBase.selectors.header,
  );
  protected getContent = this.locatorForOptional(
    CameraSummaryHarnessBase.selectors.content,
  );
  protected getSummaryItems = this.locatorForAll(
    CameraSummaryHarnessBase.selectors.summaryValue,
  );
  protected getBehaviorChecks = this.locatorForAll(
    CameraSummaryHarnessBase.selectors.behaviorCheck,
  );
  protected getBehaviorCheckBoxes = this.locatorForAll(
    `${CameraSummaryHarnessBase.selectors.behaviorCheck} ${CameraSummaryHarnessBase.selectors.checkBox}`,
  );

  async toggleExpanded(): Promise<void> {
    const header = await this.getHeader();
    await header.click();
  }

  async isExpanded(): Promise<boolean> {
    const content = await this.getContent();
    return content !== null;
  }

  async getTargetFps(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 0 ? await items[0].text() : "";
  }

  async getAutoDetectLanes(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 1 ? await items[1].text() : "";
  }

  async getGateCountText(): Promise<string> {
    const items = await this.getSummaryItems();
    return items.length > 2 ? await items[2].text() : "";
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
