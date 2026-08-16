import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayActionButtonHarnessBase } from "./raceday-action-button.harness.base";

export class RacedayActionButtonHarness
  extends ComponentHarness
  implements RacedayActionButtonHarnessBase
{
  static hostSelector = RacedayActionButtonHarnessBase.hostSelector;

  protected getButton = this.locatorForOptional("button");

  async click(): Promise<void> {
    const btn = await this.getButton();
    if (btn) {
      await btn.click();
    }
  }

  async isDisabled(): Promise<boolean> {
    const btn = await this.getButton();
    return btn ? await btn.getProperty("disabled") : true;
  }
}
