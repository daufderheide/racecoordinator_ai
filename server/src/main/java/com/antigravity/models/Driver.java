package com.antigravity.models;

public class Driver extends Model {
    public static final Driver EMPTY_DRIVER = new Driver("Empty", "Empty");

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
