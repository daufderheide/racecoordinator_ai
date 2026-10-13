package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class Race extends Model {

  private final String name;

  @JsonProperty("track_entity_id")
  private final String trackEntityId;

  @JsonProperty("heat_rotation_type")
  private final HeatRotationType heatRotationType;

  @JsonProperty("heat_scoring")
  private final HeatScoring heatScoring;

  @JsonProperty("overall_scoring")
  private final OverallScoring overallScoring;

  @JsonProperty("season_scoring")
  @JsonAlias("seasonScoring")
  private final SeasonScoring seasonScoring;

  @JsonProperty("min_lap_time")
  private final double minLapTime;

  @JsonProperty("fuel_options")
  private final AnalogFuelOptions fuelOptions;

  @JsonProperty("digital_fuel_options")
  private final DigitalFuelOptions digitalFuelOptions;

  @JsonProperty("team_options")
  private final TeamOptions teamOptions;

  @JsonProperty("auto_advance_time")
  private final double autoAdvanceTime;

  @JsonProperty("auto_start_time")
  private final double autoStartTime;

  @JsonProperty("auto_advance_warmup_time")
  private final double autoAdvanceWarmupTime;

  @JsonProperty("auto_start_warmup_time")
  private final double autoStartWarmupTime;

  @JsonProperty("drift_time")
  private final double driftTime;

  @JsonProperty("start_time")
  private final double startTime;

  @JsonProperty("restart_time")
  private final double restartTime;

  @JsonProperty("start_randomizer")
  @JsonAlias({"startDelay", "start_delay", "startRandomizer"})
  private final double startRandomizer;

  @JsonProperty("restart_randomizer")
  @JsonAlias({"restartDelay", "restart_delay", "restartRandomizer"})
  private final double restartRandomizer;

  @JsonProperty("solo_lane_index")
  @JsonAlias("soloLaneIndex")
  private final int soloLaneIndex;

  @JsonProperty("custom_rotation_sequence")
  @JsonAlias("customRotationSequence")
  private final List<Integer> customRotationSequence;

  @JsonProperty("custom_rotation_asset_id")
  @JsonAlias("customRotationAssetId")
  private final String customRotationAssetId;

  @JsonProperty("custom_rotations")
  @JsonAlias("customRotations")
  private final List<CustomRotation> customRotations;

  @JsonProperty("heat_times_through")
  @JsonAlias("heatTimesThrough")
  private final int heatTimesThrough;

  @JsonProperty("reverse_heats")
  @JsonAlias("reverseHeats")
  private final boolean reverseHeats;

  @JsonProperty("hot_start")
  @JsonAlias("hotStart")
  private final boolean hotStart;

  @JsonProperty("start_at_current")
  @JsonAlias("startAtCurrent")
  private final boolean startAtCurrent;

  @JsonProperty("restart_on_false_start")
  @JsonAlias("restartOnFalseStart")
  private final boolean restartOnFalseStart;

  @JsonProperty("false_start_lap_penalty")
  @JsonAlias("falseStartLapPenalty")
  private final double falseStartLapPenalty;

  @JsonProperty("false_start_time_penalty")
  @JsonAlias("falseStartTimePenalty")
  private final double falseStartTimePenalty;

  @JsonProperty("group_options")
  @JsonAlias("groupOptions")
  private final GroupOptions groupOptions;

  @JsonProperty("start_behind_sensor")
  @JsonAlias("startBehindSensor")
  private final boolean startBehindSensor;

  @JsonProperty("practice")
  private final boolean practice;

  @JsonProperty("adjust_drift_laps")
  @JsonAlias("adjustDriftLaps")
  private final boolean adjustDriftLaps;

  @JsonProperty("theme_id")
  @JsonAlias("themeId")
  private final String themeId;

  @JsonCreator
  public Race(
      @JsonProperty("name") String name,
      @JsonProperty("track_entity_id") @JsonAlias("trackEntityId") String trackEntityId,
      @JsonProperty("heat_rotation_type") @JsonAlias("heatRotationType")
          HeatRotationType heatRotationType,
      @JsonProperty("heat_scoring") @JsonAlias("heatScoring") HeatScoring heatScoring,
      @JsonProperty("race_scoring") HeatScoring oldHeatScoring,
      @JsonProperty("overall_scoring") @JsonAlias("overallScoring") OverallScoring overallScoring,
      @JsonProperty("season_scoring") @JsonAlias("seasonScoring") SeasonScoring seasonScoring,
      @JsonProperty("min_lap_time") @JsonAlias("minLapTime") Double minLapTime,
      @JsonProperty("fuel_options") @JsonAlias("fuelOptions") AnalogFuelOptions fuelOptions,
      @JsonProperty("digital_fuel_options") @JsonAlias("digitalFuelOptions")
          DigitalFuelOptions digitalFuelOptions,
      @JsonProperty("team_options") @JsonAlias("teamOptions") TeamOptions teamOptions,
      @JsonProperty("auto_advance_time") @JsonAlias("autoAdvanceTime") Double autoAdvanceTime,
      @JsonProperty("auto_start_time") @JsonAlias("autoStartTime") Double autoStartTime,
      @JsonProperty("auto_advance_warmup_time") @JsonAlias("autoAdvanceWarmupTime")
          Double autoAdvanceWarmupTime,
      @JsonProperty("auto_start_warmup_time") @JsonAlias("autoStartWarmupTime")
          Double autoStartWarmupTime,
      @JsonProperty("drift_time") @JsonAlias("driftTime") Double driftTime,
      @JsonProperty("start_time") @JsonAlias("startTime") Double startTime,
      @JsonProperty("restart_time") @JsonAlias("restartTime") Double restartTime,
      @JsonProperty("start_randomizer") @JsonAlias({"startDelay", "start_delay", "startRandomizer"})
          Double startRandomizer,
      @JsonProperty("restart_randomizer")
          @JsonAlias({"restartDelay", "restart_delay", "restartRandomizer"})
          Double restartRandomizer,
      @JsonProperty("solo_lane_index") @JsonAlias("soloLaneIndex") Integer soloLaneIndex,
      @JsonProperty("custom_rotation_sequence") @JsonAlias("customRotationSequence")
          List<Integer> customRotationSequence,
      @JsonProperty("custom_rotation_asset_id") @JsonAlias("customRotationAssetId")
          String customRotationAssetId,
      @JsonProperty("custom_rotations") @JsonAlias("customRotations")
          List<CustomRotation> customRotations,
      @JsonProperty("heat_times_through") @JsonAlias("heatTimesThrough") Integer heatTimesThrough,
      @JsonProperty("reverse_heats") @JsonAlias("reverseHeats") Boolean reverseHeats,
      @JsonProperty("hot_start") @JsonAlias("hotStart") Boolean hotStart,
      @JsonProperty("start_at_current") @JsonAlias("startAtCurrent") Boolean startAtCurrent,
      @JsonProperty("restart_on_false_start") @JsonAlias("restartOnFalseStart")
          Boolean restartOnFalseStart,
      @JsonProperty("false_start_lap_penalty") @JsonAlias("falseStartLapPenalty")
          Double falseStartLapPenalty,
      @JsonProperty("false_start_time_penalty") @JsonAlias("falseStartTimePenalty")
          Double falseStartTimePenalty,
      @JsonProperty("group_options") @JsonAlias("groupOptions") GroupOptions groupOptions,
      @JsonProperty("start_behind_sensor") @JsonAlias("startBehindSensor")
          Boolean startBehindSensor,
      @JsonProperty("practice") @JsonAlias("practice") Boolean practice,
      @JsonProperty("adjust_drift_laps") @JsonAlias("adjustDriftLaps") Boolean adjustDriftLaps,
      @JsonProperty("theme_id") @JsonAlias("themeId") String themeId,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.trackEntityId = trackEntityId;
    this.heatRotationType = heatRotationType;
    this.heatScoring =
        heatScoring != null
            ? heatScoring
            : (oldHeatScoring != null ? oldHeatScoring : new HeatScoring());
    this.overallScoring = overallScoring != null ? overallScoring : new OverallScoring();
    this.seasonScoring = seasonScoring != null ? seasonScoring : new SeasonScoring();
    this.minLapTime = minLapTime != null ? minLapTime : 1.5;
    this.fuelOptions = fuelOptions != null ? fuelOptions : new AnalogFuelOptions();
    this.digitalFuelOptions =
        digitalFuelOptions != null ? digitalFuelOptions : new DigitalFuelOptions();
    this.teamOptions = teamOptions != null ? teamOptions : new TeamOptions();
    this.autoAdvanceTime = autoAdvanceTime != null ? autoAdvanceTime : 0.0;
    this.autoStartTime = autoStartTime != null ? autoStartTime : 0.0;
    this.autoAdvanceWarmupTime = autoAdvanceWarmupTime != null ? autoAdvanceWarmupTime : 0.0;
    this.autoStartWarmupTime = autoStartWarmupTime != null ? autoStartWarmupTime : 0.0;
    this.driftTime = driftTime != null ? driftTime : 0.5;
    this.startTime = startTime != null ? startTime : 5.0;
    this.restartTime = restartTime != null ? restartTime : 5.0;
    this.startRandomizer = startRandomizer != null ? startRandomizer : 0.0;
    this.restartRandomizer = restartRandomizer != null ? restartRandomizer : 0.0;
    this.soloLaneIndex = soloLaneIndex != null ? soloLaneIndex : 0;
    this.customRotationSequence =
        customRotationSequence != null ? customRotationSequence : new ArrayList<>();
    this.customRotationAssetId = customRotationAssetId;
    this.customRotations = customRotations != null ? customRotations : new ArrayList<>();
    this.heatTimesThrough = heatTimesThrough != null ? heatTimesThrough : 1;
    this.reverseHeats = reverseHeats != null ? reverseHeats : false;
    this.hotStart = hotStart != null ? hotStart : false;
    this.startAtCurrent = startAtCurrent != null ? startAtCurrent : false;
    this.restartOnFalseStart = restartOnFalseStart != null ? restartOnFalseStart : false;
    this.falseStartLapPenalty = falseStartLapPenalty != null ? falseStartLapPenalty : 0.0;
    this.falseStartTimePenalty = falseStartTimePenalty != null ? falseStartTimePenalty : 0.0;
    this.groupOptions = groupOptions != null ? groupOptions : new GroupOptions();
    this.startBehindSensor = startBehindSensor != null ? startBehindSensor : true;
    this.practice = practice != null ? practice : false;
    this.adjustDriftLaps = adjustDriftLaps != null ? adjustDriftLaps : false;
    this.themeId = themeId != null ? themeId : Theme.DEFAULT_THEME_ID;
  }

  public static class Builder {

    private String name;
    private String trackEntityId;
    private HeatRotationType heatRotationType = HeatRotationType.RoundRobin;
    private HeatScoring heatScoring = new HeatScoring();
    private OverallScoring overallScoring = new OverallScoring();
    private SeasonScoring seasonScoring = new SeasonScoring();
    private double minLapTime = 1.5;
    private AnalogFuelOptions fuelOptions = new AnalogFuelOptions();
    private DigitalFuelOptions digitalFuelOptions = new DigitalFuelOptions();
    private TeamOptions teamOptions = new TeamOptions();
    private double autoAdvanceTime = 0.0;
    private double autoStartTime = 0.0;
    private double autoAdvanceWarmupTime = 0.0;
    private double autoStartWarmupTime = 0.0;
    private double driftTime = 0.5;
    private double startTime = 5.0;
    private double restartTime = 5.0;
    private double startRandomizer = 0.0;
    private double restartRandomizer = 0.0;
    private int soloLaneIndex = 0;
    private List<Integer> customRotationSequence = new ArrayList<>();
    private String customRotationAssetId;
    private List<CustomRotation> customRotations = new ArrayList<>();
    private int heatTimesThrough = 1;
    private boolean reverseHeats = false;
    private boolean hotStart = false;
    private boolean startAtCurrent = false;
    private boolean restartOnFalseStart = false;
    private double falseStartLapPenalty = 0.0;
    private double falseStartTimePenalty = 0.0;
    private GroupOptions groupOptions = new GroupOptions();
    private boolean startBehindSensor = true;
    private boolean practice = false;
    private boolean adjustDriftLaps = false;
    private String themeId = Theme.DEFAULT_THEME_ID;
    private String entityId;
    private String id;

    public Builder from(Race other) {
      this.name = other.getName();
      this.trackEntityId = other.getTrackEntityId();
      this.heatRotationType = other.getHeatRotationType();
      this.heatScoring = other.getHeatScoring();
      this.overallScoring = other.getOverallScoring();
      this.seasonScoring = other.getSeasonScoring();
      this.minLapTime = other.getMinLapTime();
      this.fuelOptions = other.getFuelOptions();
      this.digitalFuelOptions = other.getDigitalFuelOptions();
      this.teamOptions = other.getTeamOptions();
      this.autoAdvanceTime = other.getAutoAdvanceTime();
      this.autoStartTime = other.getAutoStartTime();
      this.autoAdvanceWarmupTime = other.getAutoAdvanceWarmupTime();
      this.autoStartWarmupTime = other.getAutoStartWarmupTime();
      this.driftTime = other.getDriftTime();
      this.startTime = other.getStartTime();
      this.restartTime = other.getRestartTime();
      this.startRandomizer = other.getStartRandomizer();
      this.restartRandomizer = other.getRestartRandomizer();
      this.soloLaneIndex = other.getSoloLaneIndex();
      this.customRotationSequence = other.getCustomRotationSequence();
      this.customRotationAssetId = other.getCustomRotationAssetId();
      this.customRotations = other.getCustomRotations();
      this.heatTimesThrough = other.getHeatTimesThrough();
      this.reverseHeats = other.isReverseHeats();
      this.hotStart = other.isHotStart();
      this.startAtCurrent = other.isStartAtCurrent();
      this.restartOnFalseStart = other.isRestartOnFalseStart();
      this.falseStartLapPenalty = other.getFalseStartLapPenalty();
      this.falseStartTimePenalty = other.getFalseStartTimePenalty();
      this.groupOptions = other.getGroupOptions();
      this.startBehindSensor = other.isStartBehindSensor();
      this.practice = other.isPractice();
      this.adjustDriftLaps = other.isAdjustDriftLaps();
      this.themeId = other.getThemeId();
      this.entityId = other.getEntityId();
      this.id = other.getId();
      return this;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withTrackEntityId(String trackEntityId) {
      this.trackEntityId = trackEntityId;
      return this;
    }

    public Builder withHeatRotationType(HeatRotationType heatRotationType) {
      this.heatRotationType = heatRotationType;
      return this;
    }

    public Builder withHeatScoring(HeatScoring heatScoring) {
      this.heatScoring = heatScoring;
      return this;
    }

    public Builder withOverallScoring(OverallScoring overallScoring) {
      this.overallScoring = overallScoring;
      return this;
    }

    public Builder withSeasonScoring(SeasonScoring seasonScoring) {
      this.seasonScoring = seasonScoring;
      return this;
    }

    public Builder withMinLapTime(double minLapTime) {
      this.minLapTime = minLapTime;
      return this;
    }

    public Builder withFuelOptions(AnalogFuelOptions fuelOptions) {
      this.fuelOptions = fuelOptions;
      return this;
    }

    public Builder withDigitalFuelOptions(DigitalFuelOptions digitalFuelOptions) {
      this.digitalFuelOptions = digitalFuelOptions;
      return this;
    }

    public Builder withTeamOptions(TeamOptions teamOptions) {
      this.teamOptions = teamOptions;
      return this;
    }

    public Builder withAutoAdvanceTime(double autoAdvanceTime) {
      this.autoAdvanceTime = autoAdvanceTime;
      return this;
    }

    public Builder withAutoStartTime(double autoStartTime) {
      this.autoStartTime = autoStartTime;
      return this;
    }

    public Builder withAutoAdvanceWarmupTime(double autoAdvanceWarmupTime) {
      this.autoAdvanceWarmupTime = autoAdvanceWarmupTime;
      return this;
    }

    public Builder withAutoStartWarmupTime(double autoStartWarmupTime) {
      this.autoStartWarmupTime = autoStartWarmupTime;
      return this;
    }

    public Builder withDriftTime(double driftTime) {
      this.driftTime = driftTime;
      return this;
    }

    public Builder withStartTime(double startTime) {
      this.startTime = startTime;
      return this;
    }

    public Builder withRestartTime(double restartTime) {
      this.restartTime = restartTime;
      return this;
    }

    public Builder withStartRandomizer(double startRandomizer) {
      this.startRandomizer = startRandomizer;
      return this;
    }

    public Builder withRestartRandomizer(double restartRandomizer) {
      this.restartRandomizer = restartRandomizer;
      return this;
    }

    public Builder withSoloLaneIndex(int soloLaneIndex) {
      this.soloLaneIndex = soloLaneIndex;
      return this;
    }

    public Builder withCustomRotationSequence(List<Integer> customRotationSequence) {
      this.customRotationSequence = customRotationSequence;
      return this;
    }

    public Builder withCustomRotationAssetId(String customRotationAssetId) {
      this.customRotationAssetId = customRotationAssetId;
      return this;
    }

    public Builder withCustomRotations(List<CustomRotation> customRotations) {
      this.customRotations = customRotations;
      return this;
    }

    public Builder withHeatTimesThrough(int heatTimesThrough) {
      this.heatTimesThrough = heatTimesThrough;
      return this;
    }

    public Builder withReverseHeats(boolean reverseHeats) {
      this.reverseHeats = reverseHeats;
      return this;
    }

    public Builder withHotStart(boolean hotStart) {
      this.hotStart = hotStart;
      return this;
    }

    public Builder withStartAtCurrent(boolean startAtCurrent) {
      this.startAtCurrent = startAtCurrent;
      return this;
    }

    public Builder withRestartOnFalseStart(boolean restartOnFalseStart) {
      this.restartOnFalseStart = restartOnFalseStart;
      return this;
    }

    public Builder withFalseStartLapPenalty(double falseStartLapPenalty) {
      this.falseStartLapPenalty = falseStartLapPenalty;
      return this;
    }

    public Builder withFalseStartTimePenalty(double falseStartTimePenalty) {
      this.falseStartTimePenalty = falseStartTimePenalty;
      return this;
    }

    public Builder withGroupOptions(GroupOptions groupOptions) {
      this.groupOptions = groupOptions;
      return this;
    }

    public Builder withStartBehindSensor(boolean startBehindSensor) {
      this.startBehindSensor = startBehindSensor;
      return this;
    }

    public Builder withPractice(boolean practice) {
      this.practice = practice;
      return this;
    }

    public Builder withAdjustDriftLaps(boolean adjustDriftLaps) {
      this.adjustDriftLaps = adjustDriftLaps;
      return this;
    }

    public Builder withThemeId(String themeId) {
      this.themeId = themeId;
      return this;
    }

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withId(String id) {
      this.id = id;
      return this;
    }

    public Race build() {
      return new Race(
          name,
          trackEntityId,
          heatRotationType,
          heatScoring,
          null,
          overallScoring,
          seasonScoring,
          minLapTime,
          fuelOptions,
          digitalFuelOptions,
          teamOptions,
          autoAdvanceTime,
          autoStartTime,
          autoAdvanceWarmupTime,
          autoStartWarmupTime,
          driftTime,
          startTime,
          restartTime,
          startRandomizer,
          restartRandomizer,
          soloLaneIndex,
          customRotationSequence,
          customRotationAssetId,
          customRotations,
          heatTimesThrough,
          reverseHeats,
          hotStart,
          startAtCurrent,
          restartOnFalseStart,
          falseStartLapPenalty,
          falseStartTimePenalty,
          groupOptions,
          startBehindSensor,
          practice,
          adjustDriftLaps,
          themeId,
          entityId,
          id);
    }
  }

  public double getMinLapTime() {
    return minLapTime;
  }

  public String getName() {
    return name;
  }

  public String getTrackEntityId() {
    return trackEntityId;
  }

  public HeatRotationType getHeatRotationType() {
    return heatRotationType;
  }

  public HeatScoring getHeatScoring() {
    return heatScoring;
  }

  public OverallScoring getOverallScoring() {
    return overallScoring;
  }

  public SeasonScoring getSeasonScoring() {
    return seasonScoring;
  }

  public AnalogFuelOptions getFuelOptions() {
    return fuelOptions;
  }

  public DigitalFuelOptions getDigitalFuelOptions() {
    return digitalFuelOptions;
  }

  public TeamOptions getTeamOptions() {
    return teamOptions;
  }

  public double getAutoAdvanceTime() {
    return autoAdvanceTime;
  }

  public double getAutoStartTime() {
    return autoStartTime;
  }

  public double getAutoAdvanceWarmupTime() {
    return autoAdvanceWarmupTime;
  }

  public double getAutoStartWarmupTime() {
    return autoStartWarmupTime;
  }

  public double getDriftTime() {
    return driftTime;
  }

  public double getStartTime() {
    return startTime;
  }

  public double getRestartTime() {
    return restartTime;
  }

  public double getStartRandomizer() {
    return startRandomizer;
  }

  public double getRestartRandomizer() {
    return restartRandomizer;
  }

  public int getSoloLaneIndex() {
    return soloLaneIndex;
  }

  public List<Integer> getCustomRotationSequence() {
    return customRotationSequence;
  }

  public String getCustomRotationAssetId() {
    return customRotationAssetId;
  }

  public List<CustomRotation> getCustomRotations() {
    return customRotations;
  }

  public int getHeatTimesThrough() {
    return heatTimesThrough;
  }

  public boolean isReverseHeats() {
    return reverseHeats;
  }

  public boolean isHotStart() {
    return hotStart;
  }

  public boolean isStartAtCurrent() {
    return startAtCurrent;
  }

  public boolean isRestartOnFalseStart() {
    return restartOnFalseStart;
  }

  public double getFalseStartLapPenalty() {
    return falseStartLapPenalty;
  }

  public double getFalseStartTimePenalty() {
    return falseStartTimePenalty;
  }

  public GroupOptions getGroupOptions() {
    return groupOptions;
  }

  public boolean isStartBehindSensor() {
    return startBehindSensor;
  }

  @JsonProperty("practice")
  public boolean isPractice() {
    return practice;
  }

  @JsonProperty("adjust_drift_laps")
  public boolean isAdjustDriftLaps() {
    return adjustDriftLaps;
  }

  @JsonProperty("theme_id")
  public String getThemeId() {
    return themeId;
  }
}
