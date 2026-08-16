import { Locator } from "@playwright/test";

import { RacedaySeasonLeaderboardHarnessBase } from "./raceday-season-leaderboard.harness.base";

export class RacedaySeasonLeaderboardHarnessE2e implements RacedaySeasonLeaderboardHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedaySeasonLeaderboardHarnessBase;
  }

  private get rows() {
    return this.locator.locator(this.base.selectors.driverRow);
  }

  async getRowCount(): Promise<number> {
    return await this.rows.count();
  }
}
