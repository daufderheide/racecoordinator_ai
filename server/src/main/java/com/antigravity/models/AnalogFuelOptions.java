package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AnalogFuelOptions extends FuelOptions {

  @JsonProperty("reference_time")
  private final double referenceTime;

  @JsonProperty("power_stutter_on_time")
  private final double powerStutterOnTime;

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

  @JsonCreator
  public AnalogFuelOptions(
      @JsonProperty("enabled") boolean enabled,
      @JsonProperty("reset_fuel_at_heat_start") boolean resetFuelAtHeatStart,
      @JsonProperty("end_heat_on_out_of_fuel") Boolean endHeatOnOutOfFuel,
      @JsonProperty("out_of_fuel_action") OutOfFuelAction outOfFuelAction,
      @JsonProperty("capacity") double capacity,
      @JsonProperty("usage_type") FuelUsageType usageType,
      @JsonProperty("usage_rate") double usageRate,
      @JsonProperty("start_level") double startLevel,
      @JsonProperty("refuel_rate") double refuelRate,
      @JsonProperty("pit_stop_delay") double pitStopDelay,
      @JsonProperty("reference_time") Double referenceTime,
      @JsonProperty("power_stutter_on_time") Double powerStutterOnTime,
      @JsonProperty("power_stutter_off_time") Double powerStutterOffTime) {
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
