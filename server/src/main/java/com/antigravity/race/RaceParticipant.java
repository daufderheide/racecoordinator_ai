package com.antigravity.race;

import com.antigravity.models.Driver;

public class RaceParticipant {
    private Driver driver;

    public RaceParticipant(Driver driver) {
        this.driver = driver;
    }

    public Driver getDriver() {
        return driver;
    }
}
