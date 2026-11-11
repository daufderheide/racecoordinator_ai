package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class PointsScoring {

  @JsonProperty("position_points")
  @JsonAlias("positionPoints")
  private final List<Double> positionPoints;

  @JsonProperty("heat_position_points")
  @JsonAlias("heatPositionPoints")
  private final List<Double> heatPositionPoints;

  @JsonProperty("heat_carry_over_pct")
  @JsonAlias("heatCarryOverPct")
  private final double heatCarryOverPct;

  @JsonProperty("heat_bonus_fastest_lap")
  @JsonAlias("heatBonusFastestLap")
  private final double heatBonusFastestLap;

  @JsonProperty("heat_bonus_led_lap")
  @JsonAlias("heatBonusLedLap")
  private final double heatBonusLedLap;

  @JsonProperty("heat_bonus_most_laps_led")
  @JsonAlias("heatBonusMostLapsLed")
  private final double heatBonusMostLapsLed;

  @JsonProperty("heat_one_bonus_per_driver")
  @JsonAlias("heatOneBonusPerDriver")
  private final boolean heatOneBonusPerDriver;

  @JsonProperty("overall_bonus_fastest_lap")
  @JsonAlias("overallBonusFastestLap")
  private final double overallBonusFastestLap;

  @JsonProperty("overall_bonus_fastest_lap_per_lane")
  @JsonAlias("overallBonusFastestLapPerLane")
  private final double overallBonusFastestLapPerLane;

  @JsonProperty("overall_bonus_led_lap")
  @JsonAlias("overallBonusLedLap")
  private final double overallBonusLedLap;

  @JsonProperty("overall_bonus_most_laps_led")
  @JsonAlias("overallBonusMostLapsLed")
  private final double overallBonusMostLapsLed;

  @JsonProperty("overall_one_bonus_per_driver")
  @JsonAlias("overallOneBonusPerDriver")
  private final boolean overallOneBonusPerDriver;

  public PointsScoring() {
    this.positionPoints =
        new ArrayList<>(Arrays.asList(25.0, 18.0, 15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0, 1.0));
    this.heatPositionPoints = new ArrayList<>(Arrays.asList(3.0, 2.0, 1.0, 0.0));
    this.heatCarryOverPct = 0.0;
    this.heatBonusFastestLap = 0.0;
    this.heatBonusLedLap = 0.0;
    this.heatBonusMostLapsLed = 0.0;
    this.heatOneBonusPerDriver = false;
    this.overallBonusFastestLap = 0.0;
    this.overallBonusFastestLapPerLane = 0.0;
    this.overallBonusLedLap = 0.0;
    this.overallBonusMostLapsLed = 0.0;
    this.overallOneBonusPerDriver = false;
  }

  public PointsScoring(List<Double> heatPositionPoints) {
    this(null, heatPositionPoints, null, null, null, null, null, null, null, null, null, null);
  }

  public PointsScoring(List<Double> positionPoints, List<Double> heatPositionPoints) {
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
        null);
  }

  @JsonCreator
  public PointsScoring(
      @JsonProperty("position_points") @JsonAlias("positionPoints") List<Double> positionPoints,
      @JsonProperty("heat_position_points") @JsonAlias("heatPositionPoints")
          List<Double> heatPositionPoints,
      @JsonProperty("heat_carry_over_pct") @JsonAlias("heatCarryOverPct") Double heatCarryOverPct,
      @JsonProperty("heat_bonus_fastest_lap") @JsonAlias("heatBonusFastestLap")
          Double heatBonusFastestLap,
      @JsonProperty("heat_bonus_led_lap") @JsonAlias("heatBonusLedLap") Double heatBonusLedLap,
      @JsonProperty("heat_bonus_most_laps_led") @JsonAlias("heatBonusMostLapsLed")
          Double heatBonusMostLapsLed,
      @JsonProperty("heat_one_bonus_per_driver") @JsonAlias("heatOneBonusPerDriver")
          Boolean heatOneBonusPerDriver,
      @JsonProperty("overall_bonus_fastest_lap") @JsonAlias("overallBonusFastestLap")
          Double overallBonusFastestLap,
      @JsonProperty("overall_bonus_fastest_lap_per_lane")
          @JsonAlias("overallBonusFastestLapPerLane")
          Double overallBonusFastestLapPerLane,
      @JsonProperty("overall_bonus_led_lap") @JsonAlias("overallBonusLedLap")
          Double overallBonusLedLap,
      @JsonProperty("overall_bonus_most_laps_led") @JsonAlias("overallBonusMostLapsLed")
          Double overallBonusMostLapsLed,
      @JsonProperty("overall_one_bonus_per_driver") @JsonAlias("overallOneBonusPerDriver")
          Boolean overallOneBonusPerDriver) {
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

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    PointsScoring that = (PointsScoring) o;
    return Double.compare(that.heatCarryOverPct, heatCarryOverPct) == 0
        && Double.compare(that.heatBonusFastestLap, heatBonusFastestLap) == 0
        && Double.compare(that.heatBonusLedLap, heatBonusLedLap) == 0
        && Double.compare(that.heatBonusMostLapsLed, heatBonusMostLapsLed) == 0
        && heatOneBonusPerDriver == that.heatOneBonusPerDriver
        && Double.compare(that.overallBonusFastestLap, overallBonusFastestLap) == 0
        && Double.compare(that.overallBonusFastestLapPerLane, overallBonusFastestLapPerLane) == 0
        && Double.compare(that.overallBonusLedLap, overallBonusLedLap) == 0
        && Double.compare(that.overallBonusMostLapsLed, overallBonusMostLapsLed) == 0
        && overallOneBonusPerDriver == that.overallOneBonusPerDriver
        && Objects.equals(positionPoints, that.positionPoints)
        && Objects.equals(heatPositionPoints, that.heatPositionPoints);
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        positionPoints,
        heatPositionPoints,
        heatCarryOverPct,
        heatBonusFastestLap,
        heatBonusLedLap,
        heatBonusMostLapsLed,
        heatOneBonusPerDriver,
        overallBonusFastestLap,
        overallBonusFastestLapPerLane,
        overallBonusLedLap,
        overallBonusMostLapsLed,
        overallOneBonusPerDriver);
  }
}
