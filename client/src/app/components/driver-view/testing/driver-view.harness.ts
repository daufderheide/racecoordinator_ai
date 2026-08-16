import { ComponentHarness } from "@angular/cdk/testing";

import { DriverViewHarnessBase } from "./driver-view.harness.base";

export class DriverViewHarness
  extends ComponentHarness
  implements DriverViewHarnessBase
{
  static hostSelector = DriverViewHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
