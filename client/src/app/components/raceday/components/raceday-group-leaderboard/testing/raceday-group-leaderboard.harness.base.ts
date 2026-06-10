export abstract class RacedayGroupLeaderboardHarnessBase {
  static readonly hostSelector = "app-raceday-group-leaderboard";

  static readonly selectors = {
    title: ".leaderboard-title",
    subtitle: ".leaderboard-subtitle",
    emptyMessage: ".leaderboard-empty-message",
    item: ".leaderboard-item",
    rank: ".leaderboard-rank",
    name: ".leaderboard-name",
    score: ".leaderboard-score",
  };

  abstract getTitle(): Promise<string>;
  abstract getSubtitle(): Promise<string>;
  abstract getEmptyMessage(): Promise<string>;
  abstract getEntryCount(): Promise<number>;
  abstract getEntryText(index: number): Promise<string>;
  abstract getEntryDetail(
    index: number,
  ): Promise<{ rank: string; name: string; score: string }>;
}
