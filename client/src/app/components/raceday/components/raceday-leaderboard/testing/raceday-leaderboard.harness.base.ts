export abstract class RacedayLeaderboardHarnessBase {
  static readonly hostSelector = "app-raceday-leaderboard";

  static readonly selectors = {
    title: ".leaderboard-title",
    item: ".leaderboard-item",
  };

  abstract getTitle(): Promise<string>;
  abstract getEntryCount(): Promise<number>;
  abstract getEntryText(index: number): Promise<string>;
}
