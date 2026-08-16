import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultDriverResultsHarnessBase } from "./default-driver-results.harness.base";

export class DefaultDriverResultsHarness
  extends ComponentHarness
  implements DefaultDriverResultsHarnessBase
{
  static hostSelector = DefaultDriverResultsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
