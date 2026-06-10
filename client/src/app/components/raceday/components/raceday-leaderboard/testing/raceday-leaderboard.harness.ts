import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayLeaderboardHarnessBase } from "./raceday-leaderboard.harness.base";

export class RacedayLeaderboardHarness
  extends ComponentHarness
  implements RacedayLeaderboardHarnessBase
{
  static hostSelector = RacedayLeaderboardHarnessBase.hostSelector;

  protected getTitleEl = this.locatorFor(
    RacedayLeaderboardHarnessBase.selectors.title,
  );
  protected getItemEls = this.locatorForAll(
    RacedayLeaderboardHarnessBase.selectors.item,
  );

  async getTitle(): Promise<string> {
    return await (await this.getTitleEl()).text();
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
}
