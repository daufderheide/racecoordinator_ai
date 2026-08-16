package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class DriverStatistics {

  @JsonProperty("_id")
  private String id;

  @JsonProperty("driver_id")
  private String driverId;

  @JsonProperty("race_id")
  private String raceId;

  @JsonProperty("best_lap_time")
  private double bestLapTime;

  @JsonProperty("best_lap_count")
  private double bestLapCount;

  @JsonProperty("lane_best_lap_times")
  private List<Double> laneBestLapTimes;

  @JsonProperty("lane_best_lap_counts")
  private List<Double> laneBestLapCounts;

  @JsonProperty("best_lap_time_date")
  private Long bestLapTimeDate;

  @JsonProperty("best_lap_count_date")
  private Long bestLapCountDate;

  @JsonProperty("lane_best_lap_times_dates")
  private List<Long> laneBestLapTimesDates;

  @JsonProperty("lane_best_lap_counts_dates")
  private List<Long> laneBestLapCountsDates;

  public DriverStatistics() {}

  @JsonCreator
  public DriverStatistics(
      @JsonProperty("_id") String id,
      @JsonProperty("driver_id") String driverId,
      @JsonProperty("race_id") String raceId,
      @JsonProperty("best_lap_time") double bestLapTime,
      @JsonProperty("best_lap_count") double bestLapCount,
      @JsonProperty("lane_best_lap_times") List<Double> laneBestLapTimes,
      @JsonProperty("lane_best_lap_counts") List<Double> laneBestLapCounts,
      @JsonProperty("best_lap_time_date") Long bestLapTimeDate,
      @JsonProperty("best_lap_count_date") Long bestLapCountDate,
      @JsonProperty("lane_best_lap_times_dates") List<Long> laneBestLapTimesDates,
      @JsonProperty("lane_best_lap_counts_dates") List<Long> laneBestLapCountsDates) {
    this.id = id;
    this.driverId = driverId;
    this.raceId = raceId;
    this.bestLapTime = bestLapTime;
    this.bestLapCount = bestLapCount;
    this.laneBestLapTimes = laneBestLapTimes;
    this.laneBestLapCounts = laneBestLapCounts;
    this.bestLapTimeDate = bestLapTimeDate;
    this.bestLapCountDate = bestLapCountDate;
    this.laneBestLapTimesDates = laneBestLapTimesDates;
    this.laneBestLapCountsDates = laneBestLapCountsDates;
  }

  public String getId() {
    return id;
  }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEntityId() {
    return (driverId != null && raceId != null) ? (driverId + "_" + raceId) : id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getDriverId() {
    return driverId;
  }

  public void setDriverId(String driverId) {
    this.driverId = driverId;
  }

  public String getRaceId() {
    return raceId;
  }

  public void setRaceId(String raceId) {
    this.raceId = raceId;
  }

  public double getBestLapTime() {
    return bestLapTime;
  }

  public void setBestLapTime(double bestLapTime) {
    this.bestLapTime = bestLapTime;
  }

  public double getBestLapCount() {
    return bestLapCount;
  }

  public void setBestLapCount(double bestLapCount) {
    this.bestLapCount = bestLapCount;
  }

  public List<Double> getLaneBestLapTimes() {
    return laneBestLapTimes;
  }

  public void setLaneBestLapTimes(List<Double> laneBestLapTimes) {
    this.laneBestLapTimes = laneBestLapTimes;
  }

  public List<Double> getLaneBestLapCounts() {
    return laneBestLapCounts;
  }

  public void setLaneBestLapCounts(List<Double> laneBestLapCounts) {
    this.laneBestLapCounts = laneBestLapCounts;
  }

  public Long getBestLapTimeDate() {
    return bestLapTimeDate;
  }

  public void setBestLapTimeDate(Long bestLapTimeDate) {
    this.bestLapTimeDate = bestLapTimeDate;
  }

  public Long getBestLapCountDate() {
    return bestLapCountDate;
  }

  public void setBestLapCountDate(Long bestLapCountDate) {
    this.bestLapCountDate = bestLapCountDate;
  }

  public List<Long> getLaneBestLapTimesDates() {
    return laneBestLapTimesDates;
  }

  public void setLaneBestLapTimesDates(List<Long> laneBestLapTimesDates) {
    this.laneBestLapTimesDates = laneBestLapTimesDates;
  }

  public List<Long> getLaneBestLapCountsDates() {
    return laneBestLapCountsDates;
  }

  public void setLaneBestLapCountsDates(List<Long> laneBestLapCountsDates) {
    this.laneBestLapCountsDates = laneBestLapCountsDates;
  }
}
