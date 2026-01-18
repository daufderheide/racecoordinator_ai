package com.antigravity.race;

import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;

public class Race {
    private com.antigravity.models.Race model;
    private IRaceState state;
    private boolean isDemoMode;
    private float accumulatedRaceTime = 0.0f;

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

    public float getSafeRaceTime() {
        return accumulatedRaceTime;
    }

    public void addRaceTime(float delta) {
        accumulatedRaceTime += delta;
    }

    public void resetRaceTime() {
        accumulatedRaceTime = 0.0f;
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
        if (state instanceof com.antigravity.race.states.Paused) {
            System.out.println("Race.startRace() called. Resuming from Paused state.");
            changeState(new com.antigravity.race.states.Starting());
        } else if (state instanceof NotStarted) {
            System.out.println("Race.startRace() called. Starting new race.");
            resetRaceTime();
            changeState(new com.antigravity.race.states.Starting());
        } else {
            throw new IllegalStateException("Cannot start race: Race is not in NotStarted or Paused state.");
        }
    }

    public void pauseRace() {
        if (state instanceof com.antigravity.race.states.Starting) {
            System.out.println("Race.pauseRace() called. Cancelling start.");
            resetRaceTime();
            changeState(new NotStarted());
        } else if (state instanceof com.antigravity.race.states.Racing) {
            System.out.println("Race.pauseRace() called. Pausing race.");
            changeState(new com.antigravity.race.states.Paused());
        } else {
            throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
        }
    }

    public void stop() {
        if (state != null) {
            state.exit(this);
        }
    }
}
