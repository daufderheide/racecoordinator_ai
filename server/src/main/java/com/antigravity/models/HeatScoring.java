package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

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
    SingleLap
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

  @BsonProperty("allow_finish")
  @JsonProperty("allow_finish")
  private final AllowFinish allowFinish;

  public HeatScoring() {
    this.finishMethod = FinishMethod.Timed;
    this.finishValue = 15;
    this.heatRanking = HeatRanking.LAP_COUNT;
    this.heatRankingTiebreaker = HeatRankingTiebreaker.FASTEST_LAP_TIME;
    this.allowFinish = AllowFinish.None;
  }

  public HeatScoring(@BsonProperty("finish_method") @JsonProperty("finish_method") FinishMethod finishMethod,
      @BsonProperty("finish_value") @JsonProperty("finish_value") long finishValue,
      @BsonProperty("heat_ranking") @JsonProperty("heat_ranking") HeatRanking heatRanking,
      @BsonProperty("heat_ranking_tiebreaker") @JsonProperty("heat_ranking_tiebreaker") HeatRankingTiebreaker heatRankingTiebreaker) {
    this(finishMethod, finishValue, heatRanking, heatRankingTiebreaker, AllowFinish.None);
  }

  @BsonCreator
  @JsonCreator
  public HeatScoring(@BsonProperty("finish_method") @JsonProperty("finish_method") FinishMethod finishMethod,
      @BsonProperty("finish_value") @JsonProperty("finish_value") long finishValue,
      @BsonProperty("heat_ranking") @JsonProperty("heat_ranking") HeatRanking heatRanking,
      @BsonProperty("heat_ranking_tiebreaker") @JsonProperty("heat_ranking_tiebreaker") HeatRankingTiebreaker heatRankingTiebreaker,
      @BsonProperty("allow_finish") @JsonProperty("allow_finish") AllowFinish allowFinish) {
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
}
