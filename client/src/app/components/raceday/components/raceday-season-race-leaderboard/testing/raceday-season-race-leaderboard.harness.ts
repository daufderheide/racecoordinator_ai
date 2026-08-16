import { ComponentHarness } from "@angular/cdk/testing";

import { RacedaySeasonRaceLeaderboardHarnessBase } from "./raceday-season-race-leaderboard.harness.base";

export class RacedaySeasonRaceLeaderboardHarness
  extends ComponentHarness
  implements RacedaySeasonRaceLeaderboardHarnessBase
{
  static hostSelector = RacedaySeasonRaceLeaderboardHarnessBase.hostSelector;

  protected getRows = this.locatorForAll(
    RacedaySeasonRaceLeaderboardHarnessBase.selectors.driverRow,
  );

  async getRowCount(): Promise<number> {
    return (await this.getRows()).length;
  }
}
