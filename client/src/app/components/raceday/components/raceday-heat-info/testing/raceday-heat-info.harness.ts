import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayHeatInfoHarnessBase } from "./raceday-heat-info.harness.base";

export class RacedayHeatInfoHarness
  extends ComponentHarness
  implements RacedayHeatInfoHarnessBase
{
  static hostSelector = RacedayHeatInfoHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedayHeatInfoHarnessBase.selectors.label,
  );
  protected getHeatStatusEl = this.locatorForOptional(
    RacedayHeatInfoHarnessBase.selectors.heatStatus,
  );

  async getLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? await el.text() : "";
  }

  async getHeatStatus(): Promise<string> {
    const el = await this.getHeatStatusEl();
    return el ? await el.text() : "";
  }
}
