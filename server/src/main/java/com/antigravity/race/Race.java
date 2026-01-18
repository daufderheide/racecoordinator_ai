package com.antigravity.race;

import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;

public class Race {
    private com.antigravity.models.Race model;
    private IRaceState state;

    public Race(com.antigravity.models.Race model) {
        this.model = model;
        this.state = new NotStarted();
        this.state.enter(this);
    }

    public com.antigravity.models.Race getRaceModel() {
        return model;
    }

    public void broadcast(com.google.protobuf.GeneratedMessageV3 message) {
        RaceManager.getInstance().broadcast(message);
    }

    public void stop() {
        if (state != null) {
            state.exit(this);
        }
    }
}
