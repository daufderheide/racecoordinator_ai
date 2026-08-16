import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultDriverStationHarnessBase } from "./default-driver-station.harness.base";

export class DefaultDriverStationHarness
  extends ComponentHarness
  implements DefaultDriverStationHarnessBase
{
  static hostSelector = DefaultDriverStationHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
