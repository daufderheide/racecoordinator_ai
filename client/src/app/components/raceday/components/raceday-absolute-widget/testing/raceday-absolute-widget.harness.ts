import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayAbsoluteWidgetHarnessBase } from "./raceday-absolute-widget.harness.base";

export class RacedayAbsoluteWidgetHarness
  extends ComponentHarness
  implements RacedayAbsoluteWidgetHarnessBase
{
  static hostSelector = RacedayAbsoluteWidgetHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.label,
  );

  protected getRemoveBtnEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.removeBtn,
  );
  protected getDragHeaderEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.dragHeader,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getWidgetTypeLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? await el.text() : "";
  }

  async clickRemove(): Promise<void> {
    const el = await this.getRemoveBtnEl();
    if (el) {
      await el.click();
    }
  }

  async isCustomizing(): Promise<boolean> {
    const el = await this.getDragHeaderEl();
    return el !== null;
  }
}
