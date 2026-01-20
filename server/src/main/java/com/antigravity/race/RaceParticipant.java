package com.antigravity.race;

import com.antigravity.models.Driver;

public class RaceParticipant extends ServerToClientObject {
    private final com.antigravity.models.Driver driver;

    public RaceParticipant(com.antigravity.models.Driver driver) {
        super();
        this.driver = driver;
    }

    public RaceParticipant(com.antigravity.models.Driver driver, String objectId) {
        super(objectId);
        this.driver = driver;
    }

    public Driver getDriver() {
        return driver;
    }

}
