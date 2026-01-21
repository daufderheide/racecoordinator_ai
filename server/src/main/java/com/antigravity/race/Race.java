package com.antigravity.race;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.protocols.demo.Demo;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;
import com.antigravity.models.Track;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;

public class Race implements ProtocolListener {
    // Data based on the race model configuration
    private com.antigravity.models.Race model;
    private Track track;
    private List<RaceParticipant> drivers;
    private List<Heat> heats;
    private Heat currentHeat;

    public List<RaceParticipant> getDrivers() {
        return drivers;
    }

    private ProtocolDelegate protocols;

    // Dynamic race data
    private IRaceState state;
    private float accumulatedRaceTime = 0.0f;

    public Race(MongoDatabase database,
            com.antigravity.models.Race model,
            List<RaceParticipant> drivers,
            boolean isDemoMode) {
        this.model = model;
        this.drivers = drivers;

        DatabaseService dbService = new DatabaseService();
        this.track = dbService.getTrack(database, model.getTrackEntityId());
        this.heats = HeatBuilder.buildHeats(this, this.drivers);
        this.currentHeat = this.heats.get(0);

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
        this.protocols.setListener(this);
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

    public Heat getCurrentHeat() {
        return currentHeat;
    }

    public float getRaceTime() {
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

    public boolean isRacing() {
        return state instanceof com.antigravity.race.states.Racing;
    }

    @Override
    public void onLap(int lane, float lapTime) {
        state.onLap(lane, lapTime);
    }

    public boolean isLastHeat() {
        return heats.indexOf(currentHeat) == heats.size() - 1;
    }

    public void moveToNextHeat() {
        int currentIndex = heats.indexOf(currentHeat);
        if (currentIndex < heats.size() - 1) {
            currentHeat = heats.get(currentIndex + 1);

            changeState(new NotStarted());

            // Optimized update: only send currentHeat
            java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
            for (RaceParticipant p : drivers) {
                sentObjectIds.add(com.antigravity.converters.HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
            }

            com.antigravity.proto.Race raceProto = com.antigravity.proto.Race.newBuilder()
                    .setCurrentHeat(com.antigravity.converters.HeatConverter.toProto(this.currentHeat, sentObjectIds))
                    .build();

            broadcast(com.antigravity.proto.RaceData.newBuilder()
                    .setRace(raceProto)
                    .build());
        }
    }
}
