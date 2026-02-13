package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class OverallScoring {

  public enum OverallRanking {
    LAP_COUNT,
    FASTEST_LAP,
    TOTAL_TIME,
    AVERAGE_LAP
  }

  public enum OverallRankingTiebreaker {
    FASTEST_LAP_TIME,
    MEDIAN_LAP_TIME,
    AVERAGE_LAP_TIME,
    TOTAL_TIME
  }

  @BsonProperty("dropped_heats")
  @JsonProperty("dropped_heats")
  private final int droppedHeats;

  @BsonProperty("ranking_method")
  @JsonProperty("ranking_method")
  private final OverallRanking rankingMethod;

  @BsonProperty("tiebreaker")
  @JsonProperty("tiebreaker")
  private final OverallRankingTiebreaker tiebreaker;

  public OverallScoring() {
    this.droppedHeats = 0;
    this.rankingMethod = OverallRanking.LAP_COUNT;
    this.tiebreaker = OverallRankingTiebreaker.TOTAL_TIME;
  }

  @BsonCreator
  @JsonCreator
  public OverallScoring(@BsonProperty("dropped_heats") @JsonProperty("dropped_heats") int droppedHeats,
      @BsonProperty("ranking_method") @JsonProperty("ranking_method") OverallRanking rankingMethod,
      @BsonProperty("tiebreaker") @JsonProperty("tiebreaker") OverallRankingTiebreaker tiebreaker) {
    this.droppedHeats = droppedHeats;
    this.rankingMethod = rankingMethod;
    this.tiebreaker = tiebreaker;
  }

  public int getDroppedHeats() {
    return droppedHeats;
  }

  public OverallRanking getRankingMethod() {
    return rankingMethod;
  }

  public OverallRankingTiebreaker getTiebreaker() {
    return tiebreaker;
  }
}
