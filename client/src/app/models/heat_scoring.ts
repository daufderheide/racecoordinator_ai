export enum FinishMethod {
  Lap = 'Lap',
  Timed = 'Timed'
}

export enum HeatRanking {
  HR_LAP_COUNT = 'LAP_COUNT',
  HR_FASTEST_LAP = 'FASTEST_LAP',
  HR_TOTAL_TIME = 'TOTAL_TIME'
}

export enum HeatRankingTiebreaker {
  HRT_FASTEST_LAP_TIME = 'FASTEST_LAP_TIME',
  HRT_MEDIAN_LAP_TIME = 'MEDIAN_LAP_TIME',
  HRT_AVERAGE_LAP_TIME = 'AVERAGE_LAP_TIME'
}

export enum AllowFinish {
  AF_NONE = 'None',
  AF_ALLOW = 'Allow',
  AF_SINGLE_LAP = 'SingleLap'
}

export class HeatScoring {
  readonly finishMethod: FinishMethod;
  readonly finishValue: number;
  readonly heatRanking: HeatRanking;
  readonly heatRankingTiebreaker: HeatRankingTiebreaker;
  readonly allowFinish: AllowFinish;

  constructor(
    finishMethod: FinishMethod = FinishMethod.Lap,
    finishValue: number = 10,
    heatRanking: HeatRanking = HeatRanking.HR_LAP_COUNT,
    heatRankingTiebreaker: HeatRankingTiebreaker = HeatRankingTiebreaker.HRT_FASTEST_LAP_TIME,
    allowFinish: AllowFinish = AllowFinish.AF_NONE
  ) {
    this.finishMethod = finishMethod;
    this.finishValue = finishValue;
    this.heatRanking = heatRanking;
    this.heatRankingTiebreaker = heatRankingTiebreaker;
    this.allowFinish = allowFinish;
  }
}
