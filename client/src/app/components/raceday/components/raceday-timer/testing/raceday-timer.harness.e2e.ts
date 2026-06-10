import { Locator } from "@playwright/test";

import { RacedayTimerHarnessBase } from "./raceday-timer.harness.base";

export class RacedayTimerHarnessE2e implements RacedayTimerHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayTimerHarnessBase;
  }

  private get timerText() {
    return this.locator.locator(this.base.selectors.timerText).first();
  }

  private get statusLabel() {
    return this.locator.locator(this.base.selectors.statusLabel).first();
  }

  private get warmupLabel() {
    return this.locator.locator(this.base.selectors.warmupLabel).first();
  }

  async getTimeText(): Promise<string> {
    return await this.timerText.innerText();
  }

  async getStatusLabel(): Promise<string | null> {
    if (await this.statusLabel.isVisible()) {
      return await this.statusLabel.innerText();
    }
    return null;
  }

  async getWarmupLabel(): Promise<string | null> {
    if (await this.warmupLabel.isVisible()) {
      return await this.warmupLabel.innerText();
    }
    return null;
  }
}
