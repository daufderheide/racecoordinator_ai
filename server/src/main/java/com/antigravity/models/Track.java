package com.antigravity.models;

import org.bson.types.ObjectId;
import java.util.List;

public class Track extends Model {
    private ObjectId id;
    private String name;
    private List<Lane> lanes;

    public Track() {
    }

    public Track(String name, List<Lane> lanes) {
        this.name = name;
        this.lanes = lanes;
    }

    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Lane> getLanes() {
        return lanes;
    }

    public void setLanes(List<Lane> lanes) {
        this.lanes = lanes;
    }
}
