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
  protected getMoveForwardBtnEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.moveForwardBtn,
  );
  protected getMoveBackwardBtnEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.moveBackwardBtn,
  );
  protected getRemoveBtnEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.removeBtn,
  );
  protected getDragHeaderEl = this.locatorForOptional(
    RacedayAbsoluteWidgetHarnessBase.selectors.dragHeader,
  );

  async getWidgetTypeLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? await el.text() : "";
  }

  async clickMoveForward(): Promise<void> {
    const el = await this.getMoveForwardBtnEl();
    if (el) {
      await el.click();
    }
  }

  async clickMoveBackward(): Promise<void> {
    const el = await this.getMoveBackwardBtnEl();
    if (el) {
      await el.click();
    }
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
