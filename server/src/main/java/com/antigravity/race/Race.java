package com.antigravity.race;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.models.Heat;
import com.antigravity.protocols.demo.Demo;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.IProtocol;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;

import com.antigravity.models.Track;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import com.antigravity.race.handlers.ProtocolHandler;

public class Race {
    // Data based on the race model configuration
    private com.antigravity.models.Race model;
    private Track track;
    private List<Heat> heats;

    private ProtocolDelegate protocols;

    // Dynamic race data
    private IRaceState state;
    private float accumulatedRaceTime = 0.0f;

    public Race(MongoDatabase database, com.antigravity.models.Race model, boolean isDemoMode) {
        this.model = model;

        DatabaseService dbService = new DatabaseService();
        this.track = dbService.getTrack(database, model.getTrackEntityId());

        this.createProtocols(isDemoMode);

        this.state = new NotStarted();
        this.state.enter(this);
    }

    private void createProtocols(boolean isDemoMode) {
        List<IProtocol> protocols = new ArrayList<>();
        if (isDemoMode) {
            Demo protocol = new Demo(this.track.getLanes().size());
            protocols.add(protocol);
        } else {
            throw new IllegalArgumentException("isDemoMode must be true");
        }
        this.protocols = new ProtocolDelegate(protocols);
        this.protocols.setListener(new ProtocolHandler(this));
    }

    public com.antigravity.models.Race getRaceModel() {
        return model;
    }

    public com.antigravity.models.Track getTrack() {
        return track;
    }

    public List<Heat> getHeats() {
        return heats;
    }

    public void setHeats(List<Heat> heats) {
        this.heats = heats;
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

    public void startProtocols() {
        protocols.startTimer();
    }

    public void stopProtocols() {
        protocols.stopTimer();
    }
}
