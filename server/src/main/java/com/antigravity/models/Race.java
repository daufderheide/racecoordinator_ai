package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class Race extends Model {

  private final String name;

  @BsonProperty("track_entity_id")
  @JsonProperty("track_entity_id")
  private final String trackEntityId;

  @BsonProperty("heat_rotation_type")
  @JsonProperty("heat_rotation_type")
  private final HeatRotationType heatRotationType;

  @BsonProperty("heat_scoring")
  @JsonProperty("heat_scoring")
  private final HeatScoring heatScoring;

  @BsonProperty("overall_scoring")
  @JsonProperty("overall_scoring")
  private final OverallScoring overallScoring;

  @BsonProperty("min_lap_time")
  @JsonProperty("min_lap_time")
  private final double minLapTime;

  @BsonProperty("fuel_options")
  @JsonProperty("fuel_options")
  private final AnalogFuelOptions fuelOptions;

  @BsonProperty("digital_fuel_options")
  @JsonProperty("digital_fuel_options")
  private final DigitalFuelOptions digitalFuelOptions;

  @BsonProperty("team_options")
  @JsonProperty("team_options")
  private final TeamOptions teamOptions;

  @BsonProperty("auto_advance_time")
  @JsonProperty("auto_advance_time")
  private final double autoAdvanceTime;

  @BsonProperty("auto_start_time")
  @JsonProperty("auto_start_time")
  private final double autoStartTime;

  @BsonProperty("auto_advance_warmup_time")
  @JsonProperty("auto_advance_warmup_time")
  private final double autoAdvanceWarmupTime;

  @BsonProperty("auto_start_warmup_time")
  @JsonProperty("auto_start_warmup_time")
  private final double autoStartWarmupTime;

  @BsonProperty("drift_time")
  @JsonProperty("drift_time")
  private final double driftTime;

  @BsonProperty("start_time")
  @JsonProperty("start_time")
  private final double startTime;

  @BsonProperty("restart_time")
  @JsonProperty("restart_time")
  private final double restartTime;

  @BsonProperty("start_randomizer")
  @JsonProperty("start_randomizer")
  @JsonAlias({"startDelay", "start_delay", "startRandomizer"})
  private final double startRandomizer;

  @BsonProperty("restart_randomizer")
  @JsonProperty("restart_randomizer")
  @JsonAlias({"restartDelay", "restart_delay", "restartRandomizer"})
  private final double restartRandomizer;

  @BsonProperty("solo_lane_index")
  @JsonProperty("solo_lane_index")
  @JsonAlias("soloLaneIndex")
  private final int soloLaneIndex;

  @BsonProperty("custom_rotation_sequence")
  @JsonProperty("custom_rotation_sequence")
  @JsonAlias("customRotationSequence")
  private final List<Integer> customRotationSequence;

  @BsonProperty("custom_rotation_asset_id")
  @JsonProperty("custom_rotation_asset_id")
  @JsonAlias("customRotationAssetId")
  private final String customRotationAssetId;

  @BsonProperty("custom_rotations")
  @JsonProperty("custom_rotations")
  @JsonAlias("customRotations")
  private final List<CustomRotation> customRotations;

  @BsonProperty("heat_times_through")
  @JsonProperty("heat_times_through")
  @JsonAlias("heatTimesThrough")
  private final int heatTimesThrough;

  @BsonProperty("reverse_heats")
  @JsonProperty("reverse_heats")
  @JsonAlias("reverseHeats")
  private final boolean reverseHeats;

  @BsonProperty("hot_start")
  @JsonProperty("hot_start")
  @JsonAlias("hotStart")
  private final boolean hotStart;

  @BsonProperty("restart_on_false_start")
  @JsonProperty("restart_on_false_start")
  @JsonAlias("restartOnFalseStart")
  private final boolean restartOnFalseStart;

  @BsonProperty("false_start_lap_penalty")
  @JsonProperty("false_start_lap_penalty")
  @JsonAlias("falseStartLapPenalty")
  private final double falseStartLapPenalty;

  @BsonProperty("false_start_time_penalty")
  @JsonProperty("false_start_time_penalty")
  @JsonAlias("falseStartTimePenalty")
  private final double falseStartTimePenalty;

  @BsonProperty("group_options")
  @JsonProperty("group_options")
  @JsonAlias("groupOptions")
  private final GroupOptions groupOptions;

  @BsonProperty("start_behind_sensor")
  @JsonProperty("start_behind_sensor")
  @JsonAlias("startBehindSensor")
  private final boolean startBehindSensor;

  @BsonProperty("practice")
  @JsonProperty("practice")
  private final boolean practice;

  @BsonCreator
  @JsonCreator
  public Race(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("track_entity_id") @JsonProperty("track_entity_id") @JsonAlias("trackEntityId")
          String trackEntityId,
      @BsonProperty("heat_rotation_type")
          @JsonProperty("heat_rotation_type")
          @JsonAlias("heatRotationType")
          HeatRotationType heatRotationType,
      @BsonProperty("heat_scoring") @JsonProperty("heat_scoring") @JsonAlias("heatScoring")
          HeatScoring heatScoring,
      @BsonProperty("race_scoring") @JsonProperty("race_scoring") HeatScoring oldHeatScoring,
      @BsonProperty("overall_scoring") @JsonProperty("overall_scoring") @JsonAlias("overallScoring")
          OverallScoring overallScoring,
      @BsonProperty("min_lap_time") @JsonProperty("min_lap_time") @JsonAlias("minLapTime")
          Double minLapTime,
      @BsonProperty("fuel_options") @JsonProperty("fuel_options") @JsonAlias("fuelOptions")
          AnalogFuelOptions fuelOptions,
      @BsonProperty("digital_fuel_options")
          @JsonProperty("digital_fuel_options")
          @JsonAlias("digitalFuelOptions")
          DigitalFuelOptions digitalFuelOptions,
      @BsonProperty("team_options") @JsonProperty("team_options") @JsonAlias("teamOptions")
          TeamOptions teamOptions,
      @BsonProperty("auto_advance_time")
          @JsonProperty("auto_advance_time")
          @JsonAlias("autoAdvanceTime")
          Double autoAdvanceTime,
      @BsonProperty("auto_start_time") @JsonProperty("auto_start_time") @JsonAlias("autoStartTime")
          Double autoStartTime,
      @BsonProperty("auto_advance_warmup_time")
          @JsonProperty("auto_advance_warmup_time")
          @JsonAlias("autoAdvanceWarmupTime")
          Double autoAdvanceWarmupTime,
      @BsonProperty("auto_start_warmup_time")
          @JsonProperty("auto_start_warmup_time")
          @JsonAlias("autoStartWarmupTime")
          Double autoStartWarmupTime,
      @BsonProperty("drift_time") @JsonProperty("drift_time") @JsonAlias("driftTime")
          Double driftTime,
      @BsonProperty("start_time") @JsonProperty("start_time") @JsonAlias("startTime")
          Double startTime,
      @BsonProperty("restart_time") @JsonProperty("restart_time") @JsonAlias("restartTime")
          Double restartTime,
      @BsonProperty("start_randomizer")
          @JsonProperty("start_randomizer")
          @JsonAlias({"startDelay", "start_delay", "startRandomizer"})
          Double startRandomizer,
      @BsonProperty("restart_randomizer")
          @JsonProperty("restart_randomizer")
          @JsonAlias({"restartDelay", "restart_delay", "restartRandomizer"})
          Double restartRandomizer,
      @BsonProperty("solo_lane_index") @JsonProperty("solo_lane_index") @JsonAlias("soloLaneIndex")
          Integer soloLaneIndex,
      @BsonProperty("custom_rotation_sequence")
          @JsonProperty("custom_rotation_sequence")
          @JsonAlias("customRotationSequence")
          List<Integer> customRotationSequence,
      @BsonProperty("custom_rotation_asset_id")
          @JsonProperty("custom_rotation_asset_id")
          @JsonAlias("customRotationAssetId")
          String customRotationAssetId,
      @BsonProperty("custom_rotations")
          @JsonProperty("custom_rotations")
          @JsonAlias("customRotations")
          List<CustomRotation> customRotations,
      @BsonProperty("heat_times_through")
          @JsonProperty("heat_times_through")
          @JsonAlias("heatTimesThrough")
          Integer heatTimesThrough,
      @BsonProperty("reverse_heats") @JsonProperty("reverse_heats") @JsonAlias("reverseHeats")
          Boolean reverseHeats,
      @BsonProperty("hot_start") @JsonProperty("hot_start") @JsonAlias("hotStart") Boolean hotStart,
      @BsonProperty("restart_on_false_start")
          @JsonProperty("restart_on_false_start")
          @JsonAlias("restartOnFalseStart")
          Boolean restartOnFalseStart,
      @BsonProperty("false_start_lap_penalty")
          @JsonProperty("false_start_lap_penalty")
          @JsonAlias("falseStartLapPenalty")
          Double falseStartLapPenalty,
      @BsonProperty("false_start_time_penalty")
          @JsonProperty("false_start_time_penalty")
          @JsonAlias("falseStartTimePenalty")
          Double falseStartTimePenalty,
      @BsonProperty("group_options") @JsonProperty("group_options") @JsonAlias("groupOptions")
          GroupOptions groupOptions,
      @BsonProperty("start_behind_sensor")
          @JsonProperty("start_behind_sensor")
          @JsonAlias("startBehindSensor")
          Boolean startBehindSensor,
      @BsonProperty("practice") @JsonProperty("practice") @JsonAlias("practice") Boolean practice,
      @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
      @BsonId @JsonProperty("_id") ObjectId id) {
    super(id, entityId);
    this.name = name;
    this.trackEntityId = trackEntityId;
    this.heatRotationType = heatRotationType;
    this.heatScoring =
        heatScoring != null
            ? heatScoring
            : (oldHeatScoring != null ? oldHeatScoring : new HeatScoring());
    this.overallScoring = overallScoring != null ? overallScoring : new OverallScoring();
    this.minLapTime = minLapTime != null ? minLapTime : 0.0;
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
    this.restartOnFalseStart = restartOnFalseStart != null ? restartOnFalseStart : false;
    this.falseStartLapPenalty = falseStartLapPenalty != null ? falseStartLapPenalty : 0.0;
    this.falseStartTimePenalty = falseStartTimePenalty != null ? falseStartTimePenalty : 0.0;
    this.groupOptions = groupOptions != null ? groupOptions : new GroupOptions();
    this.startBehindSensor = startBehindSensor != null ? startBehindSensor : true;
    this.practice = practice != null ? practice : false;
  }

  public static class Builder {

    private String name;
    private String trackEntityId;
    private HeatRotationType heatRotationType = HeatRotationType.RoundRobin;
    private HeatScoring heatScoring = new HeatScoring();
    private OverallScoring overallScoring = new OverallScoring();
    private double minLapTime = 0.0;
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
    private boolean restartOnFalseStart = false;
    private double falseStartLapPenalty = 0.0;
    private double falseStartTimePenalty = 0.0;
    private GroupOptions groupOptions = new GroupOptions();
    private boolean startBehindSensor = true;
    private boolean practice = false;
    private String entityId;
    private ObjectId id;

    public Builder from(Race other) {
      this.name = other.getName();
      this.trackEntityId = other.getTrackEntityId();
      this.heatRotationType = other.getHeatRotationType();
      this.heatScoring = other.getHeatScoring();
      this.overallScoring = other.getOverallScoring();
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
      this.restartOnFalseStart = other.isRestartOnFalseStart();
      this.falseStartLapPenalty = other.getFalseStartLapPenalty();
      this.falseStartTimePenalty = other.getFalseStartTimePenalty();
      this.groupOptions = other.getGroupOptions();
      this.startBehindSensor = other.isStartBehindSensor();
      this.practice = other.isPractice();
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

    public Builder withEntityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder withId(ObjectId id) {
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
          restartOnFalseStart,
          falseStartLapPenalty,
          falseStartTimePenalty,
          groupOptions,
          startBehindSensor,
          practice,
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

  @BsonProperty("custom_rotation_sequence")
  public List<Integer> getCustomRotationSequence() {
    return customRotationSequence;
  }

  @BsonProperty("custom_rotation_asset_id")
  public String getCustomRotationAssetId() {
    return customRotationAssetId;
  }

  @BsonProperty("custom_rotations")
  public List<CustomRotation> getCustomRotations() {
    return customRotations;
  }

  @BsonProperty("heat_times_through")
  public int getHeatTimesThrough() {
    return heatTimesThrough;
  }

  @BsonProperty("reverse_heats")
  public boolean isReverseHeats() {
    return reverseHeats;
  }

  @BsonProperty("hot_start")
  public boolean isHotStart() {
    return hotStart;
  }

  @BsonProperty("restart_on_false_start")
  public boolean isRestartOnFalseStart() {
    return restartOnFalseStart;
  }

  @BsonProperty("false_start_lap_penalty")
  public double getFalseStartLapPenalty() {
    return falseStartLapPenalty;
  }

  @BsonProperty("false_start_time_penalty")
  public double getFalseStartTimePenalty() {
    return falseStartTimePenalty;
  }

  @BsonProperty("group_options")
  public GroupOptions getGroupOptions() {
    return groupOptions;
  }

  @BsonProperty("start_behind_sensor")
  public boolean isStartBehindSensor() {
    return startBehindSensor;
  }

  public boolean isPractice() {
    return practice;
  }
}
