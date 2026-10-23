package com.antigravity.race.states;

import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.PartialTime;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Racing implements IRaceState {

  private static final Logger logger = LoggerFactory.getLogger(Racing.class);

  private ScheduledExecutorService scheduler;
  private ScheduledFuture<?> timerHandle;

  private Race race;
  private HeatExecutionManager executionManager;
  private boolean[] previousRefuelingState;
  private int[] previousFuelLevels;
  private double previousHeatProgress = -1.0;
  private RaceFlag previousFlag = RaceFlag.UNKNOWN_FLAG;

  @Override
  public RaceFlag getFlagType(Race race) {
    if (race == null || race.getRaceModel() == null) return RaceFlag.GREEN;

    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring == null) return RaceFlag.GREEN;

    if (race.getCurrentHeat() == null) return RaceFlag.GREEN;
    List<DriverHeatData> heatDrivers = race.getCurrentHeat().getDrivers();
    if (heatDrivers == null) return RaceFlag.GREEN;

    // Checkered flag if any driver has finished (and race allows finishing)
    if (scoring.getAllowFinish() != null
        && scoring.getAllowFinish() != AllowFinish.None
        && scoring.getAllowFinish() != AllowFinish.NoneAutoSegments) {
      // For timed races, show checkered flag immediately when counter reaches 0
      if (scoring.getFinishMethod() == FinishMethod.Timed && race.getRaceTime() <= 0) {
        return race.getTheme() != null
            ? race.getTheme()
                .resolveFlag("flag.heat_finishing", RaceFlag.CHECKERED, race.getDatabaseContext())
            : RaceFlag.CHECKERED;
      }
      // For lap-based races, show checkered when any driver finishes
      for (int i = 0; i < heatDrivers.size(); i++) {
        DriverHeatData hd = heatDrivers.get(i);
        if (isDriverFinished(race, i, hd)) {
          return race.getTheme() != null
              ? race.getTheme()
                  .resolveFlag("flag.heat_finishing", RaceFlag.CHECKERED, race.getDatabaseContext())
              : RaceFlag.CHECKERED;
        }
      }
    }

    // White flag (1 lap to go) - only for Lap based races
    if (scoring.getFinishMethod() == FinishMethod.Lap) {
      long lapsToFinish = scoring.getFinishValue();
      boolean anyDriverOneLapToGo = false;
      for (DriverHeatData hd : heatDrivers) {
        if (hd.getLapCount() == lapsToFinish - 1) {
          anyDriverOneLapToGo = true;
          break;
        }
      }
      if (anyDriverOneLapToGo) {
        return race.getTheme() != null
            ? race.getTheme()
                .resolveFlag("flag.one_lap_to_go", RaceFlag.WHITE, race.getDatabaseContext())
            : RaceFlag.WHITE;
      }
    }

    return race.getTheme() != null
        ? race.getTheme().resolveFlag("flag.racing", RaceFlag.GREEN, race.getDatabaseContext())
        : RaceFlag.GREEN;
  }

  @Override
  public void enter(Race race) {
    this.race = race;
    this.previousHeatProgress = -1.0;
    this.executionManager = race.getHeatExecutionManager();

    initializeTimedRaceTime(race);

    RaceFlag initialFlag = getFlagType(race);
    race.broadcastFlag(initialFlag);
    syncDriverFlags(race);
    this.previousFlag = initialFlag;

    initializeHeatStartTimeAndBroadcast(race);

    race.setHasRacedInCurrentHeat(true);
    race.clearAutoTimers();

    initializeFuelTracking(race);

    logger.info("Racing: Digital fuel enabled: {}", executionManager.isDigitalFuelEnabled());
    logger.info("Racing: Analog fuel enabled: {}", executionManager.isAnalogFuelEnabled());

    race.startProtocols();
    initializeFalseStartTimePenalties();
    startScheduler();
  }

  private void initializeTimedRaceTime(Race race) {
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring != null && scoring.getFinishMethod() == FinishMethod.Timed) {
      if (!race.hasRacedInCurrentHeat() && race.getRaceTime() == 0) {
        race.addRaceTime((float) scoring.getFinishValue());
      }
    }
  }

  private void initializeHeatStartTimeAndBroadcast(Race race) {
    if (race.getStatistics().getStartTime() == null) {
      race.getStatistics().setStartTime(OffsetDateTime.now().toString());
      race.getStatistics().setStartMillis(System.currentTimeMillis());
    }
    if (race.getCurrentHeat() != null) {
      if (race.getCurrentHeat().getStatistics().getStartTime() == null) {
        race.getCurrentHeat().getStatistics().setStartTime(OffsetDateTime.now().toString());
        race.getCurrentHeat().getStatistics().setStartMillis(System.currentTimeMillis());
      }
      race.getCurrentHeat().setStarted(true);
      race.broadcast(
          RaceData.newBuilder()
              .setHeat(
                  com.antigravity.converters.HeatConverter.toProto( // fqn-collision
                      race.getCurrentHeat(), new java.util.HashSet<>()))
              .build());
      race.broadcastFuelLevels();
    }
  }

  private void initializeFuelTracking(Race race) {
    if (race.getTrack() != null && race.getTrack().getLanes() != null) {
      int laneCount = race.getTrack().getLanes().size();
      previousRefuelingState = new boolean[laneCount];
      previousFuelLevels = new int[laneCount];
      for (int i = 0; i < laneCount; i++) {
        previousFuelLevels[i] = -1;
      }
    }
  }

  private void startScheduler() {
    if (scheduler != null) {
      scheduler.shutdown();
    }
    scheduler =
        Executors.newSingleThreadScheduledExecutor(
            r -> {
              Thread t = new Thread(r, "RacingTicker");
              t.setDaemon(true);
              return t;
            });
    timerHandle = scheduler.scheduleAtFixedRate(createTicker(), 0, 100, TimeUnit.MILLISECONDS);
  }

  private Runnable createTicker() {
    return new Runnable() {
      long lastTime = 0;

      @Override
      public void run() {
        try {
          long now = System.nanoTime();
          if (lastTime == 0) {
            lastTime = now;
            return;
          }

          long intervalNs = now - lastTime;
          if (intervalNs > 200_000_000L) {
            logger.warn(
                "[PERF] Racing ticker delayed by {} ms", (intervalNs - 100_000_000L) / 1_000_000L);
          }

          float delta = (now - lastTime) / 1_000_000_000.0f;
          lastTime = now;

          executeTick(now, delta);
        } catch (Exception e) {
          logger.error("Error in Racing timer", e);
        }
      }
    };
  }

  private void executeTick(long now, float delta) {
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    long limit = scoring != null ? scoring.getFinishValue() : 0;
    boolean isTimed = scoring != null && scoring.getFinishMethod() == FinishMethod.Timed;
    boolean isInfiniteTimed = isTimed && limit <= 0;

    updateRaceTime(delta, isTimed, isInfiniteTimed);
    processFalseStartTimePenalties(delta);
    executionManager.processTicker(delta);
    syncRefuelingState();
    syncFuelLevels();

    AllowFinish allowFinish = scoring != null ? scoring.getAllowFinish() : AllowFinish.None;
    boolean allFinished =
        checkFinishConditions(scoring, isTimed, isInfiniteTimed, allowFinish, limit);

    updateHeatProgress(scoring, isInfiniteTimed);
    updateFlagAndBroadcast();

    long tickDurationNs = System.nanoTime() - now;
    if (tickDurationNs > 50_000_000L && !allFinished) {
      logger.warn("[PERF] Racing ticker execution took {} ms", tickDurationNs / 1_000_000L);
    }

    if (allFinished) {
      handleHeatFinish(allowFinish);
    }
  }

  private void updateRaceTime(float delta, boolean isTimed, boolean isInfiniteTimed) {
    if (isTimed && !isInfiniteTimed) {
      race.addRaceTime(-delta);
    } else {
      race.addRaceTime(delta);
    }
  }

  private void syncRefuelingState() {
    boolean[] currentRefuelingState = executionManager.getIsRefueling();
    if (currentRefuelingState != null && previousRefuelingState != null) {
      for (int i = 0;
          i < Math.min(currentRefuelingState.length, previousRefuelingState.length);
          i++) {
        if (currentRefuelingState[i] != previousRefuelingState[i]) {
          race.setRefueling(i, currentRefuelingState[i]);
          previousRefuelingState[i] = currentRefuelingState[i];
        }
      }
    }
  }

  private boolean checkFinishConditions(
      HeatScoring scoring,
      boolean isTimed,
      boolean isInfiniteTimed,
      AllowFinish allowFinish,
      long limit) {
    if (scoring == null) {
      return false;
    }
    Set<Integer> finishedLanes = executionManager.getFinishedLanes();
    if (isTimed) {
      if (!isInfiniteTimed && race.getRaceTime() <= 0) {
        if (allowFinish == AllowFinish.SingleLapAutoSegments) {
          executionManager.capturePartialLapTimes();
        }
        race.resetRaceTime();
        if (allowFinish == AllowFinish.None || allowFinish == AllowFinish.NoneAutoSegments) {
          return true;
        }
        return finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount();
      }
      return false;
    }

    if (allowFinish == AllowFinish.None || allowFinish == AllowFinish.NoneAutoSegments) {
      if (race.getCurrentHeat().getDrivers() != null) {
        for (DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
          if (driver.getLapCount() >= limit) {
            return true;
          }
        }
      }
      return false;
    }
    return finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount();
  }

  private void updateHeatProgress(HeatScoring scoring, boolean isInfiniteTimed) {
    if (scoring == null) {
      return;
    }
    double currentProgress = 0;
    long limitValue = scoring.getFinishValue();
    if (limitValue > 0) {
      if (scoring.getFinishMethod() == FinishMethod.Timed) {
        currentProgress = Math.min(1.0, (limitValue - race.getRaceTime()) / (double) limitValue);
      } else {
        int maxLaps = 0;
        if (race.getCurrentHeat().getDrivers() != null) {
          for (DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
            maxLaps = Math.max(maxLaps, driver.getLapCount());
          }
        }
        currentProgress = Math.min(1.0, (double) maxLaps / limitValue);
      }
    } else if (isInfiniteTimed) {
      currentProgress = 0.0;
    }

    if (Math.abs(currentProgress - previousHeatProgress) >= 0.01
        || (currentProgress >= 1.0 && previousHeatProgress < 1.0)) {
      race.setHeatProgress(currentProgress);
      previousHeatProgress = currentProgress;
    }
  }

  private void updateFlagAndBroadcast() {
    RaceFlag currentFlag = getFlagType(race);
    if (currentFlag != previousFlag) {
      race.broadcastFlag(currentFlag);
      previousFlag = currentFlag;
    }
    race.broadcastTime();
  }

  private void handleHeatFinish(AllowFinish allowFinish) {
    if (allowFinish == AllowFinish.NoneAutoSegments && executionManager != null) {
      executionManager.applyEndHeatAutoSegments();
    }
    if (race.isLastHeat()) {
      race.changeState(new RaceOver());
    } else {
      race.changeState(new HeatOver());
    }
  }

  @Override
  public void exit(Race race) {
    if (timerHandle != null) {
      timerHandle.cancel(false);
    }
    if (scheduler != null) {
      scheduler.shutdown();
      scheduler = null;
    }

    if (race.getRaceModel().isStartAtCurrent() && race.getCurrentHeat() != null) {
      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      HeatExecutionManager em = race.getHeatExecutionManager();
      if (drivers != null && em != null && em.getTimeSinceLastLap() != null) {
        for (int i = 0; i < drivers.size(); i++) {
          DriverHeatData dhd = drivers.get(i);
          if (dhd != null
              && !em.getFinishedLanes().contains(i)
              && i < em.getTimeSinceLastLap().length) {
            dhd.setCarryOverTime(em.getTimeSinceLastLap()[i]);
          }
        }
      }
    }

    List<PartialTime> partialTimes = race.stopProtocols();
    if (partialTimes != null && race.getCurrentHeat() != null) {
      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      HeatExecutionManager em = race.getHeatExecutionManager();
      Set<Integer> finished = em != null ? em.getFinishedLanes() : Collections.emptySet();
      for (PartialTime pt : partialTimes) {
        int lane = pt.getLaneIndex();
        if (drivers != null && lane >= 0 && lane < drivers.size()) {
          DriverHeatData dhd = drivers.get(lane);
          if (dhd != null && !finished.contains(lane) && pt.getLapTime() > 0) {
            dhd.addPendingLapTime(pt.getLapTime());
            dhd.markDriftTime();
            logger.info("Added partial lap time of {}s to lane {}", pt.getLapTime(), lane);
          }
        }
      }
    }

    logger.info("Racing state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    throw new IllegalStateException("Cannot start race: Race is already in Racing state.");
  }

  @Override
  public void pause(Race race) {
    logger.info("Racing.pause() called. Pausing race.");
    race.getStatistics().incrementYellowFlagCount();
    race.changeState(new Paused());
  }

  @Override
  public void restartHeat(Race race) {
    logger.info("Racing.restartHeat() called. Resetting current heat.");
    race.changeState(new NotStarted());
    race.resetCurrentHeat();
    race.setAutoStartFired(false);
    race.setAutoAdvanceFired(false);
  }

  @Override
  public void skipHeat(Race race) {
    throw new IllegalStateException(
        "Cannot skip heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    return handleLap(race, lane, lapTime, interfaceId, false);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    executionManager.onSegment(lane, segmentTime, interfaceId);
  }

  @Override
  public void onCarData(CarData carData) {
    executionManager.handlePitDetection(carData);
    if (executionManager.isDigitalFuelEnabled()) {
      executionManager.handleDigitalFuelCarData(carData);
    }

    int lane = carData.getLane();
    // Broadcast the CarData to clients
    com.antigravity.proto.CarData.Builder dataBuilder = // fqn-collision
        com.antigravity.proto.CarData.newBuilder() // fqn-collision
            .setLane(carData.getLane())
            .setControllerThrottlePct(carData.getControllerThrottlePCT())
            .setCarThrottlePct(carData.getCarThrottlePCT())
            .setLocation(carData.getLocation().getValue())
            .setLocationId(carData.getLocationId())
            .setIsRefueling(executionManager.getIsRefueling()[lane]);

    if (race.getCurrentHeat() != null && race.getCurrentHeat().getDrivers() != null) {
      if (lane >= 0 && lane < race.getCurrentHeat().getDrivers().size()) {
        DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
        if (driverData != null) {
          driverData.setCurrentLocation(carData.getLocation());
          if (driverData.getDriver() != null) {
            dataBuilder.setFuelLevel(driverData.getDriver().getFuelLevel());
          }
          RaceFlag laneFlag = getLaneFlagType(race, lane);
          driverData.setFlag(laneFlag);
          dataBuilder.setFlag(laneFlag);
        }
      }
    }

    com.antigravity.proto.CarData protoCarData = dataBuilder.build(); // fqn-collision
    RaceData raceDataMsg = RaceData.newBuilder().setCarData(protoCarData).build();

    race.broadcast(raceDataMsg);

    syncFuelLevels();
  }

  private void syncFuelLevels() {
    if (previousFuelLevels == null) {
      return;
    }
    FuelOptions fuelOptions = null;
    if (executionManager.isAnalogFuelEnabled()) {
      fuelOptions = race.getRaceModel().getFuelOptions();
    } else if (executionManager.isDigitalFuelEnabled()) {
      fuelOptions = race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions != null && fuelOptions.isEnabled()) {
      double capacity = fuelOptions.getCapacity();
      if (capacity > 0) {
        List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
        if (drivers != null) {
          for (int i = 0; i < Math.min(drivers.size(), previousFuelLevels.length); i++) {
            DriverHeatData driverData = drivers.get(i);
            int lane = driverData.getLane() >= 0 ? driverData.getLane() : i;
            if (lane < 0 || lane >= previousFuelLevels.length) continue;
            double currentFuel = driverData.getDriver().getFuelLevel();
            int currentPct = (int) ((currentFuel / capacity) * 100.0);
            if (currentPct != previousFuelLevels[lane]) {
              race.setFuelLevel(lane, currentFuel, capacity);
              previousFuelLevels[lane] = currentPct;
            }
          }
        }
      }
    }
  }

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("Racing.onCallbutton() called. Pausing race.");
    race.recordTrackCall(lane);
    pause(race);
  }

  void calculateAutoSegments() {
    HeatExecutionManager.calculateAutoSegments(race, executionManager);
  }

  private void initializeFalseStartTimePenalties() {
    if (race == null || race.getCurrentHeat() == null) return;

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (drivers == null) return;
    for (int i = 0; i < drivers.size(); i++) {
      DriverHeatData dhd = drivers.get(i);
      if (dhd.getRemainingFalseStartTimePenalty() > 0) {
        logger.info(
            "Racing: Lane {} has a false start penalty of {}s remaining. Turning power OFF.",
            i,
            dhd.getRemainingFalseStartTimePenalty());
        race.setLanePower(false, i);
      }
    }
  }

  private void processFalseStartTimePenalties(float delta) {
    if (race == null || race.getCurrentHeat() == null) return;

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (drivers == null) return;
    for (int i = 0; i < drivers.size(); i++) {
      DriverHeatData dhd = drivers.get(i);
      double remaining = dhd.getRemainingFalseStartTimePenalty();
      if (remaining > 0) {
        double newRemaining = Math.max(0, remaining - delta);
        dhd.setRemainingFalseStartTimePenalty(newRemaining);
        if (newRemaining <= 0) {
          logger.info("Racing: False start penalty for lane {} expired. Turning power ON.", i);
          race.setLanePower(true, i);
        }
      }
    }
  }
}
