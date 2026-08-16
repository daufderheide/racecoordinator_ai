import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultSeasonResultsHarnessBase } from "./default-season-results.harness.base";

export class DefaultSeasonResultsHarness
  extends ComponentHarness
  implements DefaultSeasonResultsHarnessBase
{
  static hostSelector = DefaultSeasonResultsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
