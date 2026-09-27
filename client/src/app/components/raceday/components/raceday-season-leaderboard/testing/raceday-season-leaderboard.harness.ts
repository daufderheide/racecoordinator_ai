import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonLeaderboardHarnessBase } from "./raceday-season-leaderboard.harness.base";

export class RacedaySeasonLeaderboardHarness
  extends ComponentHarness
  implements RacedaySeasonLeaderboardHarnessBase
{
  static hostSelector = RacedaySeasonLeaderboardHarnessBase.hostSelector;

  protected getTitleEl = this.locatorForOptional(
    RacedaySeasonLeaderboardHarnessBase.selectors.title,
  );
  protected getEmptyMessageEl = this.locatorForOptional(
    RacedaySeasonLeaderboardHarnessBase.selectors.emptyMessage,
  );
  protected getRows = this.locatorForAll(
    RacedaySeasonLeaderboardHarnessBase.selectors.item,
  );
  protected getNames = this.locatorForAll(
    RacedaySeasonLeaderboardHarnessBase.selectors.name,
  );
  protected getScoresList = this.locatorForAll(
    RacedaySeasonLeaderboardHarnessBase.selectors.score,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleEl();
    return el ? (await el.text()).trim() : "";
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getEmptyMessageEl()) !== null;
  }

  async getEmptyMessage(): Promise<string> {
    const el = await this.getEmptyMessageEl();
    return el ? (await el.text()).trim() : "";
  }

  async getRowCount(): Promise<number> {
    return (await this.getRows()).length;
  }

  async getDriverNames(): Promise<string[]> {
    const els = await this.getNames();
    const names: string[] = [];
    for (const el of els) {
      names.push((await el.text()).trim());
    }
    return names;
  }

  async getDriverName(index: number): Promise<string> {
    const names = await this.getDriverNames();
    return names[index] || "";
  }

  async getScores(): Promise<string[]> {
    const els = await this.getScoresList();
    const scores: string[] = [];
    for (const el of els) {
      scores.push((await el.text()).trim());
    }
    return scores;
  }

  async getScore(index: number): Promise<string> {
    const scores = await this.getScores();
    return scores[index] || "";
  }
}
