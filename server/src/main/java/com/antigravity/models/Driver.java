package com.antigravity.models;

import org.bson.types.ObjectId;

public class Driver {
    private ObjectId id;
    private String name;
    private String nickname;

    public Driver() {
    }

    public Driver(String name) {
        this.name = name;
    }

    public Driver(String name, String nickname) {
        this.name = name;
        this.nickname = nickname;
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

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
}
