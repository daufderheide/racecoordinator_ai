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
    private HeatStandings heatStandings;

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
        com.antigravity.models.RaceScoring scoring = model.getRaceScoring();
        HeatStandings.SortType sortType = HeatStandings.SortType.LAP_COUNT;
        HeatStandings.TieBreaker tieBreaker = HeatStandings.TieBreaker.FASTEST_LAP_TIME;

        if (scoring != null) {
            sortType = HeatStandings.SortType.valueOf(scoring.getHeatRanking().name());
            tieBreaker = HeatStandings.TieBreaker.valueOf(scoring.getHeatRankingTiebreaker().name());
        }

        this.heatStandings = new HeatStandings(this.currentHeat.getDrivers(), sortType, tieBreaker);
        this.currentHeat.setStandings(this.heatStandings.getStandings());

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

    public HeatStandings getHeatStandings() {
        return heatStandings;
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
}
