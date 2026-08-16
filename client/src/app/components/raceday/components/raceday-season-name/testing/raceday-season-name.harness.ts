import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonNameHarnessBase } from "./raceday-season-name.harness.base";

export class RacedaySeasonNameHarness
  extends ComponentHarness
  implements RacedaySeasonNameHarnessBase
{
  static hostSelector = RacedaySeasonNameHarnessBase.hostSelector;

  protected getValueText = this.locatorForOptional(
    RacedaySeasonNameHarnessBase.selectors.valueText,
  );

  async getSeasonName(): Promise<string> {
    const el = await this.getValueText();
    return el ? await el.text() : "";
  }
}
