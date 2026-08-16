import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultRaceResultsHarnessBase } from "./default-race-results.harness.base";

export class DefaultRaceResultsHarness
  extends ComponentHarness
  implements DefaultRaceResultsHarnessBase
{
  static hostSelector = DefaultRaceResultsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
