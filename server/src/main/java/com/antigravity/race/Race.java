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
import com.antigravity.models.RaceConfigDump;
import com.antigravity.models.Theme;
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
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.google.protobuf.GeneratedMessageV3;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("checkstyle:FileLength")
public class Race implements ProtocolListener {
  private static final Logger logger = LoggerFactory.getLogger(Race.class);

  private final com.antigravity.models.Race model; // fqn-collision
  private final Track track;
  private Theme theme;
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
  private String seasonEntityId;

  private IRaceState state;
  private float accumulatedRaceTime = 0.0f;
  private boolean hasRacedInCurrentHeat = false;
  private boolean autoStartFired = false;
  private boolean autoAdvanceFired = false;
  private double autoStartRemaining = 0;
  private double autoAdvanceRemaining = 0;
  private boolean mainPower = false;
  private boolean[] lanePower;
  private volatile boolean stopped = false;

  private HeatExecutionManager executionManager;
  private RaceStatistics statistics;

  public boolean isStopped() {
    return stopped;
  }

  private Race(Builder builder) {
    this.model = builder.model;
    this.track = builder.track;
    if (builder.theme != null) {
      this.theme = builder.theme;
    } else if (builder.databaseContext != null) {
      this.theme = loadDefaultTheme(builder.databaseContext);
    } else {
      this.theme = null;
    }
    this.seasonEntityId = builder.seasonEntityId;
    this.drivers = builder.drivers != null ? new ArrayList<>(builder.drivers) : new ArrayList<>();
    this.databaseContext = builder.databaseContext;
    this.customRotations =
        builder.customRotations != null
            ? new ArrayList<>(builder.customRotations)
            : new ArrayList<>();

    this.recordsManager = new RaceRecords(this);
    loadExistingRecords(builder.isDemoMode, builder.existingRecords);

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
      linkDriverReferences();

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
            model.getHeatScoring(),
            model.getOverallScoring(),
            model.getGroupOptions(),
            model.isPractice());
    this.demoConfig = builder.demoConfig;
    this.hardwareManager.createProtocols(builder.isDemoMode, builder.demoConfig);
    this.isDemoMode = builder.isDemoMode;

    this.executionManager = new HeatExecutionManager(this);
    initializeHeatExecutionState();

    this.state = restoreState(builder.stateClassName);

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

  private void loadExistingRecords(boolean isDemoMode, RecordData injectedRecords) {
    if (injectedRecords != null) {
      if (injectedRecords.hasOverall()) {
        this.recordsManager.loadOverallRaceRecords(injectedRecords.getOverall());
      }
      return;
    }
    if (this.databaseContext != null && this.model != null && this.model.getEntityId() != null) {
      DatabaseService dbService = DatabaseService.getInstance();
      if (dbService != null) {
        RecordData existingRecords =
            dbService.getRaceRecords(this.databaseContext, this.model.getEntityId(), isDemoMode);
        if (existingRecords != null) {
          // Only load Overall records — Current session always starts fresh.
          // Loading stale current records from a previous session causes the UI to show
          // old per-session records before any laps have been run.
          if (existingRecords.hasOverall()) {
            this.recordsManager.loadOverallRaceRecords(existingRecords.getOverall());
          }
        }
      }
    }
  }

  private void linkDriverReferences() {
    // Link the DriverHeatData's driver references to the master driver list in
    // this.drivers.
    // This is crucial because JSON/SQLite deserialization creates separate instances,
    // causing overall
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
  }

  private IRaceState restoreState(String stateClassName) {
    if (stateClassName != null) {
      try {
        Class<?> clazz = Class.forName(stateClassName);
        return (IRaceState) clazz.getDeclaredConstructor().newInstance();
      } catch (Exception e) {
        logger.error("Failed to restore race state", e);
      }
    }
    return new NotStarted();
  }

  private Theme loadDefaultTheme(DatabaseContext dbCtx) {
    try {
      SqliteRepository<Theme> repo = new SqliteRepository<>(dbCtx, "themes", Theme.class);
      for (Theme t : repo.findAll()) {
        if (t.isDefault()) {
          return t;
        }
      }
    } catch (Exception e) {
      logger.warn("Could not load default theme from database: {}", e.getMessage());
    }
    return null;
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
    private RecordData existingRecords;
    private String seasonEntityId;
    private Theme theme;

    public Builder theme(Theme theme) {
      this.theme = theme;
      return this;
    }

    public Builder seasonEntityId(String seasonEntityId) {
      this.seasonEntityId = seasonEntityId;
      return this;
    }

    public Builder model(com.antigravity.models.Race model) { // fqn-collision
      this.model = model;
      if (model != null && model.getCustomRotations() != null) {
        this.customRotations = model.getCustomRotations();
      }
      return this;
    }

    public Builder existingRecords(RecordData existingRecords) {
      this.existingRecords = existingRecords;
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

  public Theme getTheme() {
    return theme;
  }

  public synchronized void setTheme(Theme theme) {
    this.theme = theme;
    syncRaceState();
  }

  public List<RaceParticipant> getDrivers() {
    return drivers;
  }

  public String getSeasonEntityId() {
    return seasonEntityId;
  }

  public void setSeasonEntityId(String seasonEntityId) {
    this.seasonEntityId = seasonEntityId;
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
    updateAndBroadcastOverallStandings();
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
    EventExecutionManager eventMgr = EventExecutionManager.getInstance();
    if (eventMgr.isEventActive() && eventMgr.getAutoAdvanceRemainingSeconds() > 0) {
      return eventMgr.getAutoAdvanceRemainingSeconds();
    }
    return autoAdvanceRemaining;
  }

  public void setAutoAdvanceRemaining(double d) {
    this.autoAdvanceRemaining = d;
  }

  public void clearAutoTimers() {
    this.autoStartRemaining = 0;
    this.autoAdvanceRemaining = 0;
    EventExecutionManager.getInstance().cancelAutoAdvanceTimer();
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
      for (int i = 0; i < drivers.size(); i++) {
        RaceParticipant driver = drivers.get(i);
        driver.setFuelLevel(initialLevel);
        setFuelLevel(i, initialLevel, fuelOptions.getCapacity());
      }
    }
  }

  public void initializeHardwareState() {
    this.hardwareManager.initializeHardwareState();
  }

  private List<CustomRotation> resolveCustomRotations(String assetId) {
    if (assetId == null || assetId.isEmpty() || databaseContext == null) return null;
    AssetService assetService =
        new AssetService(
            databaseContext,
            databaseContext.getDataRoot() + databaseContext.getCurrentDatabaseName() + "/assets");
    com.antigravity.proto.AssetMessage asset = assetService.getAssetById(assetId); // fqn-collision
    if (asset == null || asset.getCustomRotationsCount() == 0) return null;
    List<CustomRotation> result = new ArrayList<>();
    for (com.antigravity.proto.CustomRotation protoRot : // fqn-collision
        asset.getCustomRotationsList()) { // fqn-collision
      List<CustomHeat> heats = new ArrayList<>();
      for (com.antigravity.proto.CustomHeat protoHeat : protoRot.getHeatsList()) { // fqn-collision
        heats.add(
            new CustomHeat(
                new ArrayList<>(protoHeat.getDriverIndicesList()), protoHeat.getGroup()));
      }
      result.add(new CustomRotation(protoRot.getNumDrivers(), heats));
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
    if (this.stopped) {
      return;
    }
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

    if (hardwareManager != null && hardwareManager.getProtocols() != null) {
      hardwareManager
          .getProtocols()
          .setRaceState(
              getProtoState(state), flag, getAutoStartRemaining() + getAutoAdvanceRemaining());
    }
    updatePowerForFlag(flag);
  }

  public boolean startRace() {
    if (this.stopped) {
      return false;
    }
    if (hardwareManager.getProtocols() != null && !hardwareManager.getProtocols().isHealthy()) {
      logger.warn("startRace: protocol reports unhealthy not starting.");
      return false;
    }
    state.start(this);
    return true;
  }

  public void pauseRace() {
    if (this.stopped) {
      return;
    }
    state.pause(this);
  }

  public void restartHeat() {
    if (this.stopped) {
      return;
    }
    state.restartHeat(this);
  }

  public void skipHeat() {
    if (this.stopped) {
      return;
    }
    state.skipHeat(this);
  }

  public void skipRace() {
    if (this.stopped) {
      return;
    }
    if (state instanceof RaceOver) {
      throw new IllegalStateException("Cannot skip race: Race is already over.");
    }
    changeState(new RaceOver());
  }

  public void deferHeat() {
    if (this.stopped) {
      return;
    }
    state.deferHeat(this);
  }

  public synchronized void stop() {
    this.stopped = true;
    if (state != null) {
      state.exit(this);
    }
    if (hardwareManager.getProtocols() != null) {
      hardwareManager.getProtocols().clearLeds();
      hardwareManager.close();
    }
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
    if (state != null && state.getFlagType(this) == RaceFlag.GREEN_YELLOW) {
      setLanePower(true, -1);
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

  public void setFuelLevel(int lane, double fuelLevel, double capacity) {
    if (hardwareManager.getProtocols() != null)
      hardwareManager.getProtocols().setFuelLevel(lane, fuelLevel, capacity);
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

  public boolean isFirstHeatForDriver(String stableId, Heat currentHeat) {
    if (heats == null || heats.isEmpty()) return true;
    for (Heat heat : heats) {
      if (heat == currentHeat) {
        break;
      }
      if (heat.isStarted()) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd != null
              && dhd.getDriver() != null
              && dhd.getDriver().getStableId() != null
              && dhd.getDriver().getStableId().equals(stableId)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  public Heat getLastHeatForDriver(String stableId, Heat currentHeat) {
    if (heats == null || heats.isEmpty()) return null;
    Heat lastFound = null;
    for (Heat heat : heats) {
      if (heat == currentHeat) {
        break;
      }
      if (heat.isStarted()) {
        for (DriverHeatData dhd : heat.getDrivers()) {
          if (dhd != null
              && dhd.getDriver() != null
              && dhd.getDriver().getStableId() != null
              && dhd.getDriver().getStableId().equals(stableId)) {
            lastFound = heat;
            break;
          }
        }
      }
    }
    return lastFound;
  }

  public void prepareHeat() {
    this.hasRacedInCurrentHeat = false;
    initializeHeatExecutionState();
    FuelOptions fuelOptions = getFuelOptions();
    if (fuelOptions == null || !fuelOptions.isEnabled()) return;
    boolean resetAtStart = fuelOptions.isResetFuelAtHeatStart();
    double startLevel = (fuelOptions.getCapacity() * fuelOptions.getStartLevel()) / 100.0;
    for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
      DriverHeatData heatData = currentHeat.getDrivers().get(i);
      RaceParticipant participant = heatData.getDriver();
      if (participant == null || participant.getDriver() == null) continue;
      if (resetAtStart) {
        participant.setFuelLevel(startLevel);
        setFuelLevel(i, startLevel, fuelOptions.getCapacity());
      }
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
      FuelOptions fuelOptions = getFuelOptions();
      double capacity =
          (fuelOptions != null && fuelOptions.isEnabled()) ? fuelOptions.getCapacity() : 0.0;
      for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
        DriverHeatData heatData = currentHeat.getDrivers().get(i);
        double fuelLevel = heatData.getInitialFuelLevel();
        heatData.getDriver().setFuelLevel(fuelLevel);
        setFuelLevel(i, fuelLevel, capacity);
      }
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

  public void restartHeatForFalseStart() {
    if (currentHeat != null) {
      statistics.incrementRestartCount();
      for (DriverHeatData driverData : currentHeat.getDrivers()) {
        driverData.resetForFalseStart();
      }
      currentHeat.getHeatStandings().reset();
      currentHeat.setStarted(false);
      resetRaceTime();
      initializeHeatExecutionState();
      FuelOptions fuelOptions = getFuelOptions();
      double capacity =
          (fuelOptions != null && fuelOptions.isEnabled()) ? fuelOptions.getCapacity() : 0.0;
      for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
        DriverHeatData heatData = currentHeat.getDrivers().get(i);
        double fuelLevel = heatData.getInitialFuelLevel();
        heatData.getDriver().setFuelLevel(fuelLevel);
        setFuelLevel(i, fuelLevel, capacity);
      }
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
      changeState(new NotStarted());
    }
  }

  public void updateAndBroadcastOverallStandings() {
    overallStandings.recalculate(
        this.drivers,
        this.heats,
        this.getRaceModel() != null ? this.getRaceModel().getHeatRotationType() : null);
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
    if (seasonEntityId != null && !seasonEntityId.isEmpty()) {
      dataBuilder.setRace(RaceConverter.toProto(this));
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

  public void resetRecords() {
    recordsManager.resetAllRecords();
    recordsManager.broadcastRecords();
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
    if (state.onLap(lane, lapTime, interfaceId, false)) {
      DriverHeatData dhd = currentHeat.getDrivers().get(lane);
      if (dhd != null) {
        boolean countTowardsRecords = true;
        if (!dhd.getLaps().isEmpty()) {
          countTowardsRecords = dhd.getLaps().get(dhd.getLaps().size() - 1).isCountTowardsRecords();
        }
        if (countTowardsRecords) {
          recordsManager.onLap(dhd, dhd.getLastLapTime(), lane);
        }
      }
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
      hardwareManager.setProtocols(protocols);
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
    if (this.stopped) {
      return;
    }
    ClientSubscriptionManager.getInstance()
        .broadcastInterfaceEvent(
            InterfaceEvent.newBuilder()
                .setStatus(
                    InterfaceStatusEvent.newBuilder().setStatus(s).setInterfaceIndex(idx).build())
                .build());

    if (s == InterfaceStatus.DISCONNECTED) {
      stopRaceOperationsOnHardwareDisconnect();
    }
  }

  @Override
  public void onCarData(CarData cd) {
    if (this.stopped) {
      return;
    }
    state.onCarData(cd);
  }

  @Override
  public void onInterfaceEvent(InterfaceEvent e) {
    if (this.stopped) {
      return;
    }
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(e);
    if (e.hasStatus() && e.getStatus().getStatus() == InterfaceStatus.DISCONNECTED) {
      stopRaceOperationsOnHardwareDisconnect();
    }
  }

  public synchronized void stopRaceOperationsOnHardwareDisconnect() {
    if (this.stopped) {
      return;
    }
    logger.warn("Track interface disconnected. Stopping all race operations until manual action.");

    EventExecutionManager.getInstance().cancelAutoAdvanceTimer();

    if (state instanceof Racing || state instanceof Starting) {
      pauseRace();
    } else if (state instanceof NotStarted) {
      state.pause(this);
    } else if (state instanceof HeatOver) {
      state.pause(this);
    } else if (state instanceof Paused) {
      clearAutoTimers();
    } else if (state instanceof RaceOver) {
      clearAutoTimers();
    }
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

  public void dumpConfiguration() {
    if (logger.isTraceEnabled()) {
      try {
        RaceConfigDump dump = new RaceConfigDump();
        dump.setRace(model);
        dump.setTrack(track);
        dump.setDrivers(drivers);
        dump.setCustomRotations(customRotations);
        if (databaseContext != null && model != null && model.getEntityId() != null) {
          DatabaseService dbService = DatabaseService.getInstance();
          if (dbService != null) {
            RecordData existingRecords =
                dbService.getRaceRecords(
                    this.databaseContext, this.model.getEntityId(), isDemoMode);
            if (existingRecords != null) {
              dump.setRecordDataBase64(
                  java.util.Base64.getEncoder().encodeToString(existingRecords.toByteArray()));
            }
          }
        }
        com.fasterxml.jackson.databind.ObjectMapper mapper =
            new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.configure(
            com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        String json = mapper.writeValueAsString(dump);
        logger.trace("RaceConfigDump: {}", json);
      } catch (Exception e) {
        logger.error("Failed to dump race configuration for log replay", e);
      }
    }
  }
}
