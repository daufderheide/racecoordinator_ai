package com.antigravity.models;

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

    @BsonCreator
    public Race(@BsonProperty("name") String name,
            @BsonProperty("track_entity_id") String trackEntityId,
            @BsonProperty("heat_rotation_type") HeatRotationType heatRotationType,
            @BsonProperty("entity_id") String entityId,
            @BsonId ObjectId id) {
        super(id, entityId);
        this.name = name;
        this.trackEntityId = trackEntityId;
        this.heatRotationType = heatRotationType;
    }

    public Race(String name, String trackEntityId) {
        this(name, trackEntityId, HeatRotationType.RoundRobin, null, null);
    }

    public Race(String name, String trackEntityId, HeatRotationType heatRotationType) {
        this(name, trackEntityId, heatRotationType, null, null);
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
}
