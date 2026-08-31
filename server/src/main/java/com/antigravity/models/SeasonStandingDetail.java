package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SeasonStandingDetail {
  @JsonProperty("race_id")
  @JsonAlias("raceId")
  private final String raceId;

  @JsonProperty("race_name")
  @JsonAlias("raceName")
  private final String raceName;

  @JsonProperty("overall_rank")
  @JsonAlias("overallRank")
  private final int overallRank;

  @JsonProperty("overall_points")
  @JsonAlias("overallPoints")
  private final double overallPoints;

  @JsonProperty("overall_bonus_points")
  @JsonAlias("overallBonusPoints")
  private final double overallBonusPoints;

  @JsonProperty("heat_points")
  @JsonAlias("heatPoints")
  private final double heatPoints;

  @JsonProperty("heat_bonus_points")
  @JsonAlias("heatBonusPoints")
  private final double heatBonusPoints;

  @JsonProperty("total_points")
  @JsonAlias("totalPoints")
  private final double totalPoints;

  @JsonProperty("is_dropped")
  @JsonAlias({"dropped", "isDropped"})
  private boolean isDropped;

  @JsonCreator
  public SeasonStandingDetail(
      @JsonProperty("race_id") @JsonAlias("raceId") String raceId,
      @JsonProperty("race_name") @JsonAlias("raceName") String raceName,
      @JsonProperty("overall_rank") @JsonAlias("overallRank") int overallRank,
      @JsonProperty("overall_points") @JsonAlias("overallPoints") double overallPoints,
      @JsonProperty("overall_bonus_points") @JsonAlias("overallBonusPoints")
          double overallBonusPoints,
      @JsonProperty("heat_points") @JsonAlias("heatPoints") double heatPoints,
      @JsonProperty("heat_bonus_points") @JsonAlias("heatBonusPoints") double heatBonusPoints,
      @JsonProperty("total_points") @JsonAlias("totalPoints") double totalPoints) {
    this.raceId = raceId;
    this.raceName = raceName;
    this.overallRank = overallRank;
    this.overallPoints = overallPoints;
    this.overallBonusPoints = overallBonusPoints;
    this.heatPoints = heatPoints;
    this.heatBonusPoints = heatBonusPoints;
    this.totalPoints = totalPoints;
    this.isDropped = false;
  }

  public SeasonStandingDetail(
      String raceId,
      String raceName,
      int overallRank,
      double overallPoints,
      double heatPoints,
      double totalPoints) {
    this(raceId, raceName, overallRank, overallPoints, 0.0, heatPoints, 0.0, totalPoints);
  }

  @JsonProperty("race_id")
  public String getRaceId() {
    return raceId;
  }

  @JsonProperty("race_name")
  public String getRaceName() {
    return raceName;
  }

  @JsonProperty("overall_rank")
  public int getOverallRank() {
    return overallRank;
  }

  private static double round2(double val) {
    return Math.round(val * 100.0) / 100.0;
  }

  @JsonProperty("overall_points")
  public double getOverallPoints() {
    return round2(overallPoints);
  }

  public double getOverallBonusPoints() {
    return round2(overallBonusPoints);
  }

  public double getHeatPoints() {
    return round2(heatPoints);
  }

  public double getHeatBonusPoints() {
    return round2(heatBonusPoints);
  }

  public double getTotalPoints() {
    return round2(totalPoints);
  }

  public boolean isDropped() {
    return isDropped;
  }

  public void setDropped(boolean dropped) {
    isDropped = dropped;
  }
}
