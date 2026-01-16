package com.antigravity.models;

import org.bson.types.ObjectId;

public class Driver {
    private ObjectId id;
    private String name;

    public Driver() {
    }

    public Driver(String name) {
        this.name = name;
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
}
