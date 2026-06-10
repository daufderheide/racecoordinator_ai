import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayFlagHarnessBase } from "./raceday-flag.harness.base";

export class RacedayFlagHarness
  extends ComponentHarness
  implements RacedayFlagHarnessBase
{
  static hostSelector = RacedayFlagHarnessBase.hostSelector;

  protected getFlagImageEl = this.locatorFor(
    RacedayFlagHarnessBase.selectors.flagImage,
  );

  async getFlagUrl(): Promise<string | null> {
    return await (await this.getFlagImageEl()).getAttribute("src");
  }
}
