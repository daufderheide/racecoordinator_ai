import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonNameHarnessBase } from "./raceday-season-name.harness.base";

export class RacedaySeasonNameHarness
  extends ComponentHarness
  implements RacedaySeasonNameHarnessBase
{
  static hostSelector = RacedaySeasonNameHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedaySeasonNameHarnessBase.selectors.labelText,
  );
  protected getValueEl = this.locatorForOptional(
    RacedaySeasonNameHarnessBase.selectors.valueText,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getLabelText(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? (await el.text()).trim() : "";
  }

  async getSeasonName(): Promise<string> {
    const el = await this.getValueEl();
    return el ? (await el.text()).trim() : "";
  }
}
