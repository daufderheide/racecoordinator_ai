package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DigitalFuelOptions extends FuelOptions {

  public DigitalFuelOptions() {
    super();
  }

  public DigitalFuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      Boolean endHeatOnOutOfFuel,
      OutOfFuelAction outOfFuelAction,
      Double capacity,
      FuelUsageType usageType,
      Double usageRate,
      Double startLevel,
      Double refuelRate,
      Double pitStopDelay) {
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
        null);
  }

  @JsonCreator
  public DigitalFuelOptions(
      @JsonProperty("enabled") boolean enabled,
      @JsonProperty("reset_fuel_at_heat_start") boolean resetFuelAtHeatStart,
      @JsonProperty("end_heat_on_out_of_fuel") Boolean endHeatOnOutOfFuel,
      @JsonProperty("out_of_fuel_action") OutOfFuelAction outOfFuelAction,
      @JsonProperty("capacity") Double capacity,
      @JsonProperty("usage_type") FuelUsageType usageType,
      @JsonProperty("usage_rate") Double usageRate,
      @JsonProperty("start_level") Double startLevel,
      @JsonProperty("refuel_rate") Double refuelRate,
      @JsonProperty("pit_stop_delay") Double pitStopDelay,
      @JsonProperty("custom_curve") java.util.List<FuelCurvePoint> customCurve) {
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
        pitStopDelay,
        customCurve);
  }
}
