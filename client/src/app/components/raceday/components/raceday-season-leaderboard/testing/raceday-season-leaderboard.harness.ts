import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonLeaderboardHarnessBase } from "./raceday-season-leaderboard.harness.base";

export class RacedaySeasonLeaderboardHarness
  extends ComponentHarness
  implements RacedaySeasonLeaderboardHarnessBase
{
  static hostSelector = RacedaySeasonLeaderboardHarnessBase.hostSelector;

  protected getRows = this.locatorForAll(
    RacedaySeasonLeaderboardHarnessBase.selectors.driverRow,
  );

  async getRowCount(): Promise<number> {
    return (await this.getRows()).length;
  }
}
