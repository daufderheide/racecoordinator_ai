package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class DigitalFuelOptions extends FuelOptions {

  public DigitalFuelOptions() {
    super();
  }

  @BsonCreator
  @JsonCreator
  public DigitalFuelOptions(
      @BsonProperty("enabled") @JsonProperty("enabled") boolean enabled,
      @BsonProperty("reset_fuel_at_heat_start") @JsonProperty("reset_fuel_at_heat_start") boolean resetFuelAtHeatStart,
      @BsonProperty("end_heat_on_out_of_fuel") @JsonProperty("end_heat_on_out_of_fuel") boolean endHeatOnOutOfFuel,
      @BsonProperty("capacity") @JsonProperty("capacity") double capacity,
      @BsonProperty("usage_type") @JsonProperty("usage_type") FuelUsageType usageType,
      @BsonProperty("usage_rate") @JsonProperty("usage_rate") double usageRate,
      @BsonProperty("start_level") @JsonProperty("start_level") double startLevel,
      @BsonProperty("refuel_rate") @JsonProperty("refuel_rate") double refuelRate,
      @BsonProperty("pit_stop_delay") @JsonProperty("pit_stop_delay") double pitStopDelay) {
    super(enabled, resetFuelAtHeatStart, endHeatOnOutOfFuel, capacity, usageType, usageRate, startLevel, refuelRate,
        pitStopDelay);
  }
}
