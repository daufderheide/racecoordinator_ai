package com.antigravity.models;

public class SeasonStandingDetail {
  private final String raceId;
  private final String raceName;
  private final int overallRank;
  private final int overallPoints;
  private final int heatPoints;
  private final int totalPoints;
  private boolean isDropped;

  public SeasonStandingDetail(
      String raceId,
      String raceName,
      int overallRank,
      int overallPoints,
      int heatPoints,
      int totalPoints) {
    this.raceId = raceId;
    this.raceName = raceName;
    this.overallRank = overallRank;
    this.overallPoints = overallPoints;
    this.heatPoints = heatPoints;
    this.totalPoints = totalPoints;
    this.isDropped = false;
  }

  public String getRaceId() {
    return raceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public int getOverallRank() {
    return overallRank;
  }

  public int getOverallPoints() {
    return overallPoints;
  }

  public int getHeatPoints() {
    return heatPoints;
  }

  public int getTotalPoints() {
    return totalPoints;
  }

  public boolean isDropped() {
    return isDropped;
  }

  public void setDropped(boolean dropped) {
    isDropped = dropped;
  }
}
