import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayHeatDriversHarnessBase } from "./raceday-heat-drivers.harness.base";

export class RacedayHeatDriversHarness
  extends ComponentHarness
  implements RacedayHeatDriversHarnessBase
{
  static hostSelector = RacedayHeatDriversHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
