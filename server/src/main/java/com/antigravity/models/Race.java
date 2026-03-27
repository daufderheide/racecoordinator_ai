package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
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

	@BsonCreator
	@JsonCreator
	public Race(@BsonProperty("name") @JsonProperty("name") String name,
			@BsonProperty("track_entity_id") @JsonProperty("track_entity_id") String trackEntityId,
			@BsonProperty("heat_rotation_type") @JsonProperty("heat_rotation_type") HeatRotationType heatRotationType,
			@BsonProperty("heat_scoring") @JsonProperty("heat_scoring") HeatScoring heatScoring,
			@BsonProperty("race_scoring") @JsonProperty("race_scoring") HeatScoring oldHeatScoring,
			@BsonProperty("overall_scoring") @JsonProperty("overall_scoring") OverallScoring overallScoring,
			@BsonProperty("min_lap_time") @JsonProperty("min_lap_time") Double minLapTime,
			@BsonProperty("fuel_options") @JsonProperty("fuel_options") AnalogFuelOptions fuelOptions,
			@BsonProperty("digital_fuel_options") @JsonProperty("digital_fuel_options") DigitalFuelOptions digitalFuelOptions,
			@BsonProperty("team_options") @JsonProperty("team_options") TeamOptions teamOptions,
			@BsonProperty("auto_advance_time") @JsonProperty("auto_advance_time") Double autoAdvanceTime,
			@BsonProperty("auto_start_time") @JsonProperty("auto_start_time") Double autoStartTime,
			@BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
			@BsonId @JsonProperty("_id") ObjectId id) {
		super(id, entityId);
		this.name = name;
		this.trackEntityId = trackEntityId;
		this.heatRotationType = heatRotationType;
		this.heatScoring = heatScoring != null ? heatScoring
				: (oldHeatScoring != null ? oldHeatScoring : new HeatScoring());
		this.overallScoring = overallScoring != null ? overallScoring : new OverallScoring();
		this.minLapTime = minLapTime != null ? minLapTime : 0.0;
		this.fuelOptions = fuelOptions != null ? fuelOptions : new AnalogFuelOptions();
		this.digitalFuelOptions = digitalFuelOptions != null ? digitalFuelOptions : new DigitalFuelOptions();
		this.teamOptions = teamOptions != null ? teamOptions : new TeamOptions();
		this.autoAdvanceTime = autoAdvanceTime != null ? autoAdvanceTime : 0.0;
		this.autoStartTime = autoStartTime != null ? autoStartTime : 0.0;
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
		private String entityId;
		private ObjectId id;

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

		public Builder withEntityId(String entityId) {
			this.entityId = entityId;
			return this;
		}

		public Builder withId(ObjectId id) {
			this.id = id;
			return this;
		}

		public Race build() {
			return new Race(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, minLapTime,
					fuelOptions, digitalFuelOptions, teamOptions, autoAdvanceTime, autoStartTime, entityId, id);
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
}
