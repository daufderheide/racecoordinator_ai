package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class Race extends Model {
    private String name;

    @BsonProperty("track_entity_id")
    @JsonProperty("track_entity_id")
    private String trackEntityId;

    public Race() {
    }

    public Race(String name, String trackEntityId) {
        this.name = name;
        this.trackEntityId = trackEntityId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTrackEntityId() {
        return trackEntityId;
    }

    public void setTrackEntityId(String trackEntityId) {
        this.trackEntityId = trackEntityId;
    }
}
