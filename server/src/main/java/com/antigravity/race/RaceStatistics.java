package com.antigravity.race;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RaceStatistics {

  private String startTime;
  private String endTime;
  private long startMillis;
  private long durationMillis;
  private long totalPausedTimeMillis;
  private int yellowFlagCount;
  private int restartCount;
  private int driftLapCount;
  private int minLapTimeRejectionCount;

  public RaceStatistics() {}

  @JsonProperty("startTime")
  public String getStartTime() {
    return startTime;
  }

  @JsonProperty("startTime")
  public void setStartTime(String startTime) {
    this.startTime = startTime;
  }

  @JsonProperty("endTime")
  public String getEndTime() {
    return endTime;
  }

  @JsonProperty("endTime")
  public void setEndTime(String endTime) {
    this.endTime = endTime;
  }

  @JsonProperty("totalPausedTimeMillis")
  public long getTotalPausedTimeMillis() {
    return totalPausedTimeMillis;
  }

  @JsonProperty("totalPausedTimeMillis")
  public void setTotalPausedTimeMillis(long totalPausedTimeMillis) {
    this.totalPausedTimeMillis = totalPausedTimeMillis;
  }

  @JsonProperty("yellowFlagCount")
  public int getYellowFlagCount() {
    return yellowFlagCount;
  }

  @JsonProperty("yellowFlagCount")
  public void setYellowFlagCount(int yellowFlagCount) {
    this.yellowFlagCount = yellowFlagCount;
  }

  @JsonProperty("restartCount")
  public int getRestartCount() {
    return restartCount;
  }

  @JsonProperty("restartCount")
  public void setRestartCount(int restartCount) {
    this.restartCount = restartCount;
  }

  @JsonProperty("startMillis")
  public long getStartMillis() {
    return startMillis;
  }

  @JsonProperty("startMillis")
  public void setStartMillis(long startMillis) {
    this.startMillis = startMillis;
  }

  @JsonProperty("durationMillis")
  public long getDurationMillis() {
    return durationMillis;
  }

  @JsonProperty("durationMillis")
  public void setDurationMillis(long durationMillis) {
    this.durationMillis = durationMillis;
  }

  public void incrementYellowFlagCount() {
    this.yellowFlagCount++;
  }

  public void incrementRestartCount() {
    this.restartCount++;
  }

  public void addPausedTime(long millis) {
    this.totalPausedTimeMillis += millis;
  }

  @JsonProperty("driftLapCount")
  public int getDriftLapCount() {
    return driftLapCount;
  }

  @JsonProperty("driftLapCount")
  public void setDriftLapCount(int driftLapCount) {
    this.driftLapCount = driftLapCount;
  }

  @JsonProperty("minLapTimeRejectionCount")
  public int getMinLapTimeRejectionCount() {
    return minLapTimeRejectionCount;
  }

  @JsonProperty("minLapTimeRejectionCount")
  public void setMinLapTimeRejectionCount(int minLapTimeRejectionCount) {
    this.minLapTimeRejectionCount = minLapTimeRejectionCount;
  }

  public void incrementDriftLapCount() {
    this.driftLapCount++;
  }

  public void incrementMinLapTimeRejectionCount() {
    this.minLapTimeRejectionCount++;
  }
}
