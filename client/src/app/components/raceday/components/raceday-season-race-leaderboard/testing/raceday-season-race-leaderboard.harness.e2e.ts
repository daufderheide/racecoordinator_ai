import { Locator } from "@playwright/test";

import { RacedaySeasonRaceLeaderboardHarnessBase } from "./raceday-season-race-leaderboard.harness.base";

export class RacedaySeasonRaceLeaderboardHarnessE2e implements RacedaySeasonRaceLeaderboardHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedaySeasonRaceLeaderboardHarnessBase;
  }

  private get rows() {
    return this.locator.locator(this.base.selectors.driverRow);
  }

  async getRowCount(): Promise<number> {
    return await this.rows.count();
  }
}
