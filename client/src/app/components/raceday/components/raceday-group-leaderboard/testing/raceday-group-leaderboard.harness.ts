import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayGroupLeaderboardHarnessBase } from "./raceday-group-leaderboard.harness.base";

export class RacedayGroupLeaderboardItemHarness extends ComponentHarness {
  static hostSelector = RacedayGroupLeaderboardHarnessBase.selectors.item;

  protected getRankEl = this.locatorFor(
    RacedayGroupLeaderboardHarnessBase.selectors.rank,
  );
  protected getNameEl = this.locatorFor(
    RacedayGroupLeaderboardHarnessBase.selectors.name,
  );
  protected getScoreEl = this.locatorFor(
    RacedayGroupLeaderboardHarnessBase.selectors.score,
  );

  async getRank(): Promise<string> {
    return await (await this.getRankEl()).text();
  }

  async getName(): Promise<string> {
    return await (await this.getNameEl()).text();
  }

  async getScore(): Promise<string> {
    return await (await this.getScoreEl()).text();
  }
}

export class RacedayGroupLeaderboardHarness
  extends ComponentHarness
  implements RacedayGroupLeaderboardHarnessBase
{
  static hostSelector = RacedayGroupLeaderboardHarnessBase.hostSelector;

  protected getTitleEl = this.locatorFor(
    RacedayGroupLeaderboardHarnessBase.selectors.title,
  );
  protected getSubtitleEl = this.locatorForOptional(
    RacedayGroupLeaderboardHarnessBase.selectors.subtitle,
  );
  protected getEmptyMessageEl = this.locatorForOptional(
    RacedayGroupLeaderboardHarnessBase.selectors.emptyMessage,
  );
  protected getItemEls = this.locatorForAll(
    RacedayGroupLeaderboardHarnessBase.selectors.item,
  );
  protected getItemsHarness = this.locatorForAll(
    RacedayGroupLeaderboardItemHarness,
  );

  async getTitle(): Promise<string> {
    return await (await this.getTitleEl()).text();
  }

  async getSubtitle(): Promise<string> {
    const el = await this.getSubtitleEl();
    return el ? await el.text() : "";
  }

  async getEmptyMessage(): Promise<string> {
    const el = await this.getEmptyMessageEl();
    return el ? await el.text() : "";
  }

  async getEntryCount(): Promise<number> {
    return (await this.getItemEls()).length;
  }

  async getEntryText(index: number): Promise<string> {
    const items = await this.getItemEls();
    if (index < items.length) {
      return await items[index].text();
    }
    return "";
  }

  async getEntryDetail(
    index: number,
  ): Promise<{ rank: string; name: string; score: string }> {
    const items = await this.getItemsHarness();
    if (index < items.length) {
      const item = items[index];
      return {
        rank: await item.getRank(),
        name: await item.getName(),
        score: await item.getScore(),
      };
    }
    return { rank: "", name: "", score: "" };
  }
}
