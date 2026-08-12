package com.antigravity.models;

import java.util.List;

public class SeasonStandingItem {
  private final String driverId;
  private final String driverName;
  private final int netPoints;
  private final int grossPoints;
  private final int racesRun;
  private final List<SeasonStandingDetail> raceScores;
  // adding a rank so we can output it easily in excel
  private int rank;

  public SeasonStandingItem(
      String driverId,
      String driverName,
      int netPoints,
      int grossPoints,
      int racesRun,
      List<SeasonStandingDetail> raceScores) {
    this.driverId = driverId;
    this.driverName = driverName;
    this.netPoints = netPoints;
    this.grossPoints = grossPoints;
    this.racesRun = racesRun;
    this.raceScores = raceScores;
  }

  public String getDriverId() {
    return driverId;
  }

  public String getDriverName() {
    return driverName;
  }

  public int getNetPoints() {
    return netPoints;
  }

  public int getGrossPoints() {
    return grossPoints;
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
}
