package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class RaceScoring {

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

  @BsonProperty("finish_method")
  @JsonProperty("finish_method")
  private final FinishMethod finishMethod;

  @BsonProperty("finish_value")
  @JsonProperty("finish_value")
  private final long finishValue;

  @BsonProperty("heat_ranking")
  @JsonProperty("heat_ranking")
  private final HeatRanking heatRanking;

  @BsonProperty("heat_ranking_tiebreaker")
  @JsonProperty("heat_ranking_tiebreaker")
  private final HeatRankingTiebreaker heatRankingTiebreaker;

  @BsonCreator
  public RaceScoring(@BsonProperty("finish_method") FinishMethod finishMethod,
      @BsonProperty("finish_value") long finishValue,
      @BsonProperty("heat_ranking") HeatRanking heatRanking,
      @BsonProperty("heat_ranking_tiebreaker") HeatRankingTiebreaker heatRankingTiebreaker) {
    this.finishMethod = finishMethod;
    this.finishValue = finishValue;
    this.heatRanking = heatRanking;
    this.heatRankingTiebreaker = heatRankingTiebreaker;
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
}
