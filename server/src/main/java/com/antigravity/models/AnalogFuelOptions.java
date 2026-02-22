package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class AnalogFuelOptions {
  public enum FuelUsageType {
    LINEAR,
    QUADRATIC,
    CUBIC
  }

  @BsonProperty("enabled")
  @JsonProperty("enabled")
  private final boolean enabled;

  @BsonProperty("reset_fuel_at_heat_start")
  @JsonProperty("reset_fuel_at_heat_start")
  private final boolean resetFuelAtHeatStart;

  @BsonProperty("end_heat_on_out_of_fuel")
  @JsonProperty("end_heat_on_out_of_fuel")
  private final boolean endHeatOnOutOfFuel;

  @BsonProperty("capacity")
  @JsonProperty("capacity")
  private final double capacity;

  @BsonProperty("usage_type")
  @JsonProperty("usage_type")
  private final FuelUsageType usageType;

  @BsonProperty("usage_rate")
  @JsonProperty("usage_rate")
  private final double usageRate;

  @BsonProperty("start_level")
  @JsonProperty("start_level")
  private final double startLevel;

  @BsonProperty("refuel_rate")
  @JsonProperty("refuel_rate")
  private final double refuelRate;

  @BsonProperty("pit_stop_delay")
  @JsonProperty("pit_stop_delay")
  private final double pitStopDelay;

  @BsonProperty("reference_time")
  @JsonProperty("reference_time")
  private final double referenceTime;

  public AnalogFuelOptions() {
    this.enabled = false;
    this.resetFuelAtHeatStart = false;
    this.endHeatOnOutOfFuel = false;
    this.capacity = 100.0;
    this.usageType = FuelUsageType.LINEAR;
    this.usageRate = 4.0;
    this.startLevel = 100.0;
    this.refuelRate = 10.0;
    this.pitStopDelay = 2.0;
    this.referenceTime = 6.0;
  }

  @BsonCreator
  @JsonCreator
  public AnalogFuelOptions(
      @BsonProperty("enabled") @JsonProperty("enabled") boolean enabled,
      @BsonProperty("reset_fuel_at_heat_start") @JsonProperty("reset_fuel_at_heat_start") boolean resetFuelAtHeatStart,
      @BsonProperty("end_heat_on_out_of_fuel") @JsonProperty("end_heat_on_out_of_fuel") boolean endHeatOnOutOfFuel,
      @BsonProperty("capacity") @JsonProperty("capacity") double capacity,
      @BsonProperty("usage_type") @JsonProperty("usage_type") FuelUsageType usageType,
      @BsonProperty("usage_rate") @JsonProperty("usage_rate") double usageRate,
      @BsonProperty("start_level") @JsonProperty("start_level") double startLevel,
      @BsonProperty("refuel_rate") @JsonProperty("refuel_rate") double refuelRate,
      @BsonProperty("pit_stop_delay") @JsonProperty("pit_stop_delay") double pitStopDelay,
      @BsonProperty("reference_time") @JsonProperty("reference_time") Double referenceTime) {
    this.enabled = enabled;
    this.resetFuelAtHeatStart = resetFuelAtHeatStart;
    this.endHeatOnOutOfFuel = endHeatOnOutOfFuel;
    this.capacity = capacity;
    this.usageType = usageType != null ? usageType : FuelUsageType.LINEAR;
    this.usageRate = usageRate;
    this.startLevel = startLevel;
    this.refuelRate = refuelRate;
    this.pitStopDelay = pitStopDelay;
    this.referenceTime = referenceTime != null && referenceTime > 0 ? referenceTime : 6.0;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public boolean isResetFuelAtHeatStart() {
    return resetFuelAtHeatStart;
  }

  public boolean isEndHeatOnOutOfFuel() {
    return endHeatOnOutOfFuel;
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

  public double getReferenceTime() {
    return referenceTime;
  }
}
