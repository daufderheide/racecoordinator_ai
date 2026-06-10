package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.converters.HeatConverter;
import com.antigravity.converters.RaceConverter;
import com.antigravity.converters.RaceParticipantConverter;
import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.OverallScoring.OverallRanking;
import com.antigravity.models.Track;
import com.antigravity.proto.CallbuttonEvent;
import com.antigravity.proto.DemoConfig;
import com.antigravity.proto.GroupStandingsUpdate;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.InterfaceStatusEvent;
import com.antigravity.proto.ModifyHeatsRequest;
import com.antigravity.proto.ModifyHeatsResponse;
import com.antigravity.proto.OverallStandingsUpdate;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RaceTime;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RegenerateHeatsRequest;
import com.antigravity.proto.RegenerateHeatsResponse;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.PartialTime;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.DatabaseService;
import com.google.protobuf.GeneratedMessageV3;
import com.mongodb.client.model.Filters;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Race implements ProtocolListener {
  private static final Logger logger = LoggerFactory.getLogger(Race.class);

  private final com.antigravity.models.Race model; // fqn-collision
  private final Track track;
  private final List<RaceParticipant> drivers;
  private List<Heat> heats;
  private Heat currentHeat;
  private final OverallStandings overallStandings;
  private final List<CustomRotation> customRotations;

  private final RaceHardwareManager hardwareManager;
  private final RaceRecords recordsManager;
  private final RaceHeatManager heatManager;

  private boolean isDemoMode;
  private DemoConfig demoConfig;
  private DatabaseContext databaseContext;

  private IRaceState state;
  private float accumulatedRaceTime = 0.0f;
  private boolean hasRacedInCurrentHeat = false;
  private boolean autoStartFired = false;
  private boolean autoAdvanceFired = false;
  private double autoStartRemaining = 0;
  private double autoAdvanceRemaining = 0;
  private boolean mainPower = false;
  private boolean[] lanePower;

  private HeatExecutionManager executionManager;
  private RaceStatistics statistics;

  private Race(Builder builder) {
    this.model = builder.model;
    this.track = builder.track;
    this.drivers = builder.drivers != null ? new ArrayList<>(builder.drivers) : new ArrayList<>();
    this.databaseContext = builder.databaseContext;
    this.customRotations =
        builder.customRotations != null
            ? new ArrayList<>(builder.customRotations)
            : new ArrayList<>();

    this.recordsManager = new RaceRecords(this);
    if (this.databaseContext != null && this.model != null && this.model.getEntityId() != null) {
      RecordData existingRecords =
          DatabaseService.getInstance()
              .getRaceRecords( // fqn-collision
                  this.databaseContext.getDatabase(), this.model.getEntityId(), builder.isDemoMode);
      if (existingRecords != null) {
        // Only load Overall records — Current session always starts fresh.
        // Loading stale current records from a previous session causes the UI to show
        // old per-session records before any laps have been run.
        if (existingRecords.hasOverall()) {
          this.recordsManager.loadOverallRaceRecords(existingRecords.getOverall());
        }
      }
    }

    this.heatManager = new RaceHeatManager(this);
    this.hardwareManager = new RaceHardwareManager(this);

    if (this.model != null
        && this.customRotations.isEmpty()
        && this.model.getHeatRotationType() == HeatRotationType.Custom) {
      List<CustomRotation> resolved = resolveCustomRotations(this.model.getCustomRotationAssetId());
      if (resolved != null) {
        this.customRotations.addAll(resolved);
      }
    }

    if (builder.heats == null) {
      for (int i = 0; i < this.drivers.size(); i++) {
        this.drivers.get(i).setSeed(i + 1);
      }
      int numLanes = this.track.getLanes().size();
      while (this.drivers.size() < numLanes) {
        this.drivers.add(new RaceParticipant(Driver.EMPTY_DRIVER));
      }
      this.heats = HeatBuilder.buildHeats(this, this.drivers, this.customRotations);
      this.currentHeat = this.heats.get(0);
      recordsManager.resetHeatRecords();
    } else {
      this.heats = new ArrayList<>(builder.heats);
      // Link the DriverHeatData's driver references to the master driver list in this.drivers.
      // This is crucial because MongoDB deserialization creates separate instances, causing overall
      // standings updates to not propagate to the heat's driver objects.
      java.util.Map<String, RaceParticipant> masterDrivers = new java.util.HashMap<>();
      for (RaceParticipant rp : this.drivers) {
        masterDrivers.put(rp.getStableId(), rp);
      }
      for (Heat heat : this.heats) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd.getDriver() != null) {
            RaceParticipant master = masterDrivers.get(dhd.getDriver().getStableId());
            if (master != null) {
              dhd.setDriver(master);
            }
          }
        }
      }

      if (builder.currentHeatIndex >= 0 && builder.currentHeatIndex < this.heats.size()) {
        this.currentHeat = this.heats.get(builder.currentHeatIndex);
      } else if (!this.heats.isEmpty()) {
        this.currentHeat = this.heats.get(0);
      }
    }

    this.accumulatedRaceTime = builder.accumulatedRaceTime;
    this.lanePower = new boolean[this.track.getLanes().size()];
    Arrays.fill(this.lanePower, true);
    this.hasRacedInCurrentHeat = builder.hasRacedInCurrentHeat;
    this.autoStartFired = builder.autoStartFired;
    this.autoAdvanceFired = builder.autoAdvanceFired;
    this.statistics = builder.statistics != null ? builder.statistics : new RaceStatistics();

    this.overallStandings =
        new OverallStandings(
            model.getHeatScoring(), model.getOverallScoring(), model.getGroupOptions());
    this.demoConfig = builder.demoConfig;
    this.hardwareManager.createProtocols(builder.isDemoMode, builder.demoConfig);
    this.isDemoMode = builder.isDemoMode;

    this.executionManager = new HeatExecutionManager(this);
    initializeHeatExecutionState();

    if (builder.stateClassName != null) {
      try {
        Class<?> clazz = Class.forName(builder.stateClassName);
        this.state = (IRaceState) clazz.getDeclaredConstructor().newInstance();
      } catch (Exception e) {
        logger.error("Failed to restore race state", e);
        this.state = new NotStarted();
      }
    } else {
      this.state = new NotStarted();
    }

    if (builder.heats == null) {
      initializeFuelLevels();
    }

    this.state.enter(this);

    if (isTimeBasedRanking()) {
      recordsManager.recalculateScoreRecords();
    }
    recordsManager.broadcastRecords();
    updateAndBroadcastOverallStandings();
  }

  public void init() {
    if (this.hardwareManager.getProtocols() != null) {
      if (this.hardwareManager.open()) {
        initializeHardwareState();
      }
    }
  }

  public static class Builder {
    private com.antigravity.models.Race model; // fqn-collision
    private List<RaceParticipant> drivers;
    private Track track;
    private boolean isDemoMode = false;
    private DatabaseContext databaseContext;
    private List<Heat> heats;
    private List<CustomRotation> customRotations;
    private int currentHeatIndex = -1;
    private float accumulatedRaceTime = 0f;
    private boolean hasRacedInCurrentHeat = false;
    private boolean autoStartFired = false;
    private boolean autoAdvanceFired = false;
    private String stateClassName = null;
    private RaceStatistics statistics;
    private DemoConfig demoConfig;

    public Builder model(com.antigravity.models.Race model) { // fqn-collision
      this.model = model;
      if (model != null && model.getCustomRotations() != null) {
        this.customRotations = model.getCustomRotations();
      }
      return this;
    }

    public Builder drivers(List<RaceParticipant> drivers) {
      this.drivers = drivers;
      return this;
    }

    public Builder track(Track track) {
      this.track = track;
      return this;
    }

    public Builder isDemoMode(boolean isDemoMode) {
      this.isDemoMode = isDemoMode;
      return this;
    }

    public Builder databaseContext(DatabaseContext dc) {
      this.databaseContext = dc;
      return this;
    }

    public Builder heats(List<Heat> heats) {
      this.heats = heats;
      return this;
    }

    public Builder customRotations(List<CustomRotation> cr) {
      this.customRotations = cr;
      return this;
    }

    public Builder currentHeatIndex(int index) {
      this.currentHeatIndex = index;
      return this;
    }

    public Builder accumulatedRaceTime(float time) {
      this.accumulatedRaceTime = time;
      return this;
    }

    public Builder hasRacedInCurrentHeat(boolean b) {
      this.hasRacedInCurrentHeat = b;
      return this;
    }

    public Builder autoStartFired(boolean b) {
      this.autoStartFired = b;
      return this;
    }

    public Builder autoAdvanceFired(boolean b) {
      this.autoAdvanceFired = b;
      return this;
    }

    public Builder stateClassName(String name) {
      this.stateClassName = name;
      return this;
    }

    public Builder statistics(RaceStatistics stats) {
      this.statistics = stats;
      return this;
    }

    public Builder demoConfig(DemoConfig config) {
      this.demoConfig = config;
      return this;
    }

    public Race build() {
      return new Race(this);
    }
  }

  public List<RaceParticipant> getDrivers() {
    return drivers;
  }

  public Track getTrack() {
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

  public void setCurrentHeat(Heat h) {
    this.currentHeat = h;
    recordsManager.resetHeatRecords();
    recordsManager.broadcastRecords();
  }

  public IRaceState getState() {
    return state;
  }

  public RaceStatistics getStatistics() {
    return statistics;
  }

  public double getMinLapTime() {
    return model.getMinLapTime();
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

  public void setHasRacedInCurrentHeat(boolean b) {
    this.hasRacedInCurrentHeat = b;
  }

  public boolean isAutoStartFired() {
    return autoStartFired;
  }

  public void setAutoStartFired(boolean b) {
    this.autoStartFired = b;
  }

  public boolean isAutoAdvanceFired() {
    return autoAdvanceFired;
  }

  public void setAutoAdvanceFired(boolean b) {
    this.autoAdvanceFired = b;
  }

  public double getAutoStartRemaining() {
    return autoStartRemaining;
  }

  public void setAutoStartRemaining(double d) {
    this.autoStartRemaining = d;
  }

  public double getAutoAdvanceRemaining() {
    return autoAdvanceRemaining;
  }

  public void setAutoAdvanceRemaining(double d) {
    this.autoAdvanceRemaining = d;
  }

  public void clearAutoTimers() {
    this.autoStartRemaining = 0;
    this.autoAdvanceRemaining = 0;
  }

  public boolean isMainPower() {
    return mainPower;
  }

  public boolean isLanePower(int lane) {
    if (lanePower != null && lane >= 0 && lane < lanePower.length) return lanePower[lane];
    return false;
  }

  public void setMainPower(boolean on) {
    this.mainPower = on;
    if (hardwareManager.getProtocols() != null) {
      hardwareManager.getProtocols().setMainPower(on);
    }
    syncLanePowerWithState(on);
  }

  public com.antigravity.models.Race getRaceModel() { // fqn-collision
    return model;
  }

  public List<CustomRotation> getCustomRotations() {
    return customRotations;
  }

  public DatabaseContext getDatabaseContext() {
    return databaseContext;
  }

  public boolean isDemoMode() {
    return isDemoMode;
  }

  public FuelOptions getFuelOptions() {
    if (track != null && track.hasDigitalFuel()) {
      return model.getDigitalFuelOptions();
    }
    return model.getFuelOptions();
  }

  private void initializeFuelLevels() {
    FuelOptions fuelOptions = getFuelOptions();
    if (fuelOptions != null && fuelOptions.isEnabled()) {
      double initialLevel = (fuelOptions.getCapacity() * fuelOptions.getStartLevel()) / 100.0;
      for (RaceParticipant driver : drivers) {
        driver.setFuelLevel(initialLevel);
      }
    }
  }

  public void initializeHardwareState() {
    this.hardwareManager.initializeHardwareState();
  }

  private List<CustomRotation> resolveCustomRotations(String assetId) {
    if (assetId == null || assetId.isEmpty() || databaseContext == null) return null;
    Document doc =
        databaseContext
            .getDatabase()
            .getCollection("assets")
            .find(Filters.eq("_id", assetId))
            .first();
    if (doc == null) return null;
    List<CustomRotation> result = new ArrayList<>();
    List<Document> rotationList = (List<Document>) doc.get("custom_rotations");
    if (rotationList != null) {
      for (Document rotDoc : rotationList) {
        int numDrivers = rotDoc.getInteger("num_drivers");
        List<CustomHeat> heats = new ArrayList<>();
        List<Document> heatList = (List<Document>) rotDoc.get("heats");
        if (heatList != null) {
          for (Document heatDoc : heatList) {
            Integer group = heatDoc.getInteger("group");
            heats.add(
                new CustomHeat(
                    (List<Integer>) heatDoc.get("driver_indices"), group != null ? group : 0));
          }
        }
        result.add(new CustomRotation(numDrivers, heats));
      }
    }
    return result;
  }

  public boolean isTimeBasedRanking() {
    if (model == null || model.getOverallScoring() == null) return false;
    OverallRanking method = model.getOverallScoring().getRankingMethod();
    return method == OverallRanking.FASTEST_LAP
        || method == OverallRanking.TOTAL_TIME
        || method == OverallRanking.AVERAGE_LAP;
  }

  public void resetHeatRecords() {
    recordsManager.resetHeatRecords();
  }

  public void broadcastTime() {
    RaceTime msg =
        RaceTime.newBuilder()
            .setTime(getRaceTime())
            .setAutoStartRemaining(getAutoStartRemaining())
            .setAutoAdvanceRemaining(getAutoAdvanceRemaining())
            .build();
    broadcast(RaceData.newBuilder().setRaceTime(msg).build());
  }

  public void broadcast(GeneratedMessageV3 message) {
    ClientSubscriptionManager.getInstance().broadcast(message);
  }

  public void syncRaceState() {
    RaceState protoState = getProtoState(state);
    RaceFlag protoFlag = state.getFlagType(this);
    if (hardwareManager.getProtocols() != null) {
      hardwareManager
          .getProtocols()
          .setRaceState(protoState, protoFlag, getAutoStartRemaining() + getAutoAdvanceRemaining());
    }
  }

  public synchronized void changeState(IRaceState newState) {
    if (this.state != null) {
      this.state.exit(this);
    }
    this.state = newState;
    RaceState protoState = getProtoState(state);
    RaceFlag protoFlag = state.getFlagType(this);

    if (currentHeat != null && currentHeat.getDrivers() != null) {
      for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
        DriverHeatData dhd = currentHeat.getDrivers().get(i);
        if (dhd != null) {
          dhd.setFlag(state.getLaneFlagType(this, i));
        }
      }
      broadcast(
          RaceData.newBuilder()
              .setRaceState(protoState)
              .setFlag(protoFlag)
              .setRace(
                  com.antigravity.proto.Race.newBuilder() // fqn-collision
                      .setCurrentHeat(HeatConverter.toProto(currentHeat, new HashSet<>()))
                      .build())
              .build());
    } else {
      broadcast(RaceData.newBuilder().setRaceState(protoState).setFlag(protoFlag).build());
    }

    if (hardwareManager.getProtocols() != null) {
      hardwareManager
          .getProtocols()
          .setRaceState(protoState, protoFlag, getAutoStartRemaining() + getAutoAdvanceRemaining());
    }
    updatePowerForFlag(protoFlag);

    this.state.enter(this);
    if (state instanceof RaceOver) {
      ClientSubscriptionManager.getInstance().deleteAutoSave(model.getEntityId(), isDemoMode());
    }
  }

  public void broadcastFlag(RaceFlag flag) {
    if (currentHeat != null && currentHeat.getDrivers() != null) {
      for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
        DriverHeatData dhd = currentHeat.getDrivers().get(i);
        if (dhd != null) {
          dhd.setFlag(state.getLaneFlagType(this, i));
        }
      }
      broadcast(
          RaceData.newBuilder()
              .setFlag(flag)
              .setRace(
                  com.antigravity.proto.Race.newBuilder() // fqn-collision
                      .setCurrentHeat(HeatConverter.toProto(currentHeat, new HashSet<>()))
                      .build())
              .build());
    } else {
      broadcast(RaceData.newBuilder().setFlag(flag).build());
    }
  }

  public boolean startRace() {
    if (hardwareManager.getProtocols() != null && !hardwareManager.getProtocols().isHealthy())
      return false;
    state.start(this);
    return true;
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

  public void skipRace() {
    if (state instanceof RaceOver) {
      throw new IllegalStateException("Cannot skip race: Race is already over.");
    }
    changeState(new RaceOver());
  }

  public void deferHeat() {
    state.deferHeat(this);
  }

  public void stop() {
    if (hardwareManager.getProtocols() != null) {
      hardwareManager.getProtocols().clearLeds();
      hardwareManager.close();
    }
    if (state != null) state.exit(this);
  }

  public void forceMainPowerSync() {
    hardwareManager.forceMainPowerSync();
  }

  public void setLanePower(boolean on, int lane) {
    if (lane < 0) {
      for (int i = 0; i < track.getLanes().size(); i++) {
        if (lanePower != null && i < lanePower.length) lanePower[i] = on;
        if (hardwareManager.getProtocols() != null)
          hardwareManager.getProtocols().setLanePower(on, i);
      }
    } else {
      if (lanePower != null && lane < lanePower.length) lanePower[lane] = on;
      if (hardwareManager.getProtocols() != null)
        hardwareManager.getProtocols().setLanePower(on, lane);
    }
  }

  public void syncLanePowerWithState(boolean on) {
    if (!on) {
      setLanePower(false, -1);
      return;
    }
    Set<Integer> finishedLanes = executionManager.getFinishedLanes();
    for (int i = 0; i < getTrack().getLanes().size(); i++) {
      boolean hasPenalty =
          currentHeat != null
              && i < currentHeat.getDrivers().size()
              && currentHeat.getDrivers().get(i).getRemainingFalseStartTimePenalty() > 0;
      setLanePower(!finishedLanes.contains(i) && !hasPenalty, i);
    }
  }

  public void updatePowerForFlag(RaceFlag flag) {
    hardwareManager.updatePowerForFlag(flag);
  }

  public void startProtocols() {
    if (hardwareManager.getProtocols() != null) hardwareManager.getProtocols().startTimer();
  }

  public List<PartialTime> stopProtocols() {
    return hardwareManager.getProtocols() != null
        ? hardwareManager.getProtocols().stopTimer()
        : new ArrayList<>();
  }

  public void setHeatStandings(List<Integer> rankings) {
    if (hardwareManager.getProtocols() != null)
      hardwareManager.getProtocols().setHeatStandings(rankings);
  }

  public void setRefueling(int lane, boolean on) {
    if (hardwareManager.getProtocols() != null)
      hardwareManager.getProtocols().setRefueling(lane, on);
  }

  public void setFuelLevel(int lane, int level) {
    if (hardwareManager.getProtocols() != null)
      hardwareManager.getProtocols().setFuelLevel(lane, level);
  }

  public void setHeatProgress(double progress) {
    if (hardwareManager.getProtocols() != null)
      hardwareManager.getProtocols().setHeatProgress(progress);
  }

  public void initializeHeatExecutionState() {
    int laneCount = (track != null && track.getLanes() != null) ? track.getLanes().size() : 0;
    this.executionManager.initialize(laneCount);
  }

  public HeatExecutionManager getHeatExecutionManager() {
    return executionManager;
  }

  public void prepareHeat() {
    this.hasRacedInCurrentHeat = false;
    initializeHeatExecutionState();
    FuelOptions fuelOptions = getFuelOptions();
    if (fuelOptions == null || !fuelOptions.isEnabled()) return;
    boolean resetAtStart = fuelOptions.isResetFuelAtHeatStart();
    double startLevel = (fuelOptions.getCapacity() * fuelOptions.getStartLevel()) / 100.0;
    for (DriverHeatData heatData : currentHeat.getDrivers()) {
      RaceParticipant participant = heatData.getDriver();
      if (participant == null || participant.getDriver() == null) continue;
      if (resetAtStart) participant.setFuelLevel(startLevel);
      heatData.setInitialFuelLevel(participant.getFuelLevel());
    }
    setLanePower(true, -1);
  }

  public void resetCurrentHeat() {
    if (currentHeat != null) {
      statistics.incrementRestartCount();
      for (DriverHeatData driverData : currentHeat.getDrivers()) driverData.reset();
      currentHeat.getHeatStandings().reset();
      currentHeat.setStarted(false);
      resetRaceTime();
      initializeHeatExecutionState();
      for (DriverHeatData heatData : currentHeat.getDrivers())
        heatData.getDriver().setFuelLevel(heatData.getInitialFuelLevel());
      broadcast(
          RaceData.newBuilder()
              .setRace(
                  com.antigravity.proto.Race.newBuilder() // fqn-collision
                      .setCurrentHeat(HeatConverter.toProto(currentHeat, new HashSet<>()))
                      .build())
              .build());
      resetHeatRecords();
      broadcastRecords();
      broadcastTime();
      updateAndBroadcastOverallStandings();
    }
  }

  public void updateAndBroadcastOverallStandings() {
    overallStandings.recalculate(this.drivers, this.heats);
    recordsManager.recalculateScoreRecords();
    List<com.antigravity.proto.RaceParticipant> participants = new ArrayList<>(); // fqn-collision
    for (RaceParticipant driver : this.drivers) {
      if (driver.getDriver() != Driver.EMPTY_DRIVER)
        participants.add(RaceParticipantConverter.toProto(driver, new HashSet<>()));
    }
    RaceData.Builder dataBuilder =
        RaceData.newBuilder()
            .setOverallStandingsUpdate(
                OverallStandingsUpdate.newBuilder().addAllParticipants(participants).build())
            .setRecordData(getRecordData());
    GroupStandingsUpdate groupStandings = buildGroupStandingsUpdate();
    if (groupStandings != null) {
      dataBuilder.setGroupStandingsUpdate(groupStandings);
    }
    broadcast(dataBuilder.build());
  }

  private GroupStandingsUpdate buildGroupStandingsUpdate() {
    if (this.model.getGroupOptions() != null
        && this.model.getGroupOptions().isEnabled()
        && this.currentHeat != null) {
      int currentGroup = this.currentHeat.getGroup();
      Map<String, Integer> driverToGroup = new HashMap<>();
      for (Heat heat : heats) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd.getDriver() != null) {
            driverToGroup.put(dhd.getDriver().getStableId(), heat.getGroup());
          }
        }
      }
      List<com.antigravity.proto.RaceParticipant> groupParticipants = // fqn-collision
          new ArrayList<>();
      int groupRank = 1;
      for (RaceParticipant driver : this.drivers) {
        if (driver.getDriver() != Driver.EMPTY_DRIVER) {
          Integer g = driverToGroup.get(driver.getStableId());
          if (g != null && g == currentGroup) {
            com.antigravity.proto.RaceParticipant.Builder builder = // fqn-collision
                RaceParticipantConverter.toProto(driver, new HashSet<>()).toBuilder();
            builder.setRank(groupRank++);
            groupParticipants.add(builder.build());
          }
        }
      }
      return GroupStandingsUpdate.newBuilder()
          .setGroup(currentGroup)
          .addAllParticipants(groupParticipants)
          .build();
    }
    return null;
  }

  public void updateScoreRecords() {
    recordsManager.updateScoreRecords();
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
    if (state.onLap(lane, lapTime, interfaceId, false)) {
      DriverHeatData dhd = currentHeat.getDrivers().get(lane);
      if (dhd != null) recordsManager.onLap(dhd, dhd.getLastLapTime(), lane);
    }
  }

  public RecordData getRecordData() {
    return recordsManager.getRecordData();
  }

  public RaceRecords getRecordsManager() {
    return recordsManager;
  }

  public RaceHardwareManager getHardwareManager() {
    return hardwareManager;
  }

  public void broadcastRecords() {
    recordsManager.broadcastRecords();
  }

  /** Only for testing! */
  public void injectProtocols(ProtocolDelegate protocols) {
    if (hardwareManager != null) {
      try {
        java.lang.reflect.Field field = RaceHardwareManager.class.getDeclaredField("protocols");
        field.setAccessible(true);
        field.set(hardwareManager, protocols);
      } catch (Exception e) {
        logger.error("Failed to inject protocols", e);
      }
    }
  }

  @Override
  public void onSegment(int lane, double time, int id, int idx) {
    state.onSegment(lane, time, id);
  }

  @Override
  public void onCallbutton(int lane, int idx) {
    state.onCallbutton(this, lane);
    ClientSubscriptionManager.getInstance()
        .broadcastInterfaceEvent(
            InterfaceEvent.newBuilder()
                .setCallbutton(
                    CallbuttonEvent.newBuilder().setLane(lane).setInterfaceIndex(idx).build())
                .build());
  }

  @Override
  public void onInterfaceStatus(InterfaceStatus s, int idx) {
    ClientSubscriptionManager.getInstance()
        .broadcastInterfaceEvent(
            InterfaceEvent.newBuilder()
                .setStatus(
                    InterfaceStatusEvent.newBuilder().setStatus(s).setInterfaceIndex(idx).build())
                .build());
  }

  @Override
  public void onCarData(CarData cd) {
    state.onCarData(cd);
  }

  @Override
  public void onInterfaceEvent(InterfaceEvent e) {
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(e);
  }

  public boolean isLastHeat() {
    return heats.indexOf(currentHeat) == heats.size() - 1;
  }

  public boolean isFirstHeat() {
    return heats != null && !heats.isEmpty() && heats.indexOf(currentHeat) == 0;
  }

  public RaceData createSnapshot() {
    Set<String> sentIds = new HashSet<>();
    RaceData.Builder builder =
        RaceData.newBuilder()
            .setRace(RaceConverter.toProto(this, sentIds))
            .setRaceTime(
                com.antigravity.proto.RaceTime.newBuilder() // fqn-collision
                    .setTime(accumulatedRaceTime)
                    .setAutoStartRemaining(getAutoStartRemaining())
                    .setAutoAdvanceRemaining(getAutoAdvanceRemaining())
                    .build())
            .setRecordData(getRecordData());

    if (state != null) {
      builder.setRaceState(getProtoState(state));
      builder.setFlag(state.getFlagType(this));
    }

    GroupStandingsUpdate groupStandings = buildGroupStandingsUpdate();
    if (groupStandings != null) {
      builder.setGroupStandingsUpdate(groupStandings);
    }

    return builder.build();
  }

  public boolean isActive() {
    return !(state instanceof NotStarted)
        && !(state instanceof HeatOver)
        && !(state instanceof RaceOver);
  }

  public void moveToNextHeat() {
    state.nextHeat(this);
  }

  public void changeLane(int from, int to) {
    if (!state.canChangeLane(this)) {
      return;
    }
    if (from < 0 || to < 0 || from >= track.getLanes().size() || to >= track.getLanes().size()) {
      return;
    }

    // Swap in heat
    DriverHeatData fromDriver = currentHeat.getDrivers().get(from);
    DriverHeatData toDriver = currentHeat.getDrivers().get(to);
    currentHeat.getDrivers().set(from, toDriver);
    currentHeat.getDrivers().set(to, fromDriver);

    // Swap transient state
    executionManager.changeLane(from, to);

    // Re-sync lane power
    syncLanePowerWithState(mainPower);
    broadcast(HeatConverter.toProto(currentHeat, new HashSet<>()));
  }

  public void setRaceState(RaceState protoState, RaceFlag protoFlag, double countdown) {
    if (currentHeat != null && currentHeat.getDrivers() != null) {
      for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
        DriverHeatData dhd = currentHeat.getDrivers().get(i);
        if (dhd != null) {
          dhd.setFlag(state.getLaneFlagType(this, i));
        }
      }
      broadcast(
          RaceData.newBuilder()
              .setRaceState(protoState)
              .setFlag(protoFlag)
              .setRace(
                  com.antigravity.proto.Race.newBuilder() // fqn-collision
                      .setCurrentHeat(HeatConverter.toProto(currentHeat, new HashSet<>()))
                      .build())
              .build());
    } else {
      broadcast(RaceData.newBuilder().setRaceState(protoState).setFlag(protoFlag).build());
    }

    if (hardwareManager.getProtocols() != null) {
      hardwareManager.getProtocols().setRaceState(protoState, protoFlag, countdown);
    }
    updatePowerForFlag(protoFlag);
  }

  public static com.antigravity.proto.RaceState getProtoState(IRaceState state) { // fqn-collision
    if (state instanceof NotStarted)
      return com.antigravity.proto.RaceState.NOT_STARTED; // fqn-collision
    if (state instanceof Starting) return com.antigravity.proto.RaceState.STARTING; // fqn-collision
    if (state instanceof Racing) return com.antigravity.proto.RaceState.RACING; // fqn-collision
    if (state instanceof Paused) return com.antigravity.proto.RaceState.PAUSED; // fqn-collision
    if (state instanceof HeatOver)
      return com.antigravity.proto.RaceState.HEAT_OVER; // fqn-collision
    if (state instanceof RaceOver)
      return com.antigravity.proto.RaceState.RACE_OVER; // fqn-collision
    return com.antigravity.proto.RaceState.UNKNOWN_STATE; // fqn-collision
  }

  public synchronized ModifyHeatsResponse modifyHeats(ModifyHeatsRequest request) {
    return heatManager.modifyHeats(request);
  }

  public synchronized RegenerateHeatsResponse regenerateHeats(RegenerateHeatsRequest request) {
    return heatManager.regenerateHeats(request);
  }

  public void saveGlobalRecords() {
    recordsManager.saveGlobalRecords();
  }
}
