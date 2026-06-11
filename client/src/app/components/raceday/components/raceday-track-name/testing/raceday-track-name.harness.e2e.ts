import { Locator } from "@playwright/test";

import { RacedayTrackNameHarnessBase } from "./raceday-track-name.harness.base";

export class RacedayTrackNameHarnessE2e implements RacedayTrackNameHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayTrackNameHarnessBase;
  }

  private get label() {
    return this.locator.locator(this.base.selectors.label).first();
  }

  private get trackName() {
    return this.locator.locator(this.base.selectors.trackName).first();
  }

  async getLabel(): Promise<string> {
    return (await this.label.isVisible()) ? await this.label.innerText() : "";
  }

  async getTrackName(): Promise<string> {
    return (await this.trackName.isVisible())
      ? await this.trackName.innerText()
      : "";
  }
}
