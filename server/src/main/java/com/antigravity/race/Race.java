package com.antigravity.race;

import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;

public class Race {
    private com.antigravity.models.Race model;
    private IRaceState state;
    private boolean isDemoMode;

    public Race(com.antigravity.models.Race model, boolean isDemoMode) {
        this.model = model;
        this.isDemoMode = isDemoMode;
        this.state = new NotStarted();
        this.state.enter(this);
    }

    public boolean isDemoMode() {
        return isDemoMode;
    }

    public com.antigravity.models.Race getRaceModel() {
        return model;
    }

    public void broadcast(com.google.protobuf.GeneratedMessageV3 message) {
        RaceManager.getInstance().broadcast(message);
    }

    public synchronized void changeState(IRaceState newState) {
        if (state != null) {
            state.exit(this);
        }
        state = newState;
        state.enter(this);
    }

    public void startRace() {
        if (!(state instanceof NotStarted)) {
            throw new IllegalStateException("Cannot start race: Race is not in NotStarted state.");
        }
        System.out.println("Race.startRace() called. Transitioning to Starting state.");
        changeState(new com.antigravity.race.states.Starting());
    }

    public void stop() {
        if (state != null) {
            state.exit(this);
        }
    }
}
