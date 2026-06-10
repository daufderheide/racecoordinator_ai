import { Locator } from "@playwright/test";

import { RacedayLeaderboardHarnessBase } from "./raceday-leaderboard.harness.base";

export class RacedayLeaderboardHarnessE2e implements RacedayLeaderboardHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayLeaderboardHarnessBase;
  }

  private get title() {
    return this.locator.locator(this.base.selectors.title).first();
  }

  private get items() {
    return this.locator.locator(this.base.selectors.item);
  }

  async getTitle(): Promise<string> {
    return await this.title.innerText();
  }

  async getEntryCount(): Promise<number> {
    return await this.items.count();
  }

  async getEntryText(index: number): Promise<string> {
    return await this.items.nth(index).innerText();
  }
}
