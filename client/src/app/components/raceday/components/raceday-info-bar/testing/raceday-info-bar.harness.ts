import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayInfoBarHarnessBase } from "./raceday-info-bar.harness.base";

export class RacedayInfoBarHarness
  extends ComponentHarness
  implements RacedayInfoBarHarnessBase
{
  static hostSelector = RacedayInfoBarHarnessBase.hostSelector;

  protected getRaceNameEl = this.locatorForOptional(
    RacedayInfoBarHarnessBase.selectors.raceName,
  );
  protected getHeatStatusEl = this.locatorForOptional(
    RacedayInfoBarHarnessBase.selectors.heatStatus,
  );
  protected getTrackNameEl = this.locatorForOptional(
    RacedayInfoBarHarnessBase.selectors.trackName,
  );

  async getRaceName(): Promise<string> {
    const el = await this.getRaceNameEl();
    return el ? await el.text() : "";
  }

  async getHeatStatus(): Promise<string> {
    const el = await this.getHeatStatusEl();
    return el ? await el.text() : "";
  }

  async getTrackName(): Promise<string> {
    const el = await this.getTrackNameEl();
    return el ? await el.text() : "";
  }
}
