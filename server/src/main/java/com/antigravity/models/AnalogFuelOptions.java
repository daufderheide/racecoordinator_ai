package com.antigravity.models;

import com.antigravity.race.FuelCalculationUtils;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class AnalogFuelOptions extends FuelOptions {

  @JsonProperty("reference_time")
  @JsonAlias("referenceTime")
  private final double referenceTime;

  @JsonProperty("power_stutter_on_time")
  @JsonAlias("powerStutterOnTime")
  private final double powerStutterOnTime;

  @JsonProperty("power_stutter_off_time")
  @JsonAlias("powerStutterOffTime")
  private final double powerStutterOffTime;

  @JsonProperty("fastest_time")
  @JsonAlias("fastestTime")
  private final double fastestTime;

  @JsonProperty("max_usage")
  @JsonAlias("maxUsage")
  private final double maxUsage;

  @JsonProperty("slowest_time")
  @JsonAlias("slowestTime")
  private final double slowestTime;

  @JsonProperty("min_usage")
  @JsonAlias("minUsage")
  private final double minUsage;

  public AnalogFuelOptions() {
    super();
    this.referenceTime = 6.0;
    this.powerStutterOnTime = 1.0;
    this.powerStutterOffTime = 1.0;
    this.fastestTime = 3.0;
    this.maxUsage = 5.0;
    this.slowestTime = 9.0;
    this.minUsage = 3.0;
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
        Double.valueOf(capacity),
        usageType,
        Double.valueOf(usageRate),
        Double.valueOf(startLevel),
        Double.valueOf(refuelRate),
        Double.valueOf(pitStopDelay),
        referenceTime,
        Double.valueOf(1.0),
        Double.valueOf(1.0),
        null,
        null,
        null,
        null,
        null);
  }

  public AnalogFuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      Boolean endHeatOnOutOfFuel,
      OutOfFuelAction outOfFuelAction,
      Double capacity,
      FuelUsageType usageType,
      Double usageRate,
      Double startLevel,
      Double refuelRate,
      Double pitStopDelay,
      Double referenceTime,
      Double powerStutterOnTime,
      Double powerStutterOffTime) {
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
        powerStutterOnTime,
        powerStutterOffTime,
        null,
        null,
        null,
        null,
        null);
  }

  public AnalogFuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      Boolean endHeatOnOutOfFuel,
      OutOfFuelAction outOfFuelAction,
      Double capacity,
      FuelUsageType usageType,
      Double usageRate,
      Double startLevel,
      Double refuelRate,
      Double pitStopDelay,
      Double referenceTime,
      Double powerStutterOnTime,
      Double powerStutterOffTime,
      List<FuelCurvePoint> customCurve) {
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
        powerStutterOnTime,
        powerStutterOffTime,
        customCurve,
        null,
        null,
        null,
        null);
  }

  public AnalogFuelOptions(
      boolean enabled,
      boolean resetFuelAtHeatStart,
      Boolean endHeatOnOutOfFuel,
      OutOfFuelAction outOfFuelAction,
      Double capacity,
      FuelUsageType usageType,
      Double startLevel,
      Double refuelRate,
      Double pitStopDelay,
      Double fastestTime,
      Double maxUsage,
      Double slowestTime,
      Double minUsage,
      Double powerStutterOnTime,
      Double powerStutterOffTime,
      List<FuelCurvePoint> customCurve) {
    this(
        enabled,
        resetFuelAtHeatStart,
        endHeatOnOutOfFuel,
        outOfFuelAction,
        capacity,
        usageType,
        maxUsage,
        startLevel,
        refuelRate,
        pitStopDelay,
        null,
        powerStutterOnTime,
        powerStutterOffTime,
        customCurve,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage);
  }

  @JsonCreator
  public AnalogFuelOptions(
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
      @JsonProperty("reference_time") Double referenceTime,
      @JsonProperty("power_stutter_on_time") Double powerStutterOnTime,
      @JsonProperty("power_stutter_off_time") Double powerStutterOffTime,
      @JsonProperty("custom_curve") List<FuelCurvePoint> customCurve,
      @JsonProperty("fastest_time") Double fastestTime,
      @JsonProperty("max_usage") Double maxUsage,
      @JsonProperty("slowest_time") Double slowestTime,
      @JsonProperty("min_usage") Double minUsage) {
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
        usageRate != null ? usageRate : (maxUsage != null ? maxUsage : 4.0),
        startLevel,
        refuelRate,
        pitStopDelay,
        customCurve);

    double ref = referenceTime != null && referenceTime > 0 ? referenceTime : 6.0;
    this.referenceTime = ref;
    this.powerStutterOnTime =
        powerStutterOnTime != null && powerStutterOnTime > 0 ? powerStutterOnTime : 1.0;
    this.powerStutterOffTime =
        powerStutterOffTime != null && powerStutterOffTime > 0 ? powerStutterOffTime : 1.0;

    if (fastestTime != null
        && fastestTime > 0
        && maxUsage != null
        && maxUsage >= 0
        && slowestTime != null
        && slowestTime > 0
        && minUsage != null
        && minUsage >= 0) {
      this.fastestTime = fastestTime;
      this.maxUsage = maxUsage;
      this.slowestTime = slowestTime;
      this.minUsage = minUsage;
    } else {
      double rate = usageRate != null && usageRate >= 0 ? usageRate : 4.0;
      FuelUsageType type = usageType != null ? usageType : FuelUsageType.LINEAR;
      double calcFastest = Math.max(0.1, ref * 0.5);
      double calcSlowest = Math.max(calcFastest + 0.1, ref * 1.5);
      double calcMax;
      double calcMin;
      switch (type) {
        case QUADRATIC:
          calcMax = 4.0 * rate;
          calcMin = (4.0 / 9.0) * rate;
          break;
        case CUBIC:
          calcMax = 8.0 * rate;
          calcMin = (8.0 / 27.0) * rate;
          break;
        case CUSTOM_CURVE:
        case CUSTOM:
          double y0 = FuelCalculationUtils.interpolateFuelCurve(customCurve, 0.0);
          double y1 = FuelCalculationUtils.interpolateFuelCurve(customCurve, 1.0);
          calcMax = rate * y0;
          calcMin = rate * y1;
          break;
        case LINEAR:
        default:
          calcMax = 1.25 * rate;
          calcMin = 0.75 * rate;
          break;
      }
      this.fastestTime = fastestTime != null && fastestTime > 0 ? fastestTime : calcFastest;
      this.maxUsage = maxUsage != null && maxUsage >= 0 ? maxUsage : calcMax;
      this.slowestTime = slowestTime != null && slowestTime > 0 ? slowestTime : calcSlowest;
      this.minUsage = minUsage != null && minUsage >= 0 ? minUsage : calcMin;
    }
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

  public double getFastestTime() {
    return fastestTime;
  }

  public double getMaxUsage() {
    return maxUsage;
  }

  public double getSlowestTime() {
    return slowestTime;
  }

  public double getMinUsage() {
    return minUsage;
  }
}
