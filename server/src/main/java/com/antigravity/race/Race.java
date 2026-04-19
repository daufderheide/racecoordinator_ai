package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.converters.HeatConverter;
import com.antigravity.converters.RaceConverter;
import com.antigravity.converters.RaceParticipantConverter;
import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.FuelOptions;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.Track;
import com.antigravity.proto.CallbuttonEvent;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.proto.InterfaceStatusEvent;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.OverallStandingsUpdate;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.proto.RaceTime;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.ArduinoProtocol;
import com.antigravity.protocols.demo.Demo;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import com.antigravity.service.DatabaseService;
import com.google.protobuf.GeneratedMessageV3;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Race implements ProtocolListener {
  private static final Logger logger = LoggerFactory.getLogger(Race.class);

  // Data based on the race model configuration
  private final com.antigravity.models.Race model;
  private final Track track;
  private final List<RaceParticipant> drivers;
  private List<Heat> heats;
  private Heat currentHeat;
  private final OverallStandings overallStandings;

  public List<RaceParticipant> getDrivers() {
    return drivers;
  }

  private ProtocolDelegate protocols;
  private boolean isDemoMode;
  private DatabaseContext databaseContext;

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
  private RaceStatistics statistics;

  // Record tracking - Overall (All-time)
  private double overallFastestLap = Double.MAX_VALUE;
  private String overallFastestLapHolder = "";
  private String overallFastestLapHolderNickname = "";
  private String overallFastestLapHolderTeamName = "";
  private long overallFastestLapDate = 0;

  private double overallHighestScore = 0;
  private String overallHighestScoreHolder = "";
  private String overallHighestScoreHolderNickname = "";
  private String overallHighestScoreHolderTeamName = "";
  private long overallHighestScoreDate = 0;

  private List<Double> overallLaneFastestLapTimes = new ArrayList<>();
  private List<String> overallLaneFastestLapHolders = new ArrayList<>();
  private List<String> overallLaneFastestLapHolderNicknames = new ArrayList<>();
  private List<String> overallLaneFastestLapHolderTeamNames = new ArrayList<>();
  private List<Long> overallLaneFastestLapDates = new ArrayList<>();

  private List<Double> overallLaneHighestScores = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolders = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolderNicknames = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolderTeamNames = new ArrayList<>();
  private List<Long> overallLaneHighestScoreDates = new ArrayList<>();

  // Record tracking - Current Race
  private double raceFastestLap = Double.MAX_VALUE;
  private String raceFastestLapHolder = "";
  private String raceFastestLapHolderNickname = "";
  private String raceFastestLapHolderTeamName = "";

  private double raceHighestScore = 0;
  private String raceHighestScoreHolder = "";
  private String raceHighestScoreHolderNickname = "";
  private String raceHighestScoreHolderTeamName = "";

  private List<Double> raceLaneFastestLapTimes = new ArrayList<>();
  private List<String> raceLaneFastestLapHolders = new ArrayList<>();
  private List<String> raceLaneFastestLapHolderNicknames = new ArrayList<>();
  private List<String> raceLaneFastestLapHolderTeamNames = new ArrayList<>();

  private List<Double> raceLaneHighestScores = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolders = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolderNicknames = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolderTeamNames = new ArrayList<>();

  // Record tracking - Current Heat
  private double heatFastestLap = Double.MAX_VALUE;
  private String heatFastestLapHolder = "";
  private String heatFastestLapHolderNickname = "";
  private String heatFastestLapHolderTeamName = "";

  private Race(Builder builder) {
    this.model = builder.model;
    this.track = builder.track;
    this.drivers = builder.drivers;
    this.databaseContext = builder.databaseContext;

    // If not a restored race, ensure drivers are populated correctly and heats are
    // built
    if (builder.heats == null) {
      for (int i = 0; i < this.drivers.size(); i++) {
        this.drivers.get(i).setSeed(i + 1);
      }
      int numLanes = this.track.getLanes().size();
      while (this.drivers.size() < numLanes) {
        this.drivers.add(new RaceParticipant(Driver.EMPTY_DRIVER));
      }
      this.heats = HeatBuilder.buildHeats(this, this.drivers);
      this.currentHeat = this.heats.get(0);
      resetHeatRecords();
    } else {
      this.heats = builder.heats;
      if (builder.currentHeatIndex >= 0 && builder.currentHeatIndex < this.heats.size()) {
        this.currentHeat = this.heats.get(builder.currentHeatIndex);
      } else if (!this.heats.isEmpty()) {
        this.currentHeat = this.heats.get(0);
      }
    }

    this.accumulatedRaceTime = builder.accumulatedRaceTime;
    this.hasRacedInCurrentHeat = builder.hasRacedInCurrentHeat;
    this.autoStartFired = builder.autoStartFired;
    this.autoAdvanceFired = builder.autoAdvanceFired;
    this.autoAdvanceRemaining = 0;
    this.autoStartRemaining = 0;
    this.statistics = builder.statistics != null ? builder.statistics : new RaceStatistics();

    this.overallStandings = new OverallStandings(model.getHeatScoring(), model.getOverallScoring());
    this.createProtocols(builder.isDemoMode);

    this.executionManager = new HeatExecutionManager(this);
    initializeHeatExecutionState();

    if (builder.stateClassName != null) {
      try {
        Class<?> clazz = Class.forName(builder.stateClassName);
        this.state = (IRaceState) clazz.getDeclaredConstructor().newInstance();
      } catch (Exception e) {
        System.err.println(
            "Failed to restore race state: "
                + builder.stateClassName
                + ", falling back to NotStarted");
        this.state = new NotStarted();
      }
    } else {
      this.state = new NotStarted();
    }

    this.state.enter(this);

    if (builder.heats == null) {
      initializeFuelLevels();
    }

    loadGlobalRecords();
    broadcastRecords();

    // Ensure initial ranks are calculated and broadcasted immediately
    updateAndBroadcastOverallStandings();
  }

  private void initializeLaneRecords() {
    int laneCount = this.track.getLanes().size();

    // Overall (All-time)
    this.overallLaneFastestLapTimes = new ArrayList<>(laneCount);
    this.overallLaneFastestLapHolders = new ArrayList<>(laneCount);
    this.overallLaneFastestLapHolderNicknames = new ArrayList<>(laneCount);
    this.overallLaneFastestLapHolderTeamNames = new ArrayList<>(laneCount);
    this.overallLaneFastestLapDates = new ArrayList<>(laneCount);
    this.overallLaneHighestScores = new ArrayList<>(laneCount);
    this.overallLaneHighestScoreHolders = new ArrayList<>(laneCount);
    this.overallLaneHighestScoreHolderNicknames = new ArrayList<>(laneCount);
    this.overallLaneHighestScoreHolderTeamNames = new ArrayList<>(laneCount);
    this.overallLaneHighestScoreDates = new ArrayList<>(laneCount);

    // Current Race
    this.raceLaneFastestLapTimes = new ArrayList<>(laneCount);
    this.raceLaneFastestLapHolders = new ArrayList<>(laneCount);
    this.raceLaneFastestLapHolderNicknames = new ArrayList<>(laneCount);
    this.raceLaneFastestLapHolderTeamNames = new ArrayList<>(laneCount);
    this.raceLaneHighestScores = new ArrayList<>(laneCount);
    this.raceLaneHighestScoreHolders = new ArrayList<>(laneCount);
    this.raceLaneHighestScoreHolderNicknames = new ArrayList<>(laneCount);
    this.raceLaneHighestScoreHolderTeamNames = new ArrayList<>(laneCount);

    for (int i = 0; i < laneCount; i++) {
      this.overallLaneFastestLapTimes.add(Double.MAX_VALUE);
      this.overallLaneFastestLapHolders.add("");
      this.overallLaneFastestLapHolderNicknames.add("");
      this.overallLaneFastestLapHolderTeamNames.add("");
      this.overallLaneFastestLapDates.add(0L);
      this.overallLaneHighestScores.add(0.0);
      this.overallLaneHighestScoreHolders.add("");
      this.overallLaneHighestScoreHolderNicknames.add("");
      this.overallLaneHighestScoreHolderTeamNames.add("");
      this.overallLaneHighestScoreDates.add(0L);

      this.raceLaneFastestLapTimes.add(Double.MAX_VALUE);
      this.raceLaneFastestLapHolders.add("");
      this.raceLaneFastestLapHolderNicknames.add("");
      this.raceLaneFastestLapHolderTeamNames.add("");
      this.raceLaneHighestScores.add(0.0);
      this.raceLaneHighestScoreHolders.add("");
      this.raceLaneHighestScoreHolderNicknames.add("");
      this.raceLaneHighestScoreHolderTeamNames.add("");
    }
  }

  private void loadGlobalRecords() {
    if (databaseContext == null) {
      System.err.println("DatabaseContext is missing - initialization of empty lane records.");
      initializeLaneRecords();
      return;
    }

    try {
      DatabaseService dbService = DatabaseService.getInstance();
      GlobalStatistics stats =
          dbService.getGlobalStatistics(
              databaseContext.getDatabase(), getRaceModel().getEntityId(), isDemoMode());
      if (stats != null) {
        this.overallFastestLap = stats.getFastestLapTime();
        this.overallFastestLapHolder = stats.getFastestLapDriverName();
        this.overallFastestLapHolderNickname = stats.getFastestLapDriverNickname();
        this.overallFastestLapHolderTeamName = stats.getFastestLapTeamName();
        this.overallFastestLapDate = stats.getFastestLapDate();

        this.overallHighestScore = stats.getHighestScore();
        this.overallHighestScoreHolder = stats.getHighestScoreHolderName();
        this.overallHighestScoreHolderNickname = stats.getHighestScoreHolderNickname();
        this.overallHighestScoreHolderTeamName = stats.getHighestScoreTeamName();
        this.overallHighestScoreDate = stats.getHighestScoreDate();

        // Load per-lane records
        initializeLaneRecords();
        int laneCount = this.track.getLanes().size();
        for (int i = 0; i < laneCount; i++) {
          if (stats.getLaneFastestLapTimes() != null && i < stats.getLaneFastestLapTimes().size()) {
            this.overallLaneFastestLapTimes.set(i, stats.getLaneFastestLapTimes().get(i));
          }
          if (stats.getLaneFastestLapDriverNames() != null
              && i < stats.getLaneFastestLapDriverNames().size()) {
            this.overallLaneFastestLapHolders.set(i, stats.getLaneFastestLapDriverNames().get(i));
          }
          if (stats.getLaneFastestLapDriverNicknames() != null
              && i < stats.getLaneFastestLapDriverNicknames().size()) {
            this.overallLaneFastestLapHolderNicknames.set(
                i, stats.getLaneFastestLapDriverNicknames().get(i));
          }
          if (stats.getLaneFastestLapTeamNames() != null
              && i < stats.getLaneFastestLapTeamNames().size()) {
            this.overallLaneFastestLapHolderTeamNames.set(
                i, stats.getLaneFastestLapTeamNames().get(i));
          }
          if (stats.getLaneFastestLapDates() != null && i < stats.getLaneFastestLapDates().size()) {
            this.overallLaneFastestLapDates.set(i, stats.getLaneFastestLapDates().get(i));
          }

          if (stats.getLaneHighestScores() != null && i < stats.getLaneHighestScores().size()) {
            this.overallLaneHighestScores.set(i, stats.getLaneHighestScores().get(i));
          }
          if (stats.getLaneHighestScoreHolderNames() != null
              && i < stats.getLaneHighestScoreHolderNames().size()) {
            this.overallLaneHighestScoreHolders.set(
                i, stats.getLaneHighestScoreHolderNames().get(i));
          }
          if (stats.getLaneHighestScoreHolderNicknames() != null
              && i < stats.getLaneHighestScoreHolderNicknames().size()) {
            this.overallLaneHighestScoreHolderNicknames.set(
                i, stats.getLaneHighestScoreHolderNicknames().get(i));
          }
          if (stats.getLaneHighestScoreTeamNames() != null
              && i < stats.getLaneHighestScoreTeamNames().size()) {
            this.overallLaneHighestScoreHolderTeamNames.set(
                i, stats.getLaneHighestScoreTeamNames().get(i));
          }
          if (stats.getLaneHighestScoreDates() != null
              && i < stats.getLaneHighestScoreDates().size()) {
            this.overallLaneHighestScoreDates.set(i, stats.getLaneHighestScoreDates().get(i));
          }
        }

        logger.info(
            "Global records loaded: fastestLap={}, highestScore={}",
            this.overallFastestLap,
            this.overallHighestScore);
      } else {
        initializeLaneRecords();
        logger.info("No global records found in database.");
      }
    } catch (Exception e) {
      logger.error("Failed to load global statistics", e);
      initializeLaneRecords();
    }
  }

  public static class Builder {
    private com.antigravity.models.Race model;
    private List<RaceParticipant> drivers;
    private Track track;
    private boolean isDemoMode = false;
    private DatabaseContext databaseContext;
    private List<Heat> heats;
    private int currentHeatIndex = 0;
    private float accumulatedRaceTime = 0f;
    private boolean hasRacedInCurrentHeat = false;
    private boolean autoStartFired = false;
    private boolean autoAdvanceFired = false;
    private String stateClassName = null;
    private RaceStatistics statistics;

    public Builder model(com.antigravity.models.Race model) {
      this.model = model;
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

    public Builder databaseContext(DatabaseContext databaseContext) {
      this.databaseContext = databaseContext;
      return this;
    }

    public Builder heats(List<Heat> heats) {
      this.heats = heats;
      return this;
    }

    public Builder currentHeatIndex(int currentHeatIndex) {
      this.currentHeatIndex = currentHeatIndex;
      return this;
    }

    public Builder accumulatedRaceTime(float accumulatedRaceTime) {
      this.accumulatedRaceTime = accumulatedRaceTime;
      return this;
    }

    public Builder hasRacedInCurrentHeat(boolean hasRacedInCurrentHeat) {
      this.hasRacedInCurrentHeat = hasRacedInCurrentHeat;
      return this;
    }

    public Builder autoStartFired(boolean autoStartFired) {
      this.autoStartFired = autoStartFired;
      return this;
    }

    public Builder autoAdvanceFired(boolean autoAdvanceFired) {
      this.autoAdvanceFired = autoAdvanceFired;
      return this;
    }

    public Builder stateClassName(String stateClassName) {
      this.stateClassName = stateClassName;
      return this;
    }

    public Builder statistics(RaceStatistics statistics) {
      this.statistics = statistics;
      return this;
    }

    public Race build() {
      return new Race(this);
    }
  }

  public void init() {
    if (this.protocols != null) {
      this.protocols.open();
    }
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
    if (this.protocols == null) {
      return;
    }

    // 1. Race State and Flag
    this.protocols.setRaceState(
        getProtoState(state), state.getFlagType(this), getAutoStartRemaining());

    // 2. Heat Standings / Heat Leader
    if (this.currentHeat != null && this.currentHeat.getHeatStandings() != null) {
      List<String> standingsIds = currentHeat.getStandings();
      List<DriverHeatData> heatDrivers = currentHeat.getDrivers();
      List<Integer> rankings = new ArrayList<>();
      for (String id : standingsIds) {
        for (int i = 0; i < heatDrivers.size(); i++) {
          DriverHeatData dhd = heatDrivers.get(i);
          if (dhd.getObjectId().equals(id)) {
            // Only add if not an empty driver
            if (dhd.getActualDriver() != null && !dhd.getActualDriver().isEmpty()) {
              rankings.add(i);
            }
            break;
          }
        }
      }
      this.protocols.setHeatStandings(rankings);
    }

    // 3. Fuel Levels
    FuelOptions fuelOptions = getFuelOptions();
    if (fuelOptions != null && fuelOptions.isEnabled() && fuelOptions.getCapacity() > 0) {
      double capacity = fuelOptions.getCapacity();
      for (int i = 0; i < drivers.size(); i++) {
        int currentPct = (int) ((drivers.get(i).getFuelLevel() / capacity) * 100.0);
        this.protocols.setFuelLevel(i, currentPct);
        this.protocols.setRefueling(i, false);
      }
    }

    // 4. Heat Progress
    this.protocols.setHeatProgress(0);
  }

  private void createProtocols(boolean isDemoMode) {
    this.isDemoMode = isDemoMode;
    List<com.antigravity.protocols.IProtocol> protocols_list = new ArrayList<>();
    if (isDemoMode) {
      AnalogFuelOptions fuelOptions = this.model.getFuelOptions();
      boolean isFuelRace = fuelOptions != null && fuelOptions.isEnabled();
      Demo protocol = new Demo(this.track.getLanes().size(), isFuelRace);
      protocol.setInterfaceIndex(0);
      protocols_list.add(protocol);
    } else {
      List<ArduinoConfig> configs = this.track.getArduinoConfigs();
      if (configs != null && !configs.isEmpty()) {
        for (int i = 0; i < configs.size(); i++) {
          ArduinoConfig config = configs.get(i);
          ArduinoProtocol protocol = new ArduinoProtocol(config, this.track.getLanes().size());
          protocol.setInterfaceIndex(i);
          protocols_list.add(protocol);
        }
      } else {
        throw new IllegalArgumentException(
            "Race created in Real Mode, but no ArduinoConfig found for track: "
                + this.track.getName());
      }
    }
    this.protocols = new ProtocolDelegate(protocols_list);
    this.protocols.setListener(this);
  }

  public com.antigravity.models.Race getRaceModel() {
    return model;
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

  public void setCurrentHeat(Heat currentHeat) {
    this.currentHeat = currentHeat;
    resetHeatRecords();
    broadcastRecords();
  }

  public IRaceState getState() {
    return state;
  }

  public RaceStatistics getStatistics() {
    return statistics;
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

  public void resetHeatRecords() {
    this.heatFastestLap = Double.MAX_VALUE;
    this.heatFastestLapHolder = "";
    this.heatFastestLapHolderNickname = "";
  }

  public boolean hasRacedInCurrentHeat() {
    return hasRacedInCurrentHeat;
  }

  public void setHasRacedInCurrentHeat(boolean hasRaced) {
    this.hasRacedInCurrentHeat = hasRaced;
  }

  public void broadcastRaceTime(double autoAdvanceRemaining, double autoStartRemaining) {
    float displayTime = Math.max(0, this.getRaceTime());
    RaceTime raceTimeMsg =
        RaceTime.newBuilder()
            .setTime(displayTime)
            .setAutoAdvanceRemaining(autoAdvanceRemaining)
            .setAutoStartRemaining(autoStartRemaining)
            .build();

    RaceData raceDataMsg = RaceData.newBuilder().setRaceTime(raceTimeMsg).build();

    this.broadcast(raceDataMsg);
  }

  public void broadcastFlag(com.antigravity.proto.RaceFlag flag) {
    RaceData raceDataMsg = RaceData.newBuilder().setFlag(flag).build();
    this.broadcast(raceDataMsg);
    if (protocols != null) {
      protocols.setRaceState(getProtoState(state), flag, 0);
    }
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
    RaceTime raceTimeMsg =
        RaceTime.newBuilder()
            .setTime(this.getRaceTime())
            .setAutoStartRemaining(this.getAutoStartRemaining())
            .setAutoAdvanceRemaining(this.getAutoAdvanceRemaining())
            .build();

    RaceData raceDataMsg = RaceData.newBuilder().setRaceTime(raceTimeMsg).build();

    this.broadcast(raceDataMsg);
  }

  public void broadcast(GeneratedMessageV3 message) {
    ClientSubscriptionManager.getInstance().broadcast(message);
  }

  public synchronized void changeState(IRaceState newState) {
    IRaceState previousState = this.state;
    this.state = newState;

    // Initialize the new state immediately
    this.state.enter(this);

    // Calculate and broadcast the new state and flag for UI responsiveness
    // This happens before the potentially slow exit() of the previous state
    RaceState protoState = getProtoState(state);
    RaceFlag protoFlag = state.getFlagType(this);

    RaceData raceData = RaceData.newBuilder().setRaceState(protoState).setFlag(protoFlag).build();
    broadcast(raceData);

    if (protocols != null) {
      protocols.setRaceState(
          protoState, protoFlag, getAutoStartRemaining() + getAutoAdvanceRemaining());
    }

    if (previousState != null) {
      previousState.exit(this);
    }

    if (state instanceof RaceOver) {
      ClientSubscriptionManager.getInstance().deleteAutoSave(model.getEntityId(), isDemoMode());
    }
  }

  public boolean startRace() {
    if (protocols != null && !protocols.isHealthy()) {
      logger.warn("Cannot start race: Track interface not healthy.");
      return false;
    }
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

  public void deferHeat() {
    state.deferHeat(this);
  }

  public void stop() {
    logger.info(
        "Race.stop() called. Current state: {}",
        state != null ? state.getClass().getSimpleName() : "null");
    if (protocols != null) {
      protocols.clearLeds();
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

  public void setHeatStandings(List<Integer> laneIndices) {
    if (protocols != null) {
      protocols.setHeatStandings(laneIndices);
    }
  }

  public void setRefueling(int laneIndex, boolean isRefueling) {
    if (protocols != null) {
      protocols.setRefueling(laneIndex, isRefueling);
    }
  }

  public void setFuelLevel(int laneIndex, int fuelLevelPct) {
    if (protocols != null) {
      protocols.setFuelLevel(laneIndex, fuelLevelPct);
    }
  }

  public void setHeatProgress(double percentage) {
    if (this.protocols != null) {
      this.protocols.setHeatProgress(percentage);
    }
  }

  public void setRaceState(
      com.antigravity.proto.RaceState state,
      com.antigravity.proto.RaceFlag flag,
      double countdown) {
    if (protocols != null) {
      protocols.setRaceState(state, flag, countdown);
    }
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
    FuelOptions fuelOptions = null;
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

    for (DriverHeatData heatData : currentHeat.getDrivers()) {
      RaceParticipant participant = heatData.getDriver();
      if (participant == null
          || participant.getDriver() == null
          || participant.getDriver().getEntityId() == null) {
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
    FuelOptions fuelOptions = null;
    if (track != null && track.hasDigitalFuel()) {
      fuelOptions = model.getDigitalFuelOptions();
    } else {
      fuelOptions = model.getFuelOptions();
    }

    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      return;
    }

    for (DriverHeatData heatData : currentHeat.getDrivers()) {
      heatData.getDriver().setFuelLevel(heatData.getInitialFuelLevel());
    }
  }

  public void resetCurrentHeat() {
    logger.info("Race.resetCurrentHeat() called.");

    if (currentHeat != null) {
      statistics.incrementRestartCount();
      // Reset all drivers in the heat
      for (DriverHeatData driverData : currentHeat.getDrivers()) {
        driverData.reset();
      }

      // Reset standings to initial order
      currentHeat.getHeatStandings().reset();

      // Reset race time
      resetRaceTime();

      initializeHeatExecutionState();

      restoreHeatFuel();

      // Broadcast update to client
      Set<String> sentObjectIds = new HashSet<>();
      for (RaceParticipant p : getDrivers()) {
        sentObjectIds.add(HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
      }

      com.antigravity.proto.Race raceProto =
          com.antigravity.proto.Race.newBuilder()
              .setCurrentHeat(HeatConverter.toProto(currentHeat, sentObjectIds))
              .build();

      broadcast(RaceData.newBuilder().setRace(raceProto).build());

      // Reset heat records and broadcast them
      resetHeatRecords();
      broadcastRecords();

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
      if (driver.getDriver() != Driver.EMPTY_DRIVER) {
        participants.add(RaceParticipantConverter.toProto(driver, sentObjectIds));
      }
    }

    OverallStandingsUpdate update =
        OverallStandingsUpdate.newBuilder().addAllParticipants(participants).build();

    RaceData raceData = RaceData.newBuilder().setOverallStandingsUpdate(update).build();

    broadcast(raceData);
  }

  public boolean isActive() {
    return !(state instanceof RaceOver);
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {
    try {
      if (state.onLap(lane, lapTime, interfaceId, false)) {
        DriverHeatData dhd = currentHeat.getDrivers().get(lane);
        if (dhd != null) {
          // Update records with the same effective time shown in lane data
          updateRecords(lane, dhd.getLastLapTime());
        }
      }
    } catch (Exception e) {
      System.err.println("Error in onLap for lane " + lane + ": " + e.getMessage());
      e.printStackTrace();
    }
  }

  private void updateRecords(int lane, double lapTime) {
    if (lapTime <= 0) return;

    DriverHeatData dhd = currentHeat.getDrivers().get(lane);
    if (dhd == null) return;

    String driverName = "Driver";
    String driverNickname = "Driver";

    Driver actualDriver = dhd.getActualDriver();
    if (actualDriver == Driver.EMPTY_DRIVER) return;

    if (actualDriver != null) {
      driverName = actualDriver.getName();
      driverNickname = actualDriver.getNickname();
      if (driverNickname == null || driverNickname.isEmpty()) {
        driverNickname = driverName;
      }
    } else if (dhd.getDriver() != null) {
      // Fallback to participant level driver/name
      driverName = dhd.getDriver().getDriver().getName();
      driverNickname = dhd.getDriver().getDriver().getNickname();
      if (driverNickname == null || driverNickname.isEmpty()) {
        driverNickname = driverName;
      }
    }

    String lapHolderName = driverName;
    String lapHolderNickname = driverNickname;
    String countHolderName = driverName;
    String countHolderNickname = driverNickname;
    String teamName = "";

    RaceParticipant participant = dhd.getDriver();
    if (participant.getTeam() != null) {
      teamName = participant.getTeam().getName();
    }

    boolean changed = false;
    long timestamp = System.currentTimeMillis();

    // 1. Heat Records (Current Heat)
    if (lapTime < heatFastestLap) {
      heatFastestLap = lapTime;
      heatFastestLapHolder = lapHolderName;
      heatFastestLapHolderNickname = lapHolderNickname;
      heatFastestLapHolderTeamName = teamName;
      changed = true;
    }

    // 2. Race Records (Current Race Instance)
    if (lapTime < raceFastestLap) {
      raceFastestLap = lapTime;
      raceFastestLapHolder = lapHolderName;
      raceFastestLapHolderNickname = lapHolderNickname;
      raceFastestLapHolderTeamName = teamName;
      changed = true;
    }

    double currentScore = participant.getRankValue();
    if (currentScore > raceHighestScore) {
      raceHighestScore = currentScore;
      raceHighestScoreHolder = countHolderName;
      raceHighestScoreHolderNickname = countHolderNickname;
      raceHighestScoreHolderTeamName = teamName;
      changed = true;
    }

    if (lane >= 0 && lane < raceLaneFastestLapTimes.size()) {
      if (lapTime < raceLaneFastestLapTimes.get(lane)) {
        raceLaneFastestLapTimes.set(lane, lapTime);
        raceLaneFastestLapHolders.set(lane, lapHolderName);
        raceLaneFastestLapHolderNicknames.set(lane, lapHolderNickname);
        raceLaneFastestLapHolderTeamNames.set(lane, teamName);
        changed = true;
      }
      if (currentScore > raceLaneHighestScores.get(lane)) {
        raceLaneHighestScores.set(lane, currentScore);
        raceLaneHighestScoreHolders.set(lane, countHolderName);
        raceLaneHighestScoreHolderNicknames.set(lane, countHolderNickname);
        raceLaneHighestScoreHolderTeamNames.set(lane, teamName);
        changed = true;
      }
    }

    // 3. Overall Records (All-time)
    if (overallFastestLap == 0 || lapTime < overallFastestLap) {
      overallFastestLap = lapTime;
      overallFastestLapHolder = lapHolderName;
      overallFastestLapHolderNickname = lapHolderNickname;
      overallFastestLapHolderTeamName = teamName;
      overallFastestLapDate = timestamp;
      changed = true;
    }

    if (currentScore > overallHighestScore) {
      overallHighestScore = currentScore;
      overallHighestScoreHolder = countHolderName;
      overallHighestScoreHolderNickname = countHolderNickname;
      overallHighestScoreHolderTeamName = teamName;
      overallHighestScoreDate = timestamp;
      changed = true;
    }

    if (lane >= 0 && lane < overallLaneFastestLapTimes.size()) {
      if (lapTime < overallLaneFastestLapTimes.get(lane)) {
        overallLaneFastestLapTimes.set(lane, lapTime);
        overallLaneFastestLapHolders.set(lane, lapHolderName);
        overallLaneFastestLapHolderNicknames.set(lane, lapHolderNickname);
        overallLaneFastestLapHolderTeamNames.set(lane, teamName);
        overallLaneFastestLapDates.set(lane, timestamp);
        changed = true;
      }
      if (currentScore > overallLaneHighestScores.get(lane)) {
        overallLaneHighestScores.set(lane, currentScore);
        overallLaneHighestScoreHolders.set(lane, countHolderName);
        overallLaneHighestScoreHolderNicknames.set(lane, countHolderNickname);
        overallLaneHighestScoreHolderTeamNames.set(lane, teamName);
        overallLaneHighestScoreDates.set(lane, timestamp);
        changed = true;
      }
    }

    if (changed) {
      broadcastRecords();
    }
  }

  public RecordData getRecordData() {
    OverallRecords.Builder overallBuilder =
        OverallRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(overallFastestLap == Double.MAX_VALUE ? 0 : overallFastestLap)
                    .setHolderName(overallFastestLapHolder != null ? overallFastestLapHolder : "")
                    .setHolderNickname(
                        overallFastestLapHolderNickname != null
                            ? overallFastestLapHolderNickname
                            : "")
                    .setHolderTeamName(
                        overallFastestLapHolderTeamName != null
                            ? overallFastestLapHolderTeamName
                            : "")
                    .setDate(overallFastestLapDate)
                    .build())
            .setHighestScore(
                RecordEntry.newBuilder()
                    .setValue(overallHighestScore)
                    .setHolderName(
                        overallHighestScoreHolder != null ? overallHighestScoreHolder : "")
                    .setHolderNickname(
                        overallHighestScoreHolderNickname != null
                            ? overallHighestScoreHolderNickname
                            : "")
                    .setHolderTeamName(
                        overallHighestScoreHolderTeamName != null
                            ? overallHighestScoreHolderTeamName
                            : "")
                    .setDate(overallHighestScoreDate)
                    .build());

    for (int i = 0; i < overallLaneFastestLapTimes.size(); i++) {
      overallBuilder.addLaneFastestLap(
          RecordEntry.newBuilder()
              .setValue(
                  overallLaneFastestLapTimes.get(i) == Double.MAX_VALUE
                      ? 0
                      : overallLaneFastestLapTimes.get(i))
              .setHolderName(overallLaneFastestLapHolders.get(i))
              .setHolderNickname(overallLaneFastestLapHolderNicknames.get(i))
              .setHolderTeamName(overallLaneFastestLapHolderTeamNames.get(i))
              .setDate(overallLaneFastestLapDates.get(i))
              .build());

      overallBuilder.addLaneHighestScore(
          RecordEntry.newBuilder()
              .setValue(overallLaneHighestScores.get(i))
              .setHolderName(overallLaneHighestScoreHolders.get(i))
              .setHolderNickname(overallLaneHighestScoreHolderNicknames.get(i))
              .setHolderTeamName(overallLaneHighestScoreHolderTeamNames.get(i))
              .setDate(overallLaneHighestScoreDates.get(i))
              .build());
    }

    CurrentRecords.Builder currentBuilder =
        CurrentRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(raceFastestLap == Double.MAX_VALUE ? 0 : raceFastestLap)
                    .setHolderName(raceFastestLapHolder != null ? raceFastestLapHolder : "")
                    .setHolderNickname(
                        raceFastestLapHolderNickname != null ? raceFastestLapHolderNickname : "")
                    .setHolderTeamName(
                        raceFastestLapHolderTeamName != null ? raceFastestLapHolderTeamName : "")
                    .build())
            .setHighestScore(
                RecordEntry.newBuilder()
                    .setValue(raceHighestScore)
                    .setHolderName(raceHighestScoreHolder != null ? raceHighestScoreHolder : "")
                    .setHolderNickname(
                        raceHighestScoreHolderNickname != null
                            ? raceHighestScoreHolderNickname
                            : "")
                    .setHolderTeamName(
                        raceHighestScoreHolderTeamName != null
                            ? raceHighestScoreHolderTeamName
                            : "")
                    .build())
            .setHeatFastestLap(
                RecordEntry.newBuilder()
                    .setValue(heatFastestLap == Double.MAX_VALUE ? 0 : heatFastestLap)
                    .setHolderName(heatFastestLapHolder != null ? heatFastestLapHolder : "")
                    .setHolderNickname(
                        heatFastestLapHolderNickname != null ? heatFastestLapHolderNickname : "")
                    .setHolderTeamName(
                        heatFastestLapHolderTeamName != null ? heatFastestLapHolderTeamName : "")
                    .build());

    for (int i = 0; i < raceLaneFastestLapTimes.size(); i++) {
      currentBuilder.addLaneFastestLap(
          RecordEntry.newBuilder()
              .setValue(
                  raceLaneFastestLapTimes.get(i) == Double.MAX_VALUE
                      ? 0
                      : raceLaneFastestLapTimes.get(i))
              .setHolderName(raceLaneFastestLapHolders.get(i))
              .setHolderNickname(raceLaneFastestLapHolderNicknames.get(i))
              .setHolderTeamName(raceLaneFastestLapHolderTeamNames.get(i))
              .build());

      currentBuilder.addLaneHighestScore(
          RecordEntry.newBuilder()
              .setValue(raceLaneHighestScores.get(i))
              .setHolderName(raceLaneHighestScoreHolders.get(i))
              .setHolderNickname(raceLaneHighestScoreHolderNicknames.get(i))
              .setHolderTeamName(raceLaneHighestScoreHolderTeamNames.get(i))
              .build());
    }

    return RecordData.newBuilder()
        .setOverall(overallBuilder.build())
        .setCurrent(currentBuilder.build())
        .build();
  }

  public void broadcastRecords() {
    RecordData recordData = getRecordData();
    broadcast(RaceData.newBuilder().setRecordData(recordData).build());
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {
    state.onSegment(lane, segmentTime, interfaceId);
  }

  @Override
  public void onCallbutton(int lane, int interfaceIndex) {
    state.onCallbutton(this, lane);
    // Broadcast as InterfaceEvent for UI feedback in Editor
    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setCallbutton(
                CallbuttonEvent.newBuilder()
                    .setLane(lane)
                    .setInterfaceIndex(interfaceIndex)
                    .build())
            .build();
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  @Override
  public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
    InterfaceEvent event =
        InterfaceEvent.newBuilder()
            .setStatus(
                InterfaceStatusEvent.newBuilder()
                    .setStatus(status)
                    .setInterfaceIndex(interfaceIndex)
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
  public void onInterfaceEvent(InterfaceEvent event) {
    ClientSubscriptionManager.getInstance().broadcastInterfaceEvent(event);
  }

  public boolean isLastHeat() {
    return heats.indexOf(currentHeat) == heats.size() - 1;
  }

  // TODO(aufderheide): This synchronize probably isn't enough. We need to lock
  // the race object while we're creating the snapshot.
  public synchronized RaceData createSnapshot() {
    Set<String> sentObjectIds = new HashSet<>();
    com.antigravity.proto.Race raceUpdate = RaceConverter.toProto(this, sentObjectIds);

    // Update state and flag correctly from current state
    raceUpdate =
        raceUpdate.toBuilder()
            .setState(getProtoState(state))
            .setFlag(state.getFlagType(this))
            .build();

    RecordData recordData = getRecordData();
    System.out.println(
        "Snapshot created with records: overallFastestLap="
            + recordData.getOverall().getFastestLap().getValue()
            + " ("
            + recordData.getOverall().getFastestLap().getHolderNickname()
            + ")");

    return RaceData.newBuilder().setRace(raceUpdate).setRecordData(recordData).build();
  }

  public void moveToNextHeat() {
    this.autoStartFired = false;
    this.autoAdvanceFired = false;
    this.autoStartRemaining = 0;
    this.autoAdvanceRemaining = 0;
    state.nextHeat(this);
  }

  public List<Double> getOverallLaneFastestLapTimes() {
    return overallLaneFastestLapTimes;
  }

  public List<String> getOverallLaneFastestLapHolders() {
    return overallLaneFastestLapHolders;
  }

  public List<String> getOverallLaneFastestLapHolderNicknames() {
    return overallLaneFastestLapHolderNicknames;
  }

  public List<Long> getOverallLaneFastestLapDates() {
    return overallLaneFastestLapDates;
  }

  public List<Double> getOverallLaneHighestScores() {
    return overallLaneHighestScores;
  }

  public List<String> getOverallLaneHighestScoreHolders() {
    return overallLaneHighestScoreHolders;
  }

  public List<String> getOverallLaneHighestScoreHolderNicknames() {
    return overallLaneHighestScoreHolderNicknames;
  }

  public List<Long> getOverallLaneHighestScoreDates() {
    return overallLaneHighestScoreDates;
  }

  public double getOverallFastestLap() {
    return overallFastestLap;
  }

  public String getOverallFastestLapHolder() {
    return overallFastestLapHolder;
  }

  public String getOverallFastestLapHolderNickname() {
    return overallFastestLapHolderNickname;
  }

  public String getOverallFastestLapHolderTeamName() {
    return overallFastestLapHolderTeamName;
  }

  public long getOverallFastestLapDate() {
    return overallFastestLapDate;
  }

  public double getOverallHighestScoreValue() {
    return overallHighestScore;
  }

  public String getOverallHighestScoreHolder() {
    return overallHighestScoreHolder;
  }

  public String getOverallHighestScoreHolderNickname() {
    return overallHighestScoreHolderNickname;
  }

  public String getOverallHighestScoreHolderTeamName() {
    return overallHighestScoreHolderTeamName;
  }

  public long getOverallHighestScoreDate() {
    return overallHighestScoreDate;
  }

  public List<String> getOverallLaneFastestLapHolderTeamNames() {
    return overallLaneFastestLapHolderTeamNames;
  }

  public List<String> getOverallLaneHighestScoreHolderTeamNames() {
    return overallLaneHighestScoreHolderTeamNames;
  }

  private RaceState getProtoState(IRaceState state) {
    // TODO(aufderheide): We should ask the state for it's enum value rather than
    // doing all these instanceof checks.
    if (state instanceof NotStarted) {
      return RaceState.NOT_STARTED;
    } else if (state instanceof Starting) {
      return RaceState.STARTING;
    } else if (state instanceof Racing) {
      return RaceState.RACING;
    } else if (state instanceof Paused) {
      return RaceState.PAUSED;
    } else if (state instanceof HeatOver) {
      return RaceState.HEAT_OVER;
    } else if (state instanceof RaceOver) {
      return RaceState.RACE_OVER;
    }
    return RaceState.UNKNOWN_STATE;
  }
}
