import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayRaceNameHarnessBase } from "./raceday-race-name.harness.base";

export class RacedayRaceNameHarness
  extends ComponentHarness
  implements RacedayRaceNameHarnessBase
{
  static hostSelector = RacedayRaceNameHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedayRaceNameHarnessBase.selectors.label,
  );
  protected getRaceNameEl = this.locatorForOptional(
    RacedayRaceNameHarnessBase.selectors.raceName,
  );

  async getLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? await el.text() : "";
  }

  async getRaceName(): Promise<string> {
    const el = await this.getRaceNameEl();
    return el ? await el.text() : "";
  }
}
