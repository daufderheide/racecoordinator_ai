export abstract class RacedaySeasonRaceLeaderboardHarnessBase {
  static readonly hostSelector = "app-raceday-season-race-leaderboard";

  static readonly selectors = {
    leaderboardContainer: ".leaderboard-container",
    driverRow: ".driver-row",
  };

  abstract getRowCount(): Promise<number>;
}
