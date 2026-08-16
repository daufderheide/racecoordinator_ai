import { ComponentHarness } from "@angular/cdk/testing";

import { TrakmateSummaryHarnessBase } from "./trakmate-summary.harness.base";

export class TrakmateSummaryHarness
  extends ComponentHarness
  implements TrakmateSummaryHarnessBase
{
  static hostSelector = TrakmateSummaryHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
