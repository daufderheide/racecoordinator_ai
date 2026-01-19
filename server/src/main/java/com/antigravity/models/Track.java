package com.antigravity.models;

import java.util.List;

public class Track extends Model {
    private String name;
    private List<Lane> lanes;

    public Track() {
    }

    public Track(String name, List<Lane> lanes) {
        this.name = name;
        this.lanes = lanes;
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
