package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class SeasonScoring {

  @JsonProperty("position_points")
  private final List<Double> positionPoints;

  @JsonProperty("heat_position_points")
  private final List<Double> heatPositionPoints;

  @JsonProperty("heat_carry_over_pct")
  private final double heatCarryOverPct;

  @JsonProperty("heat_bonus_fastest_lap")
  private final double heatBonusFastestLap;

  @JsonProperty("heat_bonus_led_lap")
  private final double heatBonusLedLap;

  @JsonProperty("heat_bonus_most_laps_led")
  private final double heatBonusMostLapsLed;

  @JsonProperty("heat_one_bonus_per_driver")
  private final boolean heatOneBonusPerDriver;

  @JsonProperty("overall_carry_over_pct")
  private final double overallCarryOverPct;

  @JsonProperty("overall_bonus_fastest_lap")
  private final double overallBonusFastestLap;

  @JsonProperty("overall_bonus_fastest_lap_per_lane")
  private final double overallBonusFastestLapPerLane;

  @JsonProperty("overall_bonus_led_lap")
  private final double overallBonusLedLap;

  @JsonProperty("overall_bonus_most_laps_led")
  private final double overallBonusMostLapsLed;

  @JsonProperty("overall_one_bonus_per_driver")
  private final boolean overallOneBonusPerDriver;

  public SeasonScoring() {
    this.positionPoints =
        new ArrayList<>(Arrays.asList(25.0, 18.0, 15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0, 1.0));
    this.heatPositionPoints = new ArrayList<>(Arrays.asList(3.0, 2.0, 1.0, 0.0));
    this.heatCarryOverPct = 0.0;
    this.heatBonusFastestLap = 0.0;
    this.heatBonusLedLap = 0.0;
    this.heatBonusMostLapsLed = 0.0;
    this.heatOneBonusPerDriver = false;
    this.overallCarryOverPct = 0.0;
    this.overallBonusFastestLap = 0.0;
    this.overallBonusFastestLapPerLane = 0.0;
    this.overallBonusLedLap = 0.0;
    this.overallBonusMostLapsLed = 0.0;
    this.overallOneBonusPerDriver = false;
  }

  public SeasonScoring(List<Double> positionPoints, List<Double> heatPositionPoints) {
    this(
        positionPoints,
        heatPositionPoints,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null);
  }

  @JsonCreator
  public SeasonScoring(
      @JsonProperty("position_points") List<Double> positionPoints,
      @JsonProperty("heat_position_points") List<Double> heatPositionPoints,
      @JsonProperty("heat_carry_over_pct") Double heatCarryOverPct,
      @JsonProperty("heat_bonus_fastest_lap") Double heatBonusFastestLap,
      @JsonProperty("heat_bonus_led_lap") Double heatBonusLedLap,
      @JsonProperty("heat_bonus_most_laps_led") Double heatBonusMostLapsLed,
      @JsonProperty("heat_one_bonus_per_driver") Boolean heatOneBonusPerDriver,
      @JsonProperty("overall_carry_over_pct") Double overallCarryOverPct,
      @JsonProperty("overall_bonus_fastest_lap") Double overallBonusFastestLap,
      @JsonProperty("overall_bonus_fastest_lap_per_lane") Double overallBonusFastestLapPerLane,
      @JsonProperty("overall_bonus_led_lap") Double overallBonusLedLap,
      @JsonProperty("overall_bonus_most_laps_led") Double overallBonusMostLapsLed,
      @JsonProperty("overall_one_bonus_per_driver") Boolean overallOneBonusPerDriver) {
    this.positionPoints =
        positionPoints != null
            ? new ArrayList<>(positionPoints)
            : new ArrayList<>(Arrays.asList(25.0, 18.0, 15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0, 1.0));
    this.heatPositionPoints =
        heatPositionPoints != null
            ? new ArrayList<>(heatPositionPoints)
            : new ArrayList<>(Arrays.asList(3.0, 2.0, 1.0, 0.0));
    this.heatCarryOverPct = heatCarryOverPct != null ? heatCarryOverPct : 0.0;
    this.heatBonusFastestLap = heatBonusFastestLap != null ? heatBonusFastestLap : 0.0;
    this.heatBonusLedLap = heatBonusLedLap != null ? heatBonusLedLap : 0.0;
    this.heatBonusMostLapsLed = heatBonusMostLapsLed != null ? heatBonusMostLapsLed : 0.0;
    this.heatOneBonusPerDriver = heatOneBonusPerDriver != null ? heatOneBonusPerDriver : false;
    this.overallCarryOverPct = overallCarryOverPct != null ? overallCarryOverPct : 0.0;
    this.overallBonusFastestLap = overallBonusFastestLap != null ? overallBonusFastestLap : 0.0;
    this.overallBonusFastestLapPerLane =
        overallBonusFastestLapPerLane != null ? overallBonusFastestLapPerLane : 0.0;
    this.overallBonusLedLap = overallBonusLedLap != null ? overallBonusLedLap : 0.0;
    this.overallBonusMostLapsLed = overallBonusMostLapsLed != null ? overallBonusMostLapsLed : 0.0;
    this.overallOneBonusPerDriver =
        overallOneBonusPerDriver != null ? overallOneBonusPerDriver : false;
  }

  public List<Double> getPositionPoints() {
    return new ArrayList<>(positionPoints);
  }

  public List<Double> getHeatPositionPoints() {
    return new ArrayList<>(heatPositionPoints);
  }

  public double getHeatCarryOverPct() {
    return heatCarryOverPct;
  }

  public double getHeatBonusFastestLap() {
    return heatBonusFastestLap;
  }

  public double getHeatBonusLedLap() {
    return heatBonusLedLap;
  }

  public double getHeatBonusMostLapsLed() {
    return heatBonusMostLapsLed;
  }

  public boolean isHeatOneBonusPerDriver() {
    return heatOneBonusPerDriver;
  }

  public double getOverallCarryOverPct() {
    return overallCarryOverPct;
  }

  public double getOverallBonusFastestLap() {
    return overallBonusFastestLap;
  }

  public double getOverallBonusFastestLapPerLane() {
    return overallBonusFastestLapPerLane;
  }

  public double getOverallBonusLedLap() {
    return overallBonusLedLap;
  }

  public double getOverallBonusMostLapsLed() {
    return overallBonusMostLapsLed;
  }

  public boolean isOverallOneBonusPerDriver() {
    return overallOneBonusPerDriver;
  }
}
