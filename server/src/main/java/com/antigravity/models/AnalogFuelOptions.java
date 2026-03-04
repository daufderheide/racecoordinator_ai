package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class AnalogFuelOptions extends FuelOptions {

  @BsonProperty("reference_time")
  @JsonProperty("reference_time")
  private final double referenceTime;

  public AnalogFuelOptions() {
    super();
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
    super(enabled, resetFuelAtHeatStart, endHeatOnOutOfFuel, capacity, usageType, usageRate, startLevel, refuelRate,
        pitStopDelay);
    this.referenceTime = referenceTime != null && referenceTime > 0 ? referenceTime : 6.0;
  }

  public double getReferenceTime() {
    return referenceTime;
  }
}
