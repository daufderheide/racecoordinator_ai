import { ComponentHarness } from "@angular/cdk/testing";

import { HeatDriverExpanderHarnessBase } from "./heat-driver-expander.harness.base";

export class HeatDriverExpanderHarness
  extends ComponentHarness
  implements HeatDriverExpanderHarnessBase
{
  static hostSelector = HeatDriverExpanderHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
