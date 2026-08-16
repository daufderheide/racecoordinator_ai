import { ComponentHarness } from "@angular/cdk/testing";

import { RaceManagerHarnessBase } from "./race-manager.harness.base";

export class RaceManagerHarness
  extends ComponentHarness
  implements RaceManagerHarnessBase
{
  static hostSelector = RaceManagerHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
