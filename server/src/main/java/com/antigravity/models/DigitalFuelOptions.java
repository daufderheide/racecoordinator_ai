package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DigitalFuelOptions extends FuelOptions {

  public DigitalFuelOptions() {
    super();
  }

  @JsonCreator
  public DigitalFuelOptions(
      @JsonProperty("enabled") boolean enabled,
      @JsonProperty("reset_fuel_at_heat_start") boolean resetFuelAtHeatStart,
      @JsonProperty("end_heat_on_out_of_fuel") Boolean endHeatOnOutOfFuel,
      @JsonProperty("out_of_fuel_action") OutOfFuelAction outOfFuelAction,
      @JsonProperty("capacity") double capacity,
      @JsonProperty("usage_type") FuelUsageType usageType,
      @JsonProperty("usage_rate") double usageRate,
      @JsonProperty("start_level") double startLevel,
      @JsonProperty("refuel_rate") double refuelRate,
      @JsonProperty("pit_stop_delay") double pitStopDelay) {
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
  }
}
