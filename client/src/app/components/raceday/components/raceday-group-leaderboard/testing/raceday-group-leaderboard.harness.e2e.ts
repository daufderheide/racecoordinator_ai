import { Locator } from "@playwright/test";

import { RacedayGroupLeaderboardHarnessBase } from "./raceday-group-leaderboard.harness.base";

export class RacedayGroupLeaderboardHarnessE2e implements RacedayGroupLeaderboardHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayGroupLeaderboardHarnessBase;
  }

  private get title() {
    return this.locator.locator(this.base.selectors.title).first();
  }

  private get subtitle() {
    return this.locator.locator(this.base.selectors.subtitle).first();
  }

  private get emptyMessage() {
    return this.locator.locator(this.base.selectors.emptyMessage).first();
  }

  private get items() {
    return this.locator.locator(this.base.selectors.item);
  }

  async getTitle(): Promise<string> {
    return await this.title.innerText();
  }

  async getSubtitle(): Promise<string> {
    if ((await this.subtitle.count()) > 0) {
      return await this.subtitle.innerText();
    }
    return "";
  }

  async getEmptyMessage(): Promise<string> {
    if ((await this.emptyMessage.count()) > 0) {
      return await this.emptyMessage.innerText();
    }
    return "";
  }

  async getEntryCount(): Promise<number> {
    return await this.items.count();
  }

  async getEntryText(index: number): Promise<string> {
    return await this.items.nth(index).innerText();
  }

  async getEntryDetail(
    index: number,
  ): Promise<{ rank: string; name: string; score: string }> {
    const item = this.items.nth(index);
    const rank = await item.locator(this.base.selectors.rank).innerText();
    const name = await item.locator(this.base.selectors.name).innerText();
    const score = await item.locator(this.base.selectors.score).innerText();
    return { rank, name, score };
  }
}
