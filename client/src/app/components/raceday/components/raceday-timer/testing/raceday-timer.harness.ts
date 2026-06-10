import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayTimerHarnessBase } from "./raceday-timer.harness.base";

export class RacedayTimerHarness
  extends ComponentHarness
  implements RacedayTimerHarnessBase
{
  static hostSelector = RacedayTimerHarnessBase.hostSelector;

  protected getTimerTextEl = this.locatorFor(
    RacedayTimerHarnessBase.selectors.timerText,
  );
  protected getStatusLabelEl = this.locatorForOptional(
    RacedayTimerHarnessBase.selectors.statusLabel,
  );
  protected getWarmupLabelEl = this.locatorForOptional(
    RacedayTimerHarnessBase.selectors.warmupLabel,
  );

  async getTimeText(): Promise<string> {
    return await (await this.getTimerTextEl()).text();
  }

  async getStatusLabel(): Promise<string | null> {
    const el = await this.getStatusLabelEl();
    return el ? await el.text() : null;
  }

  async getWarmupLabel(): Promise<string | null> {
    const el = await this.getWarmupLabelEl();
    return el ? await el.text() : null;
  }
}
