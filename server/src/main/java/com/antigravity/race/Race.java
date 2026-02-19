package com.antigravity.race;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.antigravity.protocols.demo.Demo;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.CarData;
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
  private boolean hasRacedInCurrentHeat = false;

  public Race(MongoDatabase database,
      com.antigravity.models.Race model,
      List<RaceParticipant> drivers,
      boolean isDemoMode) {
    this(model, drivers, new DatabaseService().getTrack(database, model.getTrackEntityId()), isDemoMode);
  }

  public Race(com.antigravity.models.Race model,
      List<RaceParticipant> drivers,
      Track track,
      boolean isDemoMode) {
    this.model = model;
    this.drivers = drivers;
    for (int i = 0; i < this.drivers.size(); i++) {
      this.drivers.get(i).setSeed(i + 1);
    }

    this.track = track;
    this.heats = HeatBuilder.buildHeats(this, this.drivers);
    this.currentHeat = this.heats.get(0);

    this.overallStandings = new OverallStandings(model.getHeatScoring(), model.getOverallScoring());
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
      com.antigravity.protocols.arduino.ArduinoConfig config = this.track.getArduinoConfig();
      if (config != null) {
        ArduinoProtocol protocol = new ArduinoProtocol(config, this.track.getLanes().size());
        protocols.add(protocol);
      } else {
        throw new IllegalArgumentException(
            "Race created in Real Mode, but no ArduinoConfig found for track: " + this.track.getName());
      }
    }
    this.protocols = new ProtocolDelegate(protocols);
    this.protocols.setListener(this);
    this.protocols.open();
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

  public IRaceState getState() {
    return state;
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

  public boolean hasRacedInCurrentHeat() {
    return hasRacedInCurrentHeat;
  }

  public void setHasRacedInCurrentHeat(boolean hasRaced) {
    this.hasRacedInCurrentHeat = hasRaced;
  }

  public void broadcast(com.google.protobuf.GeneratedMessageV3 message) {
    ClientSubscriptionManager.getInstance().broadcast(message);
  }

  public synchronized void changeState(IRaceState newState) {
    if (state != null) {
      state.exit(this);
    }
    state = newState;
    state.enter(this);

    com.antigravity.proto.RaceState protoState = getProtoState(state);
    try {
      String tmpDir = System.getProperty("java.io.tmpdir");
      java.nio.file.Path logPath = java.nio.file.Paths.get(tmpDir, "race_debug.log");
      java.nio.file.Files.write(logPath,
          ("changeState to " + state.getClass().getSimpleName() + " -> Proto: " + protoState + "\n")
              .getBytes(),
          java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
    } catch (java.nio.channels.ClosedByInterruptException e) {
      System.err.println("Debug log write interrupted (harmless): " + e.getMessage());
      // Clear the interrupted status so we don't affect subsequent operations
      Thread.interrupted();
    } catch (java.io.IOException e) {
      System.err.println("Failed to write debug log: " + e.getMessage());
      e.printStackTrace();
    }

    com.antigravity.proto.RaceData raceData = com.antigravity.proto.RaceData.newBuilder()
        .setRaceState(protoState)
        .build();
    broadcast(raceData);
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

  public void setMainPower(boolean on) {
    protocols.setMainPower(on);
  }

  public void setLanePower(boolean on, int lane) {
    if (lane < 0) {
      for (int i = 0; i < this.track.getLanes().size(); i++) {
        protocols.setLanePower(on, i);
      }
    } else {
      protocols.setLanePower(on, lane);
    }
  }

  public void startProtocols() {
    protocols.startTimer();
  }

  public java.util.List<com.antigravity.protocols.PartialTime> stopProtocols() {
    return protocols.stopTimer();
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

  public boolean isActive() {
    return !(state instanceof com.antigravity.race.states.RaceOver);
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    state.onLap(lane, lapTime, interfaceId);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    // TODO(aufderheide): Implement this once one of the
    // protocols supports it.
  }

  @Override
  public void onInterfaceStatus(com.antigravity.proto.InterfaceStatus status) {
    com.antigravity.proto.InterfaceEvent event = com.antigravity.proto.InterfaceEvent.newBuilder()
        .setStatus(com.antigravity.proto.InterfaceStatusEvent.newBuilder()
            .setStatus(status)
            .build())
        .build();
    // Since this is an InterfaceEvent, we use broadcastInterfaceEvent if available
    // or just broadcast it if it's a generic message.
    // InterfaceEvent is generated from proto.
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onCarData(CarData carData) {
    state.onCarData(carData);
  }

  public boolean isLastHeat() {
    return heats.indexOf(currentHeat) == heats.size() - 1;
  }

  // TODO(aufderheide): This synchronize probably isn't enough. We need to lock
  // the race object while we're creating the snapshot.
  public synchronized com.antigravity.proto.RaceData createSnapshot() {
    Set<String> sentObjectIds = new HashSet<>();
    com.antigravity.proto.RaceModel raceProto = com.antigravity.converters.RaceConverter.toProto(model, track,
        sentObjectIds);

    List<com.antigravity.proto.RaceParticipant> driverModels = new ArrayList<>();
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
        .setState(getProtoState(state))
        .build();

    return com.antigravity.proto.RaceData.newBuilder()
        .setRace(raceUpdate)
        .build();
  }

  public void moveToNextHeat() {
    state.nextHeat(this);
  }

  private com.antigravity.proto.RaceState getProtoState(IRaceState state) {
    if (state instanceof NotStarted) {
      return com.antigravity.proto.RaceState.NOT_STARTED;
    } else if (state instanceof com.antigravity.race.states.Starting) {
      return com.antigravity.proto.RaceState.STARTING;
    } else if (state instanceof com.antigravity.race.states.Racing) {
      return com.antigravity.proto.RaceState.RACING;
    } else if (state instanceof com.antigravity.race.states.Paused) {
      return com.antigravity.proto.RaceState.PAUSED;
    } else if (state instanceof com.antigravity.race.states.HeatOver) {
      return com.antigravity.proto.RaceState.HEAT_OVER;
    } else if (state instanceof com.antigravity.race.states.RaceOver) {
      return com.antigravity.proto.RaceState.RACE_OVER;
    }
    return com.antigravity.proto.RaceState.UNKNOWN_STATE;
  }
}
