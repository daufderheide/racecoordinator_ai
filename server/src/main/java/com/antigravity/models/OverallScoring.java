package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

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

  @JsonProperty("dropped_heats")
  private final int droppedHeats;

  @JsonProperty("ranking_method")
  private final OverallRanking rankingMethod;

  @JsonProperty("tiebreaker")
  private final OverallRankingTiebreaker tiebreaker;

  public OverallScoring() {
    this.droppedHeats = 0;
    this.rankingMethod = OverallRanking.LAP_COUNT;
    this.tiebreaker = OverallRankingTiebreaker.AVERAGE_LAP_TIME;
  }

  @JsonCreator
  public OverallScoring(
      @JsonProperty("dropped_heats") int droppedHeats,
      @JsonProperty("ranking_method") OverallRanking rankingMethod,
      @JsonProperty("tiebreaker") OverallRankingTiebreaker tiebreaker) {
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
