import { ComponentHarness } from "@angular/cdk/testing";

import { DefaultPredictionResultsHarnessBase } from "./default-prediction-results.harness.base";

export class DefaultPredictionResultsHarness
  extends ComponentHarness
  implements DefaultPredictionResultsHarnessBase
{
  static hostSelector = DefaultPredictionResultsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
