import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonRaceLeaderboardHarnessBase } from "./raceday-season-race-leaderboard.harness.base";

export class RacedaySeasonRaceLeaderboardHarness
  extends ComponentHarness
  implements RacedaySeasonRaceLeaderboardHarnessBase
{
  static hostSelector = RacedaySeasonRaceLeaderboardHarnessBase.hostSelector;

  protected getTitleEl = this.locatorForOptional(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.title,
  );
  protected getEmptyMessageEl = this.locatorForOptional(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.emptyMessage,
  );
  protected getRows = this.locatorForAll(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.item,
  );
  protected getNames = this.locatorForAll(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.name,
  );
  protected getScoresList = this.locatorForAll(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.score,
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
