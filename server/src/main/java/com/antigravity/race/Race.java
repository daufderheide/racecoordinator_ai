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
    private OverallStandings overallStandings;

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

        this.overallStandings = new OverallStandings(model.getRaceScoring());
        // Default dropped heats to 0 or get from somewhere else if needed.
        // Assuming 0 for now as per plan, user mentioned it's a config option on the
        // class.

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

    public void setCurrentHeat(Heat currentHeat) {
        this.currentHeat = currentHeat;
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
        state.start(this);
    }

    public void pauseRace() {
        state.pause(this);
    }

    public void restartHeat() {
        state.restartHeat(this);
    }

    public void skipHeat() {
        state.skipHeat(this);
    }

    public void deferHeat() {
        state.deferHeat(this);
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

    public void updateAndBroadcastOverallStandings() {
        overallStandings.recalculate(this.drivers, this.heats);

        // Broadcast updates
        java.util.List<com.antigravity.proto.RaceParticipant> participants = new java.util.ArrayList<>();
        java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
        for (RaceParticipant driver : this.drivers) {
            participants.add(com.antigravity.converters.RaceParticipantConverter.toProto(driver, sentObjectIds));
        }

        com.antigravity.proto.OverallStandingsUpdate update = com.antigravity.proto.OverallStandingsUpdate.newBuilder()
                .addAllParticipants(participants)
                .build();

        com.antigravity.proto.RaceData raceData = com.antigravity.proto.RaceData.newBuilder()
                .setOverallStandingsUpdate(update)
                .build();

        broadcast(raceData);
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

    // TODO(aufderheide): This synchronize probably isn't enough. We need to lock
    // the race object while we're creating the snapshot.
    public synchronized com.antigravity.proto.RaceData createSnapshot() {
        java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
        com.antigravity.proto.RaceModel raceProto = com.antigravity.converters.RaceConverter.toProto(model, track,
                sentObjectIds);

        java.util.List<com.antigravity.proto.RaceParticipant> driverModels = new java.util.ArrayList<>();
        for (RaceParticipant participant : drivers) {
            driverModels
                    .add(com.antigravity.converters.RaceParticipantConverter.toProto(participant, sentObjectIds));
        }

        java.util.List<com.antigravity.proto.Heat> heatProtos = heats.stream()
                .map(h -> com.antigravity.converters.HeatConverter.toProto(h, sentObjectIds))
                .collect(java.util.stream.Collectors.toList());

        com.antigravity.proto.Race raceUpdate = com.antigravity.proto.Race.newBuilder()
                .setRace(raceProto)
                .addAllDrivers(driverModels)
                .addAllHeats(heatProtos)
                .setCurrentHeat(
                        com.antigravity.converters.HeatConverter.toProto(currentHeat, sentObjectIds))
                .build();

        return com.antigravity.proto.RaceData.newBuilder()
                .setRace(raceUpdate)
                .build();
    }

    public void moveToNextHeat() {
        state.nextHeat(this);
    }
}
