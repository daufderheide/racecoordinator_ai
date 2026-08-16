import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultHeatResultsHarnessBase } from "./default-heat-results.harness.base";

export class DefaultHeatResultsHarness
  extends ComponentHarness
  implements DefaultHeatResultsHarnessBase
{
  static hostSelector = DefaultHeatResultsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
