import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayHarnessBase } from "./raceday.harness.base";

export class RacedayHarness
  extends ComponentHarness
  implements RacedayHarnessBase
{
  static hostSelector = RacedayHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
