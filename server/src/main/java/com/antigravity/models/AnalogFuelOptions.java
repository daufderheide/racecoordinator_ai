package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class AnalogFuelOptions extends FuelOptions {

  @BsonProperty("reference_time")
  @JsonProperty("reference_time")
  private final double referenceTime;

  @BsonProperty("power_stutter_on_time")
  @JsonProperty("power_stutter_on_time")
  private final double powerStutterOnTime;

  @BsonProperty("power_stutter_off_time")
  @JsonProperty("power_stutter_off_time")
  private final double powerStutterOffTime;

  public AnalogFuelOptions() {
    super();
    this.referenceTime = 6.0;
    this.powerStutterOnTime = 1.0;
    this.powerStutterOffTime = 1.0;
  }

  public AnalogFuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      Boolean endHeatOnOutOfFuel,
      OutOfFuelAction outOfFuelAction,
      double capacity,
      FuelUsageType usageType,
      double usageRate,
      double startLevel,
      double refuelRate,
      double pitStopDelay,
      Double referenceTime) {
    this(
        enabled,
        resetFuelAtHeatStart,
        endHeatOnOutOfFuel,
        outOfFuelAction,
        capacity,
        usageType,
        usageRate,
        startLevel,
        refuelRate,
        pitStopDelay,
        referenceTime,
        1.0,
        1.0);
  }

  @BsonCreator
  @JsonCreator
  public AnalogFuelOptions(
      @BsonProperty("enabled") @JsonProperty("enabled") boolean enabled,
      @BsonProperty("reset_fuel_at_heat_start") @JsonProperty("reset_fuel_at_heat_start")
          boolean resetFuelAtHeatStart,
      @BsonProperty("end_heat_on_out_of_fuel") @JsonProperty("end_heat_on_out_of_fuel")
          Boolean endHeatOnOutOfFuel,
      @BsonProperty("out_of_fuel_action") @JsonProperty("out_of_fuel_action")
          OutOfFuelAction outOfFuelAction,
      @BsonProperty("capacity") @JsonProperty("capacity") double capacity,
      @BsonProperty("usage_type") @JsonProperty("usage_type") FuelUsageType usageType,
      @BsonProperty("usage_rate") @JsonProperty("usage_rate") double usageRate,
      @BsonProperty("start_level") @JsonProperty("start_level") double startLevel,
      @BsonProperty("refuel_rate") @JsonProperty("refuel_rate") double refuelRate,
      @BsonProperty("pit_stop_delay") @JsonProperty("pit_stop_delay") double pitStopDelay,
      @BsonProperty("reference_time") @JsonProperty("reference_time") Double referenceTime,
      @BsonProperty("power_stutter_on_time") @JsonProperty("power_stutter_on_time")
          Double powerStutterOnTime,
      @BsonProperty("power_stutter_off_time") @JsonProperty("power_stutter_off_time")
          Double powerStutterOffTime) {
    super(
        enabled,
        resetFuelAtHeatStart,
        outOfFuelAction != null
            ? outOfFuelAction
            : (endHeatOnOutOfFuel != null && endHeatOnOutOfFuel
                ? OutOfFuelAction.END_HEAT
                : OutOfFuelAction.DO_NOT_COUNT_LAPS),
        capacity,
        usageType,
        usageRate,
        startLevel,
        refuelRate,
        pitStopDelay);
    this.referenceTime = referenceTime != null && referenceTime > 0 ? referenceTime : 6.0;
    this.powerStutterOnTime =
        powerStutterOnTime != null && powerStutterOnTime > 0 ? powerStutterOnTime : 1.0;
    this.powerStutterOffTime =
        powerStutterOffTime != null && powerStutterOffTime > 0 ? powerStutterOffTime : 1.0;
  }

  public double getReferenceTime() {
    return referenceTime;
  }

  public double getPowerStutterOnTime() {
    return powerStutterOnTime;
  }

  public double getPowerStutterOffTime() {
    return powerStutterOffTime;
  }
}
