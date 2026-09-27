import { Locator } from "@playwright/test";

import { RacedaySeasonLeaderboardHarnessBase } from "./raceday-season-leaderboard.harness.base";

export class RacedaySeasonLeaderboardHarnessE2e implements RacedaySeasonLeaderboardHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedaySeasonLeaderboardHarnessBase;
  }

  private get title() {
    return this.locator.locator(this.base.selectors.title).first();
  }

  private get emptyMessage() {
    return this.locator.locator(this.base.selectors.emptyMessage).first();
  }

  private get rows() {
    return this.locator.locator(this.base.selectors.item);
  }

  private get names() {
    return this.locator.locator(this.base.selectors.name);
  }

  private get scores() {
    return this.locator.locator(this.base.selectors.score);
  }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async getTitle(): Promise<string> {
    if (await this.title.isVisible()) {
      return (await this.title.innerText()).trim();
    }
    return "";
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyMessage.isVisible();
  }

  async getEmptyMessage(): Promise<string> {
    if (await this.emptyMessage.isVisible()) {
      return (await this.emptyMessage.innerText()).trim();
    }
    return "";
  }

  async getRowCount(): Promise<number> {
    return await this.rows.count();
  }

  async getDriverNames(): Promise<string[]> {
    return (await this.names.allInnerTexts()).map((s) => s.trim());
  }

  async getDriverName(index: number): Promise<string> {
    const names = await this.getDriverNames();
    return names[index] || "";
  }

  async getScores(): Promise<string[]> {
    return (await this.scores.allInnerTexts()).map((s) => s.trim());
  }

  async getScore(index: number): Promise<string> {
    const scores = await this.getScores();
    return scores[index] || "";
  }
}
