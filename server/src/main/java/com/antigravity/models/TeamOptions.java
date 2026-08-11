package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class TeamOptions {

  @JsonProperty("heat_lap_limit")
  private final int heatLapLimit;

  @JsonProperty("heat_time_limit")
  private final double heatTimeLimit;

  @JsonProperty("overall_lap_limit")
  private final int overallLapLimit;

  @JsonProperty("overall_time_limit")
  private final double overallTimeLimit;

  @JsonProperty("require_pit_stop_change_driver")
  private final boolean requirePitStopChangeDriver;

  public TeamOptions() {
    this.heatLapLimit = 0;
    this.heatTimeLimit = 0;
    this.overallLapLimit = 0;
    this.overallTimeLimit = 0;
    this.requirePitStopChangeDriver = false;
  }

  @JsonCreator
  public TeamOptions(
      @JsonProperty("heat_lap_limit") Integer heatLapLimit,
      @JsonProperty("heat_time_limit") Double heatTimeLimit,
      @JsonProperty("overall_lap_limit") Integer overallLapLimit,
      @JsonProperty("overall_time_limit") Double overallTimeLimit,
      @JsonProperty("require_pit_stop_change_driver") Boolean requirePitStopChangeDriver) {
    this.heatLapLimit = heatLapLimit != null ? heatLapLimit : 0;
    this.heatTimeLimit = heatTimeLimit != null ? heatTimeLimit : 0;
    this.overallLapLimit = overallLapLimit != null ? overallLapLimit : 0;
    this.overallTimeLimit = overallTimeLimit != null ? overallTimeLimit : 0;
    this.requirePitStopChangeDriver =
        requirePitStopChangeDriver != null ? requirePitStopChangeDriver : false;
  }

  public int getHeatLapLimit() {
    return heatLapLimit;
  }

  public double getHeatTimeLimit() {
    return heatTimeLimit;
  }

  public int getOverallLapLimit() {
    return overallLapLimit;
  }

  public double getOverallTimeLimit() {
    return overallTimeLimit;
  }

  public boolean isRequirePitStopChangeDriver() {
    return requirePitStopChangeDriver;
  }
}
