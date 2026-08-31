package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SeasonStandingItem {
  @JsonProperty("driver_id")
  @JsonAlias("driverId")
  private final String driverId;

  @JsonProperty("driver_name")
  @JsonAlias("driverName")
  private final String driverName;

  @JsonProperty("net_points")
  @JsonAlias("netPoints")
  private final double netPoints;

  @JsonProperty("gross_points")
  @JsonAlias("grossPoints")
  private final double grossPoints;

  @JsonProperty("races_run")
  @JsonAlias("racesRun")
  private final int racesRun;

  @JsonProperty("race_scores")
  @JsonAlias("raceScores")
  private final List<SeasonStandingDetail> raceScores;

  // adding a rank so we can output it easily in excel
  @JsonProperty("rank")
  private int rank;

  @JsonCreator
  public SeasonStandingItem(
      @JsonProperty("driver_id") @JsonAlias("driverId") String driverId,
      @JsonProperty("driver_name") @JsonAlias("driverName") String driverName,
      @JsonProperty("net_points") @JsonAlias("netPoints") double netPoints,
      @JsonProperty("gross_points") @JsonAlias("grossPoints") double grossPoints,
      @JsonProperty("races_run") @JsonAlias("racesRun") int racesRun,
      @JsonProperty("race_scores") @JsonAlias("raceScores") List<SeasonStandingDetail> raceScores) {
    this.driverId = driverId;
    this.driverName = driverName;
    this.netPoints = netPoints;
    this.grossPoints = grossPoints;
    this.racesRun = racesRun;
    this.raceScores = raceScores;
  }

  private static double round2(double val) {
    return Math.round(val * 100.0) / 100.0;
  }

  @JsonProperty("driver_id")
  public String getDriverId() {
    return driverId;
  }

  @JsonProperty("driver_name")
  public String getDriverName() {
    return driverName;
  }

  @JsonProperty("net_points")
  public double getNetPoints() {
    return round2(netPoints);
  }

  @JsonProperty("gross_points")
  public double getGrossPoints() {
    return round2(grossPoints);
  }

  @JsonProperty("dropped_points")
  public double getDroppedPoints() {
    return round2(Math.max(0.0, getGrossPoints() - getNetPoints()));
  }

  @JsonProperty("races_run")
  public int getRacesRun() {
    return racesRun;
  }

  @JsonProperty("race_scores")
  public List<SeasonStandingDetail> getRaceScores() {
    return raceScores;
  }

  @JsonProperty("rank")
  public int getRank() {
    return rank;
  }

  public void setRank(int rank) {
    this.rank = rank;
  }

  public double getOverallBonusPoints() {
    double sum = 0.0;
    if (raceScores != null) {
      for (SeasonStandingDetail s : raceScores) {
        if (!s.isDropped()) {
          sum += s.getOverallBonusPoints();
        }
      }
    }
    return round2(sum);
  }

  public double getHeatBonusPoints() {
    double sum = 0.0;
    if (raceScores != null) {
      for (SeasonStandingDetail s : raceScores) {
        if (!s.isDropped()) {
          sum += s.getHeatBonusPoints();
        }
      }
    }
    return round2(sum);
  }

  public double getTotalBonusPoints() {
    return round2(getOverallBonusPoints() + getHeatBonusPoints());
  }

  public double getBonusPoints() {
    return getTotalBonusPoints();
  }
}
