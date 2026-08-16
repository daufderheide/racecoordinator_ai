package com.antigravity.models;

public class SeasonStandingDetail {
  private final String raceId;
  private final String raceName;
  private final int overallRank;
  private final double overallPoints;
  private final double overallBonusPoints;
  private final double heatPoints;
  private final double heatBonusPoints;
  private final double totalPoints;
  private boolean isDropped;

  public SeasonStandingDetail(
      String raceId,
      String raceName,
      int overallRank,
      double overallPoints,
      double overallBonusPoints,
      double heatPoints,
      double heatBonusPoints,
      double totalPoints) {
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

  public String getRaceId() {
    return raceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public int getOverallRank() {
    return overallRank;
  }

  private static double round2(double val) {
    return Math.round(val * 100.0) / 100.0;
  }

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
