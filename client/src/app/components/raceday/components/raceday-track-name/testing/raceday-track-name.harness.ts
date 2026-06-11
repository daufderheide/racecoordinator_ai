import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayTrackNameHarnessBase } from "./raceday-track-name.harness.base";

export class RacedayTrackNameHarness
  extends ComponentHarness
  implements RacedayTrackNameHarnessBase
{
  static hostSelector = RacedayTrackNameHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedayTrackNameHarnessBase.selectors.label,
  );
  protected getTrackNameEl = this.locatorForOptional(
    RacedayTrackNameHarnessBase.selectors.trackName,
  );

  async getLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? await el.text() : "";
  }

  async getTrackName(): Promise<string> {
    const el = await this.getTrackNameEl();
    return el ? await el.text() : "";
  }
}
