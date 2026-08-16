import { ComponentHarness } from "@angular/cdk/testing";

import { TwinGraphsHarnessBase } from "./twin-graphs.harness.base";

export class TwinGraphsHarness
  extends ComponentHarness
  implements TwinGraphsHarnessBase
{
  static hostSelector = TwinGraphsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
