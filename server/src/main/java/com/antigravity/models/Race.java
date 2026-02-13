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

    @BsonCreator
    public Race(@BsonProperty("name") String name,
            @BsonProperty("track_entity_id") String trackEntityId,
            @BsonProperty("heat_rotation_type") HeatRotationType heatRotationType,
            @BsonProperty("heat_scoring") HeatScoring heatScoring,
            @BsonProperty("race_scoring") HeatScoring oldHeatScoring,
            @BsonProperty("overall_scoring") OverallScoring overallScoring,
            @BsonProperty("entity_id") String entityId,
            @BsonId ObjectId id) {
        super(id, entityId);
        this.name = name;
        this.trackEntityId = trackEntityId;
        this.heatRotationType = heatRotationType;
        this.heatScoring = heatScoring != null ? heatScoring
                : (oldHeatScoring != null ? oldHeatScoring : new HeatScoring());
        this.overallScoring = overallScoring != null ? overallScoring : new OverallScoring();
    }

    @JsonCreator
    public Race(@JsonProperty("name") String name,
            @JsonProperty("track_entity_id") String trackEntityId,
            @JsonProperty("heat_rotation_type") HeatRotationType heatRotationType,
            @JsonProperty("heat_scoring") HeatScoring heatScoring,
            @JsonProperty("overall_scoring") OverallScoring overallScoring,
            @JsonProperty(value = "entity_id", required = false) String entityId,
            @JsonProperty(value = "_id", required = false) ObjectId id) {
        this(name, trackEntityId, heatRotationType, heatScoring, null, overallScoring, entityId, id);
    }

    public Race(String name, String trackEntityId) {
        this(name, trackEntityId, HeatRotationType.RoundRobin, null, null, null, null);
    }

    public Race(String name, String trackEntityId, HeatRotationType heatRotationType, HeatScoring heatScoring,
            OverallScoring overallScoring) {
        this(name, trackEntityId, heatRotationType, heatScoring, overallScoring, null, null);
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
}
