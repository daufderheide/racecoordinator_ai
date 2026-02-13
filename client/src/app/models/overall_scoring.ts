export enum OverallRanking {
  OR_LAP_COUNT = 'LAP_COUNT',
  OR_FASTEST_LAP = 'FASTEST_LAP',
  OR_TOTAL_TIME = 'TOTAL_TIME',
  OR_AVERAGE_LAP = 'AVERAGE_LAP'
}

export enum OverallRankingTiebreaker {
  ORT_FASTEST_LAP_TIME = 'FASTEST_LAP_TIME',
  ORT_MEDIAN_LAP_TIME = 'MEDIAN_LAP_TIME',
  ORT_AVERAGE_LAP_TIME = 'AVERAGE_LAP_TIME',
  ORT_TOTAL_TIME = 'TOTAL_TIME'
}

export class OverallScoring {
  readonly droppedHeats: number;
  readonly rankingMethod: OverallRanking;
  readonly tiebreaker: OverallRankingTiebreaker;

  constructor(
    droppedHeats: number = 0,
    rankingMethod: OverallRanking = OverallRanking.OR_LAP_COUNT,
    tiebreaker: OverallRankingTiebreaker = OverallRankingTiebreaker.ORT_FASTEST_LAP_TIME
  ) {
    this.droppedHeats = droppedHeats;
    this.rankingMethod = rankingMethod;
    this.tiebreaker = tiebreaker;
  }
}
