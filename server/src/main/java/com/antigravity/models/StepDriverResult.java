package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class StepDriverResult {
  @JsonProperty("rank")
  private int rank;

  @JsonProperty("driver_id")
  @JsonAlias("driverId")
  private String driverId;

  @JsonProperty("driver_name")
  @JsonAlias("driverName")
  private String driverName;

  @JsonProperty("total_laps")
  @JsonAlias("totalLaps")
  private double totalLaps;

  @JsonProperty("total_time")
  @JsonAlias("totalTime")
  private double totalTime;

  @JsonProperty("total_points")
  @JsonAlias("totalPoints")
  private double totalPoints;

  @JsonProperty("best_lap_time")
  @JsonAlias("bestLapTime")
  private double bestLapTime;

  @JsonProperty("is_stepping_up")
  @JsonAlias("isSteppingUp")
  private boolean steppingUp;

  @JsonProperty("step_up_index")
  @JsonAlias("stepUpIndex")
  private int stepUpIndex;

  public StepDriverResult() {}

  public StepDriverResult(
      int rank,
      String driverId,
      String driverName,
      double totalLaps,
      double totalTime,
      double totalPoints,
      double bestLapTime,
      boolean steppingUp,
      int stepUpIndex) {
    this.rank = rank;
    this.driverId = driverId;
    this.driverName = driverName;
    this.totalLaps = totalLaps;
    this.totalTime = totalTime;
    this.totalPoints = totalPoints;
    this.bestLapTime = bestLapTime;
    this.steppingUp = steppingUp;
    this.stepUpIndex = stepUpIndex;
  }

  public int getRank() {
    return rank;
  }

  public void setRank(int rank) {
    this.rank = rank;
  }

  public String getDriverId() {
    return driverId;
  }

  public void setDriverId(String driverId) {
    this.driverId = driverId;
  }

  public String getDriverName() {
    return driverName;
  }

  public void setDriverName(String driverName) {
    this.driverName = driverName;
  }

  public double getTotalLaps() {
    return totalLaps;
  }

  public void setTotalLaps(double totalLaps) {
    this.totalLaps = totalLaps;
  }

  public double getTotalTime() {
    return totalTime;
  }

  public void setTotalTime(double totalTime) {
    this.totalTime = totalTime;
  }

  public double getTotalPoints() {
    return totalPoints;
  }

  public void setTotalPoints(double totalPoints) {
    this.totalPoints = totalPoints;
  }

  public double getBestLapTime() {
    return bestLapTime;
  }

  public void setBestLapTime(double bestLapTime) {
    this.bestLapTime = bestLapTime;
  }

  public boolean isSteppingUp() {
    return steppingUp;
  }

  public void setSteppingUp(boolean steppingUp) {
    this.steppingUp = steppingUp;
  }

  public int getStepUpIndex() {
    return stepUpIndex;
  }

  public void setStepUpIndex(int stepUpIndex) {
    this.stepUpIndex = stepUpIndex;
  }

  @JsonProperty("driverId")
  public String getDriverIdCamel() {
    return driverId;
  }

  @JsonProperty("driverName")
  public String getDriverNameCamel() {
    return driverName;
  }

  @JsonProperty("totalLaps")
  public double getTotalLapsCamel() {
    return totalLaps;
  }

  @JsonProperty("totalTime")
  public double getTotalTimeCamel() {
    return totalTime;
  }

  @JsonProperty("totalPoints")
  public double getTotalPointsCamel() {
    return totalPoints;
  }

  @JsonProperty("bestLapTime")
  public double getBestLapTimeCamel() {
    return bestLapTime;
  }

  @JsonProperty("steppingUp")
  public boolean isSteppingUpCamel() {
    return steppingUp;
  }

  @JsonProperty("stepUpIndex")
  public int getStepUpIndexCamel() {
    return stepUpIndex;
  }
}
