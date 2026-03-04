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
	}

	public Race(String name, String trackEntityId, HeatRotationType heatRotationType, HeatScoring heatScoring,
			OverallScoring overallScoring, Double minLapTime, AnalogFuelOptions fuelOptions, String entityId, ObjectId id) {
		this(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, minLapTime, fuelOptions, entityId,
				id);
	}

	public Race(String name, String trackEntityId, HeatRotationType heatRotationType, HeatScoring heatScoring,
			OverallScoring overallScoring, String entityId, ObjectId id) {
		this(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, 0.0, null, entityId, id);
	}

	public Race(String name, String trackEntityId, HeatRotationType heatRotationType, HeatScoring heatScoring,
			OverallScoring overallScoring, double minLapTime, String entityId, ObjectId id) {
		this(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, minLapTime, null, entityId, id);
	}

	public Race(String name, String trackEntityId) {
		this(name, trackEntityId, HeatRotationType.RoundRobin, null, null, null, 0.0, null, null, null);
	}

	public Race(String name, String trackEntityId, HeatRotationType heatRotationType, HeatScoring heatScoring,
			OverallScoring overallScoring) {
		this(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, 0.0, null, null, null);
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
}
