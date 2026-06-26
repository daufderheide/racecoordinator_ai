package com.antigravity.race.states;

import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.proto.Lap;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.StandingsUpdate;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.PartialTime;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import java.time.OffsetDateTime;
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
    if (scoring.getAllowFinish() != AllowFinish.None
        && scoring.getAllowFinish() != AllowFinish.NoneAutoSegments) {
      // For timed races, show checkered flag immediately when counter reaches 0
      if (scoring.getFinishMethod() == FinishMethod.Timed && race.getRaceTime() <= 0) {
        return RaceFlag.CHECKERED;
      }
      // For lap-based races, show checkered when any driver finishes
      for (int i = 0; i < heatDrivers.size(); i++) {
        DriverHeatData hd = heatDrivers.get(i);
        if (isDriverFinished(race, i, hd)) {
          return RaceFlag.CHECKERED;
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
        return RaceFlag.WHITE;
      }
    }

    return RaceFlag.GREEN;
  }

  @Override
  @SuppressWarnings("checkstyle:MethodLength")
  public void enter(Race race) {
    this.race = race;
    this.previousHeatProgress = -1.0;
    this.executionManager = race.getHeatExecutionManager();

    RaceFlag initialFlag = getFlagType(race);
    race.broadcastFlag(initialFlag);
    this.previousFlag = initialFlag;

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
    }

    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring != null && scoring.getFinishMethod() == FinishMethod.Timed) {
      if (race.getRaceTime() == 0) {
        race.addRaceTime((float) scoring.getFinishValue());
      }
    }

    race.setHasRacedInCurrentHeat(true);
    race.clearAutoTimers();

    int laneCount = 0;
    if (race.getTrack() != null && race.getTrack().getLanes() != null) {
      laneCount = race.getTrack().getLanes().size();
      previousRefuelingState = new boolean[laneCount];
      previousFuelLevels = new int[laneCount];
      for (int i = 0; i < laneCount; i++) {
        previousFuelLevels[i] = -1;
      }
    }

    logger.info("Racing: Digital fuel enabled: {}", executionManager.isDigitalFuelEnabled());
    logger.info("Racing: Analog fuel enabled: {}", executionManager.isAnalogFuelEnabled());

    race.startProtocols();
    initializeFalseStartTimePenalties();
    if (scheduler != null) {
      scheduler.shutdownNow();
    }
    scheduler = Executors.newScheduledThreadPool(1);
    final Runnable ticker =
        new Runnable() {
          long lastTime = 0;

          @Override
          @SuppressWarnings("checkstyle:MethodLength")
          public void run() {
            try {
              long now = System.nanoTime();
              if (lastTime == 0) {
                lastTime = now;
                return;
              }

              float delta = (now - lastTime) / 1_000_000_000.0f;
              lastTime = now;

              HeatScoring scoring = race.getRaceModel().getHeatScoring();
              long limit = scoring != null ? scoring.getFinishValue() : 0;
              boolean isTimed = scoring != null && scoring.getFinishMethod() == FinishMethod.Timed;
              boolean isInfiniteTimed = isTimed && limit <= 0;

              if (isTimed && !isInfiniteTimed) {
                race.addRaceTime(-delta);
              } else {
                race.addRaceTime(delta);
              }

              // Handle false start time penalties
              processFalseStartTimePenalties(delta);

              // Handle refueling and fuel usage via the execution manager
              executionManager.processTicker(delta);

              // Check for refueling state changes
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

              // Check for fuel level changes
              syncFuelLevels();

              // Check finish conditions
              boolean allFinished = false;
              AllowFinish allowFinish =
                  scoring != null ? scoring.getAllowFinish() : AllowFinish.None;

              if (scoring != null) {
                Set<Integer> finishedLanes = executionManager.getFinishedLanes();
                if (isTimed) {
                  if (!isInfiniteTimed && race.getRaceTime() <= 0) {
                    race.resetRaceTime();
                    if (allowFinish == AllowFinish.None
                        || allowFinish == AllowFinish.NoneAutoSegments) {
                      allFinished = true;
                    } else {
                      // Timed race with Allow Finish: Heat ends when everyone has crossed the line
                      // once after time expired
                      if (finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
                        allFinished = true;
                      }
                    }
                  }
                } else {
                  // Lap based
                  if (allowFinish == AllowFinish.None
                      || allowFinish == AllowFinish.NoneAutoSegments) {
                    if (race.getCurrentHeat().getDrivers() != null) {
                      for (DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
                        if (driver.getLapCount() >= limit) {
                          allFinished = true;
                          break;
                        }
                      }
                    }
                  } else {
                    // Lap based with Allow Finish: Heat ends when everyone has reached the lap
                    // limit
                    if (finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
                      allFinished = true;
                    }
                  }
                }
              }

              // Update heat progress
              if (scoring != null) {
                double currentProgress = 0;
                long limitValue = scoring.getFinishValue();
                if (limitValue > 0) {
                  if (scoring.getFinishMethod() == FinishMethod.Timed) {
                    currentProgress =
                        Math.min(1.0, (limitValue - race.getRaceTime()) / (double) limitValue);
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
                  // For infinite timed races, progress stays at 0
                  currentProgress = 0.0;
                }

                // Update if changed significantly or at the very end
                if (Math.abs(currentProgress - previousHeatProgress) >= 0.01
                    || (currentProgress >= 1.0 && previousHeatProgress < 1.0)) {
                  race.setHeatProgress(currentProgress);
                  previousHeatProgress = currentProgress;
                }
              }

              // Check for flag changes
              RaceFlag currentFlag = getFlagType(race);
              if (currentFlag != previousFlag) {
                race.broadcastFlag(currentFlag);
                previousFlag = currentFlag;
              }

              // Broadcast RaceTime message wrapped in RaceData
              race.broadcastTime();

              if (allFinished) {
                if (allowFinish == AllowFinish.NoneAutoSegments) {
                  calculateAutoSegments();
                  StandingsUpdate update =
                      race.getCurrentHeat().getHeatStandings().updateStandings();
                  if (update != null) {
                    race.broadcast(RaceData.newBuilder().setStandingsUpdate(update).build());
                  }
                  race.updateAndBroadcastOverallStandings();
                }
                if (race.isLastHeat()) {
                  race.changeState(new RaceOver());
                } else {
                  race.changeState(new HeatOver());
                }
              }

            } catch (Exception e) {
              logger.error("Error in Racing timer", e);
            }
          }
        };
    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, TimeUnit.MILLISECONDS);
  }

  @Override
  public void exit(Race race) {
    if (timerHandle != null) {
      timerHandle.cancel(false);
    }
    if (scheduler != null) {
      scheduler.shutdownNow();
      scheduler = null;
    }
    race.stopProtocols();
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

    // Get partial times on pause and add them to each driver's pending lap time
    List<PartialTime> partialTimes = race.stopProtocols();
    if (partialTimes != null && race.getCurrentHeat() != null) {
      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      for (PartialTime pt : partialTimes) {
        int lane = pt.getLaneIndex();
        if (drivers != null && lane >= 0 && lane < drivers.size()) {
          DriverHeatData dhd = drivers.get(lane);
          if (dhd != null) {
            dhd.addPendingLapTime(pt.getLapTime());
            logger.info("Added partial lap time of {}s to lane {}", pt.getLapTime(), lane);
          }
        }
      }
    }

    race.changeState(new Paused());
  }

  @Override
  public void restartHeat(Race race) {
    logger.info("Racing.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.changeState(new NotStarted());
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
            double currentFuel = drivers.get(i).getDriver().getFuelLevel();
            int currentPct = (int) ((currentFuel / capacity) * 100.0);
            if (currentPct != previousFuelLevels[i]) {
              race.setFuelLevel(i, currentFuel, capacity);
              previousFuelLevels[i] = currentPct;
            }
          }
        }
      }
    }
  }

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("Racing.onCallbutton() called. Pausing race.");
    pause(race);
  }

  void calculateAutoSegments() {
    if (race == null || race.getCurrentHeat() == null) return;

    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring == null) return;

    boolean isLapBased = scoring.getFinishMethod() == FinishMethod.Lap;
    long limit = scoring.getFinishValue();
    double[] times = executionManager.getTimeSinceLastLap();
    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (drivers == null) return;

    for (int i = 0; i < drivers.size(); i++) {
      DriverHeatData dhd = drivers.get(i);
      if (dhd == null) continue;

      // Lap based race: the driver that got to the lap limit ending the heat should
      // get 0 auto
      // segments
      if (isLapBased && dhd.getLapCount() >= limit) {
        dhd.setAutoCalculatedLaps(0.0);
      } else {
        double median = dhd.getMedianLapTime();
        if (median <= 0) {
          dhd.setAutoCalculatedLaps(0.0);
        } else {
          double time = (times != null && i < times.length) ? times[i] : 0.0;
          double segments = time / median;
          if (segments >= 1.0) {
            segments = 0.99;
          }
          dhd.setAutoCalculatedLaps(segments);
        }
      }

      // Broadcast Lap update so client sees the new adjusted lap count
      Lap lapMsg =
          Lap.newBuilder()
              .setObjectId(dhd.getObjectId())
              .setLapTime(dhd.getLastLapTime())
              .setLapNumber(dhd.getLapCount())
              .setAverageLapTime(dhd.getAverageLapTime())
              .setMedianLapTime(dhd.getMedianLapTime())
              .setBestLapTime(dhd.getBestLapTime())
              .setDriverId(dhd.getActualDriver() != null ? dhd.getActualDriver().getEntityId() : "")
              .setFuelLevel(dhd.getDriver().getFuelLevel())
              .setAdjustedLapCount(dhd.getAdjustedLapCount())
              .setType(Lap.LapType.LAP)
              .setFlag(getLaneFlagType(race, i))
              .build();

      race.broadcast(RaceData.newBuilder().setLap(lapMsg).build());
    }
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
