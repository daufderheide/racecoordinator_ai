package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SeasonRaceRecord {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class SeasonDriverResult {
    @JsonProperty("driver_id")
    private final String driverId;

    @JsonProperty("driver_name")
    private final String driverName;

    @JsonProperty("overall_rank")
    private final int overallRank;

    @JsonProperty("overall_points")
    private final double overallPoints;

    @JsonProperty("overall_bonus_points")
    private final double overallBonusPoints;

    @JsonProperty("overall_bonus_breakdown")
    private final java.util.Map<String, Double> overallBonusBreakdown;

    @JsonProperty("heat_points")
    private final double heatPoints;

    @JsonProperty("heat_bonus_points")
    private final double heatBonusPoints;

    @JsonProperty("heat_bonus_breakdown")
    private final java.util.Map<String, Double> heatBonusBreakdown;

    @JsonProperty("total_points")
    private final double totalPoints;

    @JsonCreator
    public SeasonDriverResult(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("driver_name") String driverName,
        @JsonProperty("overall_rank") Integer overallRank,
        @JsonProperty("overall_points") Double overallPoints,
        @JsonProperty("overall_bonus_points") Double overallBonusPoints,
        @JsonProperty("overall_bonus_breakdown")
            java.util.Map<String, Double> overallBonusBreakdown,
        @JsonProperty("heat_points") Double heatPoints,
        @JsonProperty("heat_bonus_points") Double heatBonusPoints,
        @JsonProperty("heat_bonus_breakdown") java.util.Map<String, Double> heatBonusBreakdown,
        @JsonProperty("total_points") Double totalPoints) {
      this.driverId = driverId != null ? driverId : "";
      this.driverName = driverName != null ? driverName : "";
      this.overallRank = overallRank != null ? overallRank : 0;
      this.overallPoints = overallPoints != null ? overallPoints : 0.0;
      this.overallBonusPoints = overallBonusPoints != null ? overallBonusPoints : 0.0;
      this.overallBonusBreakdown =
          overallBonusBreakdown != null ? overallBonusBreakdown : new java.util.HashMap<>();
      this.heatPoints = heatPoints != null ? heatPoints : 0.0;
      this.heatBonusPoints = heatBonusPoints != null ? heatBonusPoints : 0.0;
      this.heatBonusBreakdown =
          heatBonusBreakdown != null ? heatBonusBreakdown : new java.util.HashMap<>();
      this.totalPoints =
          totalPoints != null
              ? totalPoints
              : (this.overallPoints
                  + this.overallBonusPoints
                  + this.heatPoints
                  + this.heatBonusPoints);
    }

    public SeasonDriverResult(
        String driverId,
        String driverName,
        Integer overallRank,
        Double overallPoints,
        Double overallBonusPoints,
        Double heatPoints,
        Double heatBonusPoints,
        Double totalPoints) {
      this(
          driverId,
          driverName,
          overallRank,
          overallPoints,
          overallBonusPoints,
          null,
          heatPoints,
          heatBonusPoints,
          null,
          totalPoints);
    }

    public SeasonDriverResult(
        String driverId,
        String driverName,
        Integer overallRank,
        Double overallPoints,
        Double heatPoints,
        Double totalPoints) {
      this(driverId, driverName, overallRank, overallPoints, 0.0, heatPoints, 0.0, totalPoints);
    }

    public String getDriverId() {
      return driverId;
    }

    public String getDriverName() {
      return driverName;
    }

    public int getOverallRank() {
      return overallRank;
    }

    public double getOverallPoints() {
      return overallPoints;
    }

    public double getOverallBonusPoints() {
      return overallBonusPoints;
    }

    public java.util.Map<String, Double> getOverallBonusBreakdown() {
      return overallBonusBreakdown;
    }

    public double getHeatPoints() {
      return heatPoints;
    }

    public double getHeatBonusPoints() {
      return heatBonusPoints;
    }

    public java.util.Map<String, Double> getHeatBonusBreakdown() {
      return heatBonusBreakdown;
    }

    public double getTotalPoints() {
      return totalPoints;
    }
  }

  @JsonProperty("race_id")
  private final String raceId;

  @JsonProperty("race_name")
  private final String raceName;

  @JsonProperty("timestamp")
  private final long timestamp;

  @JsonProperty("is_demo")
  private final boolean isDemo;

  @JsonProperty("driver_results")
  private final List<SeasonDriverResult> driverResults;

  @JsonCreator
  public SeasonRaceRecord(
      @JsonProperty("race_id") String raceId,
      @JsonProperty("race_name") String raceName,
      @JsonProperty("timestamp") Long timestamp,
      @JsonProperty("is_demo") @JsonAlias({"isDemo", "demo"}) Boolean isDemo,
      @JsonProperty("driver_results") List<SeasonDriverResult> driverResults) {
    this.raceId = raceId != null ? raceId : "";
    this.raceName = raceName != null ? raceName : "";
    this.timestamp = timestamp != null ? timestamp : System.currentTimeMillis();
    this.isDemo = isDemo != null ? isDemo : false;
    this.driverResults = driverResults != null ? new ArrayList<>(driverResults) : new ArrayList<>();
  }

  public SeasonRaceRecord(
      String raceId, String raceName, long timestamp, List<SeasonDriverResult> driverResults) {
    this(raceId, raceName, timestamp, false, driverResults);
  }

  public String getRaceId() {
    return raceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public long getTimestamp() {
    return timestamp;
  }

  @JsonProperty("is_demo")
  public boolean isDemo() {
    return isDemo;
  }

  public List<SeasonDriverResult> getDriverResults() {
    return new ArrayList<>(driverResults);
  }
}
