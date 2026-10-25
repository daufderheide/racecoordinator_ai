import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayFlagHarnessBase } from "./raceday-flag.harness.base";

export class RacedayFlagHarness
  extends ComponentHarness
  implements RacedayFlagHarnessBase
{
  static hostSelector = RacedayFlagHarnessBase.hostSelector;

  protected getFlagImageEl = this.locatorForOptional(
    RacedayFlagHarnessBase.selectors.flagImage,
  );

  protected getRaceStateIndicatorEl = this.locatorForOptional(
    RacedayFlagHarnessBase.selectors.raceStateIndicator,
  );

  async getFlagUrl(): Promise<string | null> {
    const el = await this.getFlagImageEl();
    return el ? await el.getAttribute("src") : null;
  }

  async getRaceStateColorClass(): Promise<string | null> {
    const el = await this.getRaceStateIndicatorEl();
    return el ? await el.getAttribute("class") : null;
  }
}
