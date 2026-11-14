package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Objects;

public class CrashAndLearnOptions {

  @JsonProperty("enabled")
  private final boolean enabled;

  @JsonProperty("automated_crash_time")
  @JsonAlias("automatedCrashTime")
  private final double automatedCrashTime;

  @JsonProperty("max_crashes")
  @JsonAlias("maxCrashes")
  private final int maxCrashes;

  @JsonProperty("pause_heat_on_crash")
  @JsonAlias("pauseHeatOnCrash")
  private final boolean pauseHeatOnCrash;

  @JsonProperty("allow_multiple_crashes_per_lap")
  @JsonAlias({
    "allowMultipleCrashesPerLap",
    "allow_multiple_crashes_single_lap",
    "allowMultipleCrashesSingleLap"
  })
  private final boolean allowMultipleCrashesPerLap;

  @JsonProperty("reset_crashes_each_heat")
  @JsonAlias("resetCrashesEachHeat")
  private final boolean resetCrashesEachHeat;

  @JsonProperty("reset_dq_each_heat")
  @JsonAlias("resetDqEachHeat")
  private final boolean resetDqEachHeat;

  @JsonProperty("heat_crash_lap_penalty")
  @JsonAlias("heatCrashLapPenalty")
  private final double heatCrashLapPenalty;

  @JsonProperty("heat_time_penalty")
  @JsonAlias("heatTimePenalty")
  private final double heatTimePenalty;

  @JsonProperty("dq_heat_score_percentage")
  @JsonAlias({"dqHeatScorePercentage", "dq_score_percentage", "dqScorePercentage"})
  private final double dqHeatScorePercentage;

  public CrashAndLearnOptions() {
    this.enabled = false;
    this.automatedCrashTime = 0.0;
    this.maxCrashes = 3;
    this.pauseHeatOnCrash = true;
    this.allowMultipleCrashesPerLap = true;
    this.resetCrashesEachHeat = true;
    this.resetDqEachHeat = true;
    this.heatCrashLapPenalty = 0.0;
    this.heatTimePenalty = 0.0;
    this.dqHeatScorePercentage = 100.0;
  }

  @JsonCreator
  public CrashAndLearnOptions(
      @JsonProperty("enabled") Boolean enabled,
      @JsonProperty("automated_crash_time") @JsonAlias("automatedCrashTime")
          Double automatedCrashTime,
      @JsonProperty("max_crashes") @JsonAlias("maxCrashes") Integer maxCrashes,
      @JsonProperty("pause_heat_on_crash") @JsonAlias("pauseHeatOnCrash") Boolean pauseHeatOnCrash,
      @JsonProperty("allow_multiple_crashes_per_lap")
          @JsonAlias({
            "allowMultipleCrashesPerLap",
            "allow_multiple_crashes_single_lap",
            "allowMultipleCrashesSingleLap"
          })
          Boolean allowMultipleCrashesPerLap,
      @JsonProperty("reset_crashes_each_heat") @JsonAlias("resetCrashesEachHeat")
          Boolean resetCrashesEachHeat,
      @JsonProperty("reset_dq_each_heat") @JsonAlias("resetDqEachHeat") Boolean resetDqEachHeat,
      @JsonProperty("heat_crash_lap_penalty") @JsonAlias("heatCrashLapPenalty")
          Double heatCrashLapPenalty,
      @JsonProperty("heat_time_penalty") @JsonAlias("heatTimePenalty") Double heatTimePenalty,
      @JsonProperty("dq_heat_score_percentage")
          @JsonAlias({"dqHeatScorePercentage", "dq_score_percentage", "dqScorePercentage"})
          Double dqHeatScorePercentage) {
    this.enabled = enabled != null ? enabled : false;
    this.automatedCrashTime = automatedCrashTime != null ? automatedCrashTime : 0.0;
    this.maxCrashes = maxCrashes != null ? maxCrashes : 3;
    this.pauseHeatOnCrash = pauseHeatOnCrash != null ? pauseHeatOnCrash : true;
    this.allowMultipleCrashesPerLap =
        allowMultipleCrashesPerLap != null ? allowMultipleCrashesPerLap : true;
    this.resetCrashesEachHeat = resetCrashesEachHeat != null ? resetCrashesEachHeat : true;
    this.resetDqEachHeat = resetDqEachHeat != null ? resetDqEachHeat : true;
    this.heatCrashLapPenalty = heatCrashLapPenalty != null ? heatCrashLapPenalty : 0.0;
    this.heatTimePenalty = heatTimePenalty != null ? heatTimePenalty : 0.0;
    this.dqHeatScorePercentage = dqHeatScorePercentage != null ? dqHeatScorePercentage : 100.0;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public double getAutomatedCrashTime() {
    return automatedCrashTime;
  }

  public int getMaxCrashes() {
    return maxCrashes;
  }

  public boolean isPauseHeatOnCrash() {
    return pauseHeatOnCrash;
  }

  public boolean isAllowMultipleCrashesPerLap() {
    return allowMultipleCrashesPerLap;
  }

  public boolean isResetCrashesEachHeat() {
    return resetCrashesEachHeat;
  }

  public boolean isResetDqEachHeat() {
    return resetDqEachHeat;
  }

  public double getHeatCrashLapPenalty() {
    return heatCrashLapPenalty;
  }

  public double getHeatTimePenalty() {
    return heatTimePenalty;
  }

  public double getDqHeatScorePercentage() {
    return dqHeatScorePercentage;
  }

  public static class Builder {
    private boolean enabled = false;
    private double automatedCrashTime = 0.0;
    private int maxCrashes = 3;
    private boolean pauseHeatOnCrash = true;
    private boolean allowMultipleCrashesPerLap = true;
    private boolean resetCrashesEachHeat = true;
    private boolean resetDqEachHeat = true;
    private double heatCrashLapPenalty = 0.0;
    private double heatTimePenalty = 0.0;
    private double dqHeatScorePercentage = 100.0;

    public Builder from(CrashAndLearnOptions other) {
      if (other != null) {
        this.enabled = other.isEnabled();
        this.automatedCrashTime = other.getAutomatedCrashTime();
        this.maxCrashes = other.getMaxCrashes();
        this.pauseHeatOnCrash = other.isPauseHeatOnCrash();
        this.allowMultipleCrashesPerLap = other.isAllowMultipleCrashesPerLap();
        this.resetCrashesEachHeat = other.isResetCrashesEachHeat();
        this.resetDqEachHeat = other.isResetDqEachHeat();
        this.heatCrashLapPenalty = other.getHeatCrashLapPenalty();
        this.heatTimePenalty = other.getHeatTimePenalty();
        this.dqHeatScorePercentage = other.getDqHeatScorePercentage();
      }
      return this;
    }

    public Builder withEnabled(boolean enabled) {
      this.enabled = enabled;
      return this;
    }

    public Builder withAutomatedCrashTime(double automatedCrashTime) {
      this.automatedCrashTime = automatedCrashTime;
      return this;
    }

    public Builder withMaxCrashes(int maxCrashes) {
      this.maxCrashes = maxCrashes;
      return this;
    }

    public Builder withPauseHeatOnCrash(boolean pauseHeatOnCrash) {
      this.pauseHeatOnCrash = pauseHeatOnCrash;
      return this;
    }

    public Builder withAllowMultipleCrashesPerLap(boolean allowMultipleCrashesPerLap) {
      this.allowMultipleCrashesPerLap = allowMultipleCrashesPerLap;
      return this;
    }

    public Builder withResetCrashesEachHeat(boolean resetCrashesEachHeat) {
      this.resetCrashesEachHeat = resetCrashesEachHeat;
      return this;
    }

    public Builder withResetDqEachHeat(boolean resetDqEachHeat) {
      this.resetDqEachHeat = resetDqEachHeat;
      return this;
    }

    public Builder withHeatCrashLapPenalty(double heatCrashLapPenalty) {
      this.heatCrashLapPenalty = heatCrashLapPenalty;
      return this;
    }

    public Builder withHeatTimePenalty(double heatTimePenalty) {
      this.heatTimePenalty = heatTimePenalty;
      return this;
    }

    public Builder withDqHeatScorePercentage(double dqHeatScorePercentage) {
      this.dqHeatScorePercentage = dqHeatScorePercentage;
      return this;
    }

    public CrashAndLearnOptions build() {
      return new CrashAndLearnOptions(
          enabled,
          automatedCrashTime,
          maxCrashes,
          pauseHeatOnCrash,
          allowMultipleCrashesPerLap,
          resetCrashesEachHeat,
          resetDqEachHeat,
          heatCrashLapPenalty,
          heatTimePenalty,
          dqHeatScorePercentage);
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    CrashAndLearnOptions that = (CrashAndLearnOptions) o;
    return enabled == that.enabled
        && Double.compare(that.automatedCrashTime, automatedCrashTime) == 0
        && maxCrashes == that.maxCrashes
        && pauseHeatOnCrash == that.pauseHeatOnCrash
        && allowMultipleCrashesPerLap == that.allowMultipleCrashesPerLap
        && resetCrashesEachHeat == that.resetCrashesEachHeat
        && resetDqEachHeat == that.resetDqEachHeat
        && Double.compare(that.heatCrashLapPenalty, heatCrashLapPenalty) == 0
        && Double.compare(that.heatTimePenalty, heatTimePenalty) == 0
        && Double.compare(that.dqHeatScorePercentage, dqHeatScorePercentage) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(
        enabled,
        automatedCrashTime,
        maxCrashes,
        pauseHeatOnCrash,
        allowMultipleCrashesPerLap,
        resetCrashesEachHeat,
        resetDqEachHeat,
        heatCrashLapPenalty,
        heatTimePenalty,
        dqHeatScorePercentage);
  }

  @Override
  public String toString() {
    return "CrashAndLearnOptions{"
        + "enabled="
        + enabled
        + ", automatedCrashTime="
        + automatedCrashTime
        + ", maxCrashes="
        + maxCrashes
        + ", pauseHeatOnCrash="
        + pauseHeatOnCrash
        + ", allowMultipleCrashesPerLap="
        + allowMultipleCrashesPerLap
        + ", resetCrashesEachHeat="
        + resetCrashesEachHeat
        + ", resetDqEachHeat="
        + resetDqEachHeat
        + ", heatCrashLapPenalty="
        + heatCrashLapPenalty
        + ", heatTimePenalty="
        + heatTimePenalty
        + ", dqHeatScorePercentage="
        + dqHeatScorePercentage
        + '}';
  }
}
