package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonProperty;

public abstract class FuelOptions {

  public enum FuelUsageType {
    LINEAR,
    QUADRATIC,
    CUBIC
  }

  public enum OutOfFuelAction {
    DO_NOT_COUNT_LAPS,
    END_HEAT,
    POWER_STUTTER
  }

  @BsonProperty("enabled")
  @JsonProperty("enabled")
  protected final boolean enabled;

  @BsonProperty("reset_fuel_at_heat_start")
  @JsonProperty("reset_fuel_at_heat_start")
  protected final boolean resetFuelAtHeatStart;

  @BsonProperty("out_of_fuel_action")
  @JsonProperty("out_of_fuel_action")
  protected final OutOfFuelAction outOfFuelAction;

  @BsonProperty("capacity")
  @JsonProperty("capacity")
  protected final double capacity;

  @BsonProperty("usage_type")
  @JsonProperty("usage_type")
  protected final FuelUsageType usageType;

  @BsonProperty("usage_rate")
  @JsonProperty("usage_rate")
  protected final double usageRate;

  @BsonProperty("start_level")
  @JsonProperty("start_level")
  protected final double startLevel;

  @BsonProperty("refuel_rate")
  @JsonProperty("refuel_rate")
  protected final double refuelRate;

  @BsonProperty("pit_stop_delay")
  @JsonProperty("pit_stop_delay")
  protected final double pitStopDelay;

  public FuelOptions() {
    this.enabled = false;
    this.resetFuelAtHeatStart = false;
    this.outOfFuelAction = OutOfFuelAction.DO_NOT_COUNT_LAPS;
    this.capacity = 100.0;
    this.usageType = FuelUsageType.LINEAR;
    this.usageRate = 4.0;
    this.startLevel = 100.0;
    this.refuelRate = 10.0;
    this.pitStopDelay = 2.0;
  }

  public FuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      OutOfFuelAction outOfFuelAction,
      double capacity,
      FuelUsageType usageType,
      double usageRate,
      double startLevel,
      double refuelRate,
      double pitStopDelay) {
    this.enabled = enabled;
    this.resetFuelAtHeatStart = resetFuelAtHeatStart;
    this.outOfFuelAction = outOfFuelAction;
    this.capacity = capacity;
    this.usageType = usageType != null ? usageType : FuelUsageType.LINEAR;
    this.usageRate = usageRate;
    this.startLevel = startLevel;
    this.refuelRate = refuelRate;
    this.pitStopDelay = pitStopDelay;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public boolean isResetFuelAtHeatStart() {
    return resetFuelAtHeatStart;
  }

  public OutOfFuelAction getOutOfFuelAction() {
    return outOfFuelAction;
  }

  public double getCapacity() {
    return capacity;
  }

  public FuelUsageType getUsageType() {
    return usageType;
  }

  public double getUsageRate() {
    return usageRate;
  }

  public double getStartLevel() {
    return startLevel;
  }

  public double getRefuelRate() {
    return refuelRate;
  }

  public double getPitStopDelay() {
    return pitStopDelay;
  }
}
