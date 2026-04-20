package com.antigravity.race.states;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.proto.RaceFlag;
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

    List<DriverHeatData> heatDrivers = race.getCurrentHeat().getDrivers();
    if (heatDrivers == null) return RaceFlag.GREEN;

    // Checkered flag if any driver has finished (and race allows finishing)
    if (scoring.getAllowFinish() != AllowFinish.None) {
      // For timed races, show checkered flag immediately when counter reaches 0
      if (scoring.getFinishMethod() == FinishMethod.Timed && race.getRaceTime() <= 0) {
        return RaceFlag.CHECKERED;
      }
      // For lap-based races, show checkered when any driver finishes
      for (int i = 0; i < heatDrivers.size(); i++) {
        DriverHeatData hd = heatDrivers.get(i);
        if (isDriverFinished(i, hd, scoring)) {
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

  private boolean isDriverFinished(int laneIndex, DriverHeatData hd, HeatScoring scoring) {
    if (scoring == null || hd == null) return false;

    if (scoring.getFinishMethod() == FinishMethod.Lap) {
      return hd.getLapCount() >= scoring.getFinishValue();
    } else if (scoring.getFinishMethod() == FinishMethod.Timed) {
      // For timed races, they are finished if they've crossed the line after time expired
      // This is tracked by the execution manager
      return executionManager.getFinishedLanes().contains(laneIndex);
    }
    return false;
  }

  @Override
  public void enter(Race race) {
    this.race = race;
    this.executionManager = race.getHeatExecutionManager();

    if (race.getStatistics().getStartTime() == null) {
      race.getStatistics().setStartTime(OffsetDateTime.now().toString());
      race.getStatistics().setStartMillis(System.currentTimeMillis());
    }
    if (race.getCurrentHeat() != null
        && race.getCurrentHeat().getStatistics().getStartTime() == null) {
      race.getCurrentHeat().getStatistics().setStartTime(OffsetDateTime.now().toString());
      race.getCurrentHeat().getStatistics().setStartMillis(System.currentTimeMillis());
    }

    if (race.isDemoMode()) {
      race.setMainPower(true);
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
      for (int i = 0; i < laneCount; i++) {
        race.setLanePower(true, i);
      }
      previousRefuelingState = new boolean[laneCount];
      previousFuelLevels = new int[laneCount];
      for (int i = 0; i < laneCount; i++) {
        previousFuelLevels[i] = -1;
      }
    }

    logger.info("Racing: Digital fuel enabled: {}", executionManager.isDigitalFuelEnabled());
    logger.info("Racing: Analog fuel enabled: {}", executionManager.isAnalogFuelEnabled());

    race.startProtocols();
    scheduler = Executors.newScheduledThreadPool(1);
    final Runnable ticker =
        new Runnable() {
          long lastTime = 0;

          @Override
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
              boolean isTimed = scoring != null && scoring.getFinishMethod() == FinishMethod.Timed;

              if (isTimed) {
                race.addRaceTime(-delta);
              } else {
                race.addRaceTime(delta);
              }

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
                  if (race.getRaceTime() <= 0) {
                    race.resetRaceTime();
                    if (allowFinish == AllowFinish.None) {
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
                  long limit = scoring.getFinishValue();
                  if (allowFinish == AllowFinish.None) {
                    for (DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
                      if (driver.getLapCount() >= limit) {
                        allFinished = true;
                        break;
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
                long limit = scoring.getFinishValue();
                if (limit > 0) {
                  if (scoring.getFinishMethod() == FinishMethod.Timed) {
                    currentProgress = Math.min(1.0, (limit - race.getRaceTime()) / (double) limit);
                  } else {
                    int maxLaps = 0;
                    for (DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
                      maxLaps = Math.max(maxLaps, driver.getLapCount());
                    }
                    currentProgress = Math.min(1.0, (double) maxLaps / limit);
                  }
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
      timerHandle.cancel(true);
    }
    if (scheduler != null) {
      scheduler.shutdown();
      try {
        if (!scheduler.awaitTermination(2, TimeUnit.SECONDS)) {
          scheduler.shutdownNow();
        }
      } catch (InterruptedException e) {
        scheduler.shutdownNow();
        Thread.currentThread().interrupt();
      }
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
  public void onCarData(com.antigravity.protocols.CarData carData) {
    executionManager.handlePitDetection(carData);
    if (executionManager.isDigitalFuelEnabled()) {
      executionManager.handleDigitalFuelCarData(carData);
    }

    int lane = carData.getLane();
    // Broadcast the CarData to clients
    com.antigravity.proto.CarData.Builder dataBuilder =
        com.antigravity.proto.CarData.newBuilder()
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
        }
      }
    }

    com.antigravity.proto.CarData protoCarData = dataBuilder.build();
    com.antigravity.proto.RaceData raceDataMsg =
        com.antigravity.proto.RaceData.newBuilder().setCarData(protoCarData).build();

    race.broadcast(raceDataMsg);

    syncFuelLevels();
  }

  private void syncFuelLevels() {
    if (previousFuelLevels == null) {
      return;
    }
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (executionManager.isAnalogFuelEnabled()) {
      fuelOptions = race.getRaceModel().getFuelOptions();
    } else if (executionManager.isDigitalFuelEnabled()) {
      fuelOptions = race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions != null && fuelOptions.isEnabled()) {
      double capacity = fuelOptions.getCapacity();
      if (capacity > 0) {
        List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
        for (int i = 0; i < Math.min(drivers.size(), previousFuelLevels.length); i++) {
          double currentFuel = drivers.get(i).getDriver().getFuelLevel();
          int currentPct = (int) ((currentFuel / capacity) * 100.0);
          if (currentPct != previousFuelLevels[i]) {
            race.setFuelLevel(i, currentPct);
            previousFuelLevels[i] = currentPct;
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
}
