package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class HeatScoring {

  public enum FinishMethod {
    Lap,
    Timed
  }

  public enum HeatRanking {
    LAP_COUNT,
    FASTEST_LAP,
    TOTAL_TIME
  }

  public enum HeatRankingTiebreaker {
    FASTEST_LAP_TIME,
    MEDIAN_LAP_TIME,
    AVERAGE_LAP_TIME
  }

  public enum AllowFinish {
    None,
    Allow,
    SingleLap,
    NoneAutoSegments
  }

  @JsonProperty("finish_method")
  private final FinishMethod finishMethod;

  @JsonProperty("finish_value")
  private final long finishValue;

  @JsonProperty("heat_ranking")
  private final HeatRanking heatRanking;

  @JsonProperty("heat_ranking_tiebreaker")
  private final HeatRankingTiebreaker heatRankingTiebreaker;

  @JsonProperty("allow_finish")
  private final AllowFinish allowFinish;

  public HeatScoring() {
    this.finishMethod = FinishMethod.Lap;
    this.finishValue = 15;
    this.heatRanking = HeatRanking.LAP_COUNT;
    this.heatRankingTiebreaker = HeatRankingTiebreaker.AVERAGE_LAP_TIME;
    this.allowFinish = AllowFinish.None;
  }

  public HeatScoring(
      @JsonProperty("finish_method") FinishMethod finishMethod,
      @JsonProperty("finish_value") long finishValue,
      @JsonProperty("heat_ranking") HeatRanking heatRanking,
      @JsonProperty("heat_ranking_tiebreaker") HeatRankingTiebreaker heatRankingTiebreaker) {
    this(finishMethod, finishValue, heatRanking, heatRankingTiebreaker, AllowFinish.None);
  }

  @JsonCreator
  public HeatScoring(
      @JsonProperty("finish_method") FinishMethod finishMethod,
      @JsonProperty("finish_value") long finishValue,
      @JsonProperty("heat_ranking") HeatRanking heatRanking,
      @JsonProperty("heat_ranking_tiebreaker") HeatRankingTiebreaker heatRankingTiebreaker,
      @JsonProperty("allow_finish") AllowFinish allowFinish) {
    this.finishMethod = finishMethod;
    this.finishValue = finishValue;
    this.heatRanking = heatRanking;
    this.heatRankingTiebreaker = heatRankingTiebreaker;
    this.allowFinish = allowFinish != null ? allowFinish : AllowFinish.None;
  }

  public FinishMethod getFinishMethod() {
    return finishMethod;
  }

  public long getFinishValue() {
    return finishValue;
  }

  public HeatRanking getHeatRanking() {
    return heatRanking;
  }

  public HeatRankingTiebreaker getHeatRankingTiebreaker() {
    return heatRankingTiebreaker;
  }

  public AllowFinish getAllowFinish() {
    return allowFinish;
  }

  public RankingMethod toRankingMethod() {
    if (heatRanking == null) {
      return RankingMethod.LAP_COUNT;
    }
    switch (heatRanking) {
      case LAP_COUNT:
        return RankingMethod.LAP_COUNT;
      case FASTEST_LAP:
        return RankingMethod.FASTEST_LAP;
      case TOTAL_TIME:
        return RankingMethod.TOTAL_TIME;
      default:
        return RankingMethod.LAP_COUNT;
    }
  }

  public TiebreakerMethod toTiebreakerMethod() {
    if (heatRankingTiebreaker == null) {
      return TiebreakerMethod.AVERAGE_LAP_TIME;
    }
    switch (heatRankingTiebreaker) {
      case FASTEST_LAP_TIME:
        return TiebreakerMethod.FASTEST_LAP_TIME;
      case MEDIAN_LAP_TIME:
        return TiebreakerMethod.MEDIAN_LAP_TIME;
      case AVERAGE_LAP_TIME:
        return TiebreakerMethod.AVERAGE_LAP_TIME;
      default:
        return TiebreakerMethod.AVERAGE_LAP_TIME;
    }
  }
}
