export abstract class RacedaySeasonLeaderboardHarnessBase {
  static readonly hostSelector = "app-raceday-season-leaderboard";

  static readonly selectors = {
    panel: ".season-leaderboard-panel",
    title: ".leaderboard-title",
    emptyMessage: ".leaderboard-empty-message",
    item: ".leaderboard-item",
    rank: ".leaderboard-rank",
    name: ".leaderboard-name",
    score: ".leaderboard-score",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract isEmpty(): Promise<boolean>;
  abstract getEmptyMessage(): Promise<string>;
  abstract getRowCount(): Promise<number>;
  abstract getDriverNames(): Promise<string[]>;
  abstract getDriverName(index: number): Promise<string>;
  abstract getScores(): Promise<string[]>;
  abstract getScore(index: number): Promise<string>;
}
