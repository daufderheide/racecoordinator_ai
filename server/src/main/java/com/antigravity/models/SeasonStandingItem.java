package com.antigravity.models;

import java.util.List;

public class SeasonStandingItem {
  private final String driverId;
  private final String driverName;
  private final double netPoints;
  private final double grossPoints;
  private final int racesRun;
  private final List<SeasonStandingDetail> raceScores;
  // adding a rank so we can output it easily in excel
  private int rank;

  public SeasonStandingItem(
      String driverId,
      String driverName,
      double netPoints,
      double grossPoints,
      int racesRun,
      List<SeasonStandingDetail> raceScores) {
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

  public String getDriverId() {
    return driverId;
  }

  public String getDriverName() {
    return driverName;
  }

  public double getNetPoints() {
    return round2(netPoints);
  }

  public double getGrossPoints() {
    return round2(grossPoints);
  }

  public int getRacesRun() {
    return racesRun;
  }

  public List<SeasonStandingDetail> getRaceScores() {
    return raceScores;
  }

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
