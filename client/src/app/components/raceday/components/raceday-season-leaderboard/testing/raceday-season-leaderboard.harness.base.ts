export abstract class RacedaySeasonLeaderboardHarnessBase {
  static readonly hostSelector = "app-raceday-season-leaderboard";

  static readonly selectors = {
    leaderboardContainer: ".leaderboard-container",
    driverRow: ".driver-row",
  };

  abstract getRowCount(): Promise<number>;
}
