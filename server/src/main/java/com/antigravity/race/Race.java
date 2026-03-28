package com.antigravity.race;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
  private boolean isDemoMode;

  // Dynamic race data
  private IRaceState state;
  private float accumulatedRaceTime = 0.0f;
  private boolean hasRacedInCurrentHeat = false;
  private boolean autoStartFired = false;
  private boolean autoAdvanceFired = false;
  private double autoStartRemaining = 0;
  private double autoAdvanceRemaining = 0;
  private boolean mainPower = false;

  // Heat execution state
  private HeatExecutionManager executionManager;

  public Race(com.antigravity.models.Race model,
      List<com.antigravity.race.RaceParticipant> drivers,
      com.antigravity.models.Track track,
      boolean isDemoMode) {
    this(model, drivers, track, isDemoMode, 0.0, 0.0);
  }

  public Race(com.antigravity.models.Race model,
      List<com.antigravity.race.RaceParticipant> drivers,
      com.antigravity.models.Track track,
      boolean isDemoMode,
      double autoAdvanceTime,
      double autoStartTime) {
    this.model = model;
    this.drivers = drivers;
    for (int i = 0; i < this.drivers.size(); i++) {
      this.drivers.get(i).setSeed(i + 1);
    }

    this.track = track;

    // Fill with empty drivers if we have fewer drivers than lanes
    int numLanes = this.track.getLanes().size();
    while (this.drivers.size() < numLanes) {
      this.drivers.add(new RaceParticipant(com.antigravity.models.Driver.EMPTY_DRIVER));
    }

    this.heats = HeatBuilder.buildHeats(this, this.drivers);
    this.currentHeat = this.heats.get(0);

    this.overallStandings = new OverallStandings(model.getHeatScoring(), model.getOverallScoring());
    // Default dropped heats to 0 or get from somewhere else if needed.
    // Assuming 0 for now as per plan, user mentioned it's a config option on the
    // class.

    this.createProtocols(isDemoMode);

    this.autoAdvanceRemaining = 0;
    this.autoStartRemaining = 0;

    this.executionManager = new HeatExecutionManager(this);
    initializeHeatExecutionState();

    this.state = new NotStarted();
    this.state.enter(this);

    initializeFuelLevels();
  }

  public Race(com.antigravity.models.Race model,
      List<RaceParticipant> drivers,
      Track track,
      List<Heat> heats,
      int currentHeatIndex,
      float accumulatedRaceTime,
      boolean hasRacedInCurrentHeat,
      boolean autoStartFired,
      boolean autoAdvanceFired,
      String stateClassName,
      boolean isDemoMode) {
    this.model = model;
    this.drivers = drivers;
    this.track = track;
    this.heats = heats;
    if (heats != null && currentHeatIndex >= 0 && currentHeatIndex < heats.size()) {
      this.currentHeat = heats.get(currentHeatIndex);
    } else if (heats != null && !heats.isEmpty()) {
      this.currentHeat = heats.get(0);
    }
    this.accumulatedRaceTime = accumulatedRaceTime;
    this.hasRacedInCurrentHeat = hasRacedInCurrentHeat;
    this.autoStartFired = autoStartFired;
    this.autoAdvanceFired = autoAdvanceFired;

    this.overallStandings = new OverallStandings(model.getHeatScoring(), model.getOverallScoring());
    this.createProtocols(isDemoMode);

    this.executionManager = new HeatExecutionManager(this);
    initializeHeatExecutionState();

    try {
      Class<?> clazz = Class.forName(stateClassName);
      this.state = (IRaceState) clazz.getDeclaredConstructor().newInstance();
    } catch (Exception e) {
      System.err.println("Failed to restore race state: " + stateClassName + ", falling back to NotStarted");
      this.state = new NotStarted();
    }
    this.state.enter(this);
  }

  public void init() {
    if (this.protocols != null) {
      this.protocols.open();
    }
  }

  public boolean isDemoMode() {
    return isDemoMode;
  }

  private void initializeFuelLevels() {
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (track != null && track.hasDigitalFuel()) {
      fuelOptions = model.getDigitalFuelOptions();
    } else {
      fuelOptions = model.getFuelOptions();
    }

    if (fuelOptions != null && fuelOptions.isEnabled()) {
      double initialLevel = (fuelOptions.getCapacity() * fuelOptions.getStartLevel()) / 100.0;
      for (RaceParticipant driver : drivers) {
        driver.setFuelLevel(initialLevel);
      }
    }
  }

  private void createProtocols(boolean isDemoMode) {
    this.isDemoMode = isDemoMode;
    List<IProtocol> protocols = new ArrayList<>();
    if (isDemoMode) {
      com.antigravity.models.AnalogFuelOptions fuelOptions = this.model.getFuelOptions();
      boolean isFuelRace = fuelOptions != null && fuelOptions.isEnabled();
      Demo protocol = new Demo(this.track.getLanes().size(), isFuelRace);
      protocols.add(protocol);
    } else {
      List<com.antigravity.protocols.arduino.ArduinoConfig> configs = this.track.getArduinoConfigs();
      if (configs != null && !configs.isEmpty()) {
        for (com.antigravity.protocols.arduino.ArduinoConfig config : configs) {
          ArduinoProtocol protocol = new ArduinoProtocol(config, this.track.getLanes().size());
          protocols.add(protocol);
        }
      } else {
        throw new IllegalArgumentException(
            "Race created in Real Mode, but no ArduinoConfig found for track: " + this.track.getName());
      }
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

  public void broadcastRaceTime(double autoAdvanceRemaining, double autoStartRemaining) {
    float displayTime = Math.max(0, this.getRaceTime());
    com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
        .setTime(displayTime)
        .setAutoAdvanceRemaining(autoAdvanceRemaining)
        .setAutoStartRemaining(autoStartRemaining)
        .build();

    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setRaceTime(raceTimeMsg)
        .build();

    this.broadcast(raceDataMsg);
  }

  public boolean isAutoStartFired() {
    return autoStartFired;
  }

  public void setAutoStartFired(boolean fired) {
    this.autoStartFired = fired;
  }

  public boolean isAutoAdvanceFired() {
    return autoAdvanceFired;
  }

  public void setAutoAdvanceFired(boolean fired) {
    this.autoAdvanceFired = fired;
  }

  public double getAutoStartRemaining() {
    return autoStartRemaining;
  }

  public void setAutoStartRemaining(double remaining) {
    this.autoStartRemaining = remaining;
  }

  public double getAutoAdvanceRemaining() {
    return autoAdvanceRemaining;
  }

  public void setAutoAdvanceRemaining(double remaining) {
    this.autoAdvanceRemaining = remaining;
  }

  public void clearAutoTimers() {
    this.autoStartRemaining = 0;
    this.autoAdvanceRemaining = 0;
    broadcastTime();
  }

  public void broadcastTime() {
    com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
        .setTime(this.getRaceTime())
        .setAutoStartRemaining(this.getAutoStartRemaining())
        .setAutoAdvanceRemaining(this.getAutoAdvanceRemaining())
        .build();

    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setRaceTime(raceTimeMsg)
        .build();

    this.broadcast(raceDataMsg);
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

    if (state instanceof com.antigravity.race.states.RaceOver) {
      ClientSubscriptionManager.getInstance().deleteAutoSave(model.getEntityId());
    }

    com.antigravity.proto.RaceState protoState = getProtoState(state);

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
    if (protocols != null) {
      protocols.close();
    }
    if (state != null) {
      state.exit(this);
    }
  }

  public void setMainPower(boolean on) {
    if (this.mainPower == on) {
      return;
    }
    this.mainPower = on;
    protocols.setMainPower(on);
  }

  public boolean isMainPower() {
    return mainPower;
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

  public List<com.antigravity.protocols.PartialTime> stopProtocols() {
    return protocols.stopTimer();
  }

  public void initializeHeatExecutionState() {
    int laneCount = 0;
    if (this.track != null && this.track.getLanes() != null) {
      laneCount = this.track.getLanes().size();
    }
    this.executionManager.initialize(laneCount);
  }

  public HeatExecutionManager getHeatExecutionManager() {
    return executionManager;
  }

  public void prepareHeat() {
    initializeHeatExecutionState();
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (track != null && track.hasDigitalFuel()) {
      fuelOptions = model.getDigitalFuelOptions();
    } else {
      fuelOptions = model.getFuelOptions();
    }

    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      return;
    }

    boolean resetAtStart = fuelOptions.isResetFuelAtHeatStart();
    double startLevel = (fuelOptions.getCapacity() * fuelOptions.getStartLevel()) / 100.0;

    for (com.antigravity.race.DriverHeatData heatData : currentHeat.getDrivers()) {
      RaceParticipant participant = heatData.getDriver();
      if (participant == null || participant.getDriver() == null || participant.getDriver().getEntityId() == null) {
        continue;
      }

      if (resetAtStart) {
        participant.setFuelLevel(startLevel);
      }

      // Store the initial fuel level for this heat to support restarts
      heatData.setInitialFuelLevel(participant.getFuelLevel());
    }
  }

  public void restoreHeatFuel() {
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (track != null && track.hasDigitalFuel()) {
      fuelOptions = model.getDigitalFuelOptions();
    } else {
      fuelOptions = model.getFuelOptions();
    }

    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      return;
    }

    for (com.antigravity.race.DriverHeatData heatData : currentHeat.getDrivers()) {
      heatData.getDriver().setFuelLevel(heatData.getInitialFuelLevel());
    }
  }

  public void resetCurrentHeat() {
    System.out.println("Race.resetCurrentHeat() called.");

    if (currentHeat != null) {
      // Reset all drivers in the heat
      for (com.antigravity.race.DriverHeatData driverData : currentHeat.getDrivers()) {
        driverData.reset();
      }

      // Reset standings to initial order
      currentHeat.getHeatStandings().reset();

      // Reset race time
      resetRaceTime();

      initializeHeatExecutionState();

      restoreHeatFuel();

      // Broadcast update to client
      java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
      for (com.antigravity.race.RaceParticipant p : getDrivers()) {
        sentObjectIds.add(com.antigravity.converters.HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
      }

      com.antigravity.proto.Race raceProto = com.antigravity.proto.Race.newBuilder()
          .setCurrentHeat(com.antigravity.converters.HeatConverter.toProto(currentHeat, sentObjectIds))
          .build();

      broadcast(com.antigravity.proto.RaceData.newBuilder()
          .setRace(raceProto)
          .build());

      // Also broadcast time reset
      broadcastTime();
    }
  }

  public void updateAndBroadcastOverallStandings() {
    overallStandings.recalculate(this.drivers, this.heats);

    // Broadcast updates
    List<com.antigravity.proto.RaceParticipant> participants = new ArrayList<>();
    Set<String> sentObjectIds = new HashSet<>();
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

  public boolean isActive() {
    return !(state instanceof com.antigravity.race.states.RaceOver);
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    state.onLap(lane, lapTime, interfaceId);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    state.onSegment(lane, segmentTime, interfaceId);
  }

  @Override
  public void onCallbutton(int lane) {
    state.onCallbutton(this, lane);
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

  @Override
  public void onInterfaceEvent(com.antigravity.proto.InterfaceEvent event) {
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
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

    List<com.antigravity.proto.Heat> heatProtos = heats.stream()
        .map(h -> com.antigravity.converters.HeatConverter.toProto(h, sentObjectIds))
        .collect(Collectors.toList());

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
    this.autoStartFired = false;
    this.autoAdvanceFired = false;
    this.autoStartRemaining = 0;
    this.autoAdvanceRemaining = 0;
    state.nextHeat(this);
  }

  // TODO(aufderheide): We should ask the state for it's enum value rather than
  // doing all these instanceof checks.
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
