package com.antigravity.race.states;

import com.antigravity.converters.HeatConverter;
import com.antigravity.models.HeatRotationType;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.CarData;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NotStarted implements IRaceState {
  private static final Logger logger = LoggerFactory.getLogger(NotStarted.class);

  @Override
  public RaceFlag getFlagType(Race race) {
    if (race == null) return RaceFlag.RED;

    double autoStartTime = race.getRaceModel().getAutoStartTime();
    double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
    double elapsed = autoStartTime - race.getAutoStartRemaining();
    if (autoStartWarmupTime > 0
        && elapsed <= autoStartWarmupTime
        && race.getAutoStartRemaining() > 0) {
      return RaceFlag.GREEN_YELLOW;
    }

    return RaceFlag.RED;
  }

  private ScheduledExecutorService scheduler;
  private ScheduledFuture<?> timerHandle;
  private Race race;
  private HeatExecutionManager executionManager;

  @Override
  public void enter(Race race) {
    logger.info("NotStarted state entered.");
    this.race = race;
    race.setHasRacedInCurrentHeat(false);
    race.prepareHeat();
    double autoStartTime = race.getRaceModel().getAutoStartTime();

    if (autoStartTime > 0 && !race.isAutoStartFired()) {
      race.setAutoStartRemaining(autoStartTime);
    }

    race.initializeHardwareState();
    this.executionManager = race.getHeatExecutionManager();

    if (autoStartTime > 0 && !race.isAutoStartFired()) {
      startAutoStartTimer(race);
    } else {
      race.setAutoStartRemaining(0);
      broadcastTime(race);
    }
  }

  @Override
  public void exit(Race race) {
    logger.info("NotStarted state exited.");
    stopTimer();
    race.setAutoStartRemaining(0);
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    logger.info("NotStarted.start() called. Starting new race.");
    stopTimer();
    double autoStartTime = race.getRaceModel().getAutoStartTime();
    double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
    double elapsed = autoStartTime - race.getAutoStartRemaining();

    if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
      logger.info("NotStarted.start(): Warmup was active, resetting heat.");
      race.resetCurrentHeat();
    }

    race.changeState(new Starting());
  }

  @Override
  public void pause(Race race) {
    logger.info("NotStarted.pause() called. Terminating auto-start.");

    double autoStartTime = race.getRaceModel().getAutoStartTime();
    double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
    double elapsed = autoStartTime - race.getAutoStartRemaining();

    if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
      logger.info("NotStarted.pause(): Warmup was active, resetting heat.");
      race.resetCurrentHeat();
    }

    stopTimer();
    race.setAutoStartFired(true);
    race.clearAutoTimers();
    RaceFlag flag = getFlagType(race);
    race.broadcastFlag(flag);
    race.setRaceState(RaceState.NOT_STARTED, flag, 0);
    race.resetRaceTime();
    broadcastTime(race);
  }

  @Override
  public void restartHeat(Race race) {
    logger.info("NotStarted.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    // Re-enter NotStarted state to restart the auto-start timer if configured
    race.changeState(new NotStarted());
  }

  @Override
  public void skipHeat(Race race) {
    logger.info("NotStarted.skipHeat() called. Skipping current heat and auto-advancing.");
    Common.advanceToNextHeat(race);
  }

  @Override
  public void deferHeat(Race race) {
    logger.info("NotStarted.deferHeat() called.");
    List<Heat> heats = race.getHeats();
    if (heats == null || heats.size() <= 1) {
      logger.info("NotStarted.deferHeat(): Not enough heats to defer.");
      return;
    }

    Heat currentHeat = race.getCurrentHeat();
    int currentIndex = heats.indexOf(currentHeat);

    // Move current heat to the end
    heats.remove(currentIndex);
    heats.add(currentHeat);

    // Update current heat to the one that was immediately after
    // Since we removed it, the next one is now at currentIndex (if it wasn't
    // already at the end)
    // Actually, the prompt says "The current heat should be updated to the heat
    // that was immediately after the current heat"
    // If we move heat N to the end, heat N+1 becomes the new current heat.
    race.setCurrentHeat(heats.get(currentIndex));

    // Update heat numbers for all heats to reflect their new order
    for (int i = 0; i < heats.size(); i++) {
      heats.get(i).setHeatNumber(i + 1);
    }

    // Broadcast partial update
    Set<String> sentObjectIds = new HashSet<>();
    com.antigravity.proto.Race raceUpdate = // fqn-collision
        com.antigravity.proto.Race.newBuilder() // fqn-collision
            .addAllHeats(
                heats.stream()
                    .map(h -> HeatConverter.toProto(h, sentObjectIds))
                    .collect(Collectors.toList()))
            .setCurrentHeat(HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
            .build();

    RaceData raceDataMsg = RaceData.newBuilder().setRace(raceUpdate).build();

    race.broadcast(raceDataMsg);
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    if (this.race == null) {
      return false;
    }

    double autoStartTime = race.getRaceModel().getAutoStartTime();
    double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
    double elapsed = autoStartTime - race.getAutoStartRemaining();

    if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
      logger.debug("NotStarted: Warmup lap detected, delegating to executor.");
      return executionManager.onLap(
          lane,
          lapTime,
          interfaceId,
          true,
          false,
          false); // ignoreTeamLimits = true, checkFinish = false, isDrift = false
    }
    return false;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    if (this.race == null) {
      return;
    }

    double autoStartTime = race.getRaceModel().getAutoStartTime();
    double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
    double elapsed = autoStartTime - race.getAutoStartRemaining();

    if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
      logger.debug("NotStarted: Warmup segment detected, delegating to executor.");
      executionManager.onSegment(lane, segmentTime, interfaceId);
    }
  }

  @Override
  public void onCarData(CarData carData) {
    if (this.race == null) {
      return;
    }

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
  }

  private void startAutoStartTimer(final Race race) {
    scheduler = Executors.newScheduledThreadPool(1);
    final Runnable ticker =
        new Runnable() {
          long lastTime = 0;
          RaceFlag lastFlag = RaceFlag.RED;

          @Override
          public void run() {
            try {
              long now = System.nanoTime();
              if (lastTime == 0) {
                lastTime = now;
                return;
              }

              double delta = (now - lastTime) / 1_000_000_000.0;
              lastTime = now;

              double remaining = race.getAutoStartRemaining() - delta;

              // Handle warmup time power logic and refueling
              double autoStartTime = race.getRaceModel().getAutoStartTime();
              double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
              double elapsed = autoStartTime - Math.max(0, remaining);

              if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
                // During warmup, process refueling and fuel usage
                executionManager.processTicker((float) delta);
              }

              if (remaining <= 0) {
                remaining = 0;
                race.setAutoStartRemaining(0);
                broadcastTime(race);
                stopTimer();
                race.setAutoStartFired(true);
                race.startRace();
              } else {
                race.setAutoStartRemaining(remaining);

                if (autoStartWarmupTime > 0) {
                  if (elapsed > autoStartWarmupTime) {
                    if (race.isMainPower()) {
                      // Warmup just ended
                      logger.info("NotStarted: Warmup ended. Resetting heat.");
                      race.resetCurrentHeat();
                      race.broadcastFlag(RaceFlag.RED);
                    }
                  }
                }

                RaceFlag currentFlag = getFlagType(race);
                if (currentFlag != lastFlag) {
                  logger.info("Auto-start flag changed to: {}", currentFlag);
                  race.broadcastFlag(currentFlag);
                  lastFlag = currentFlag;
                }

                race.setRaceState(RaceState.NOT_STARTED, currentFlag, remaining);
                broadcastTime(race);
              }
            } catch (Exception e) {
              logger.error("Error in auto-start ticker", e);
            }
          }
        };
    timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, TimeUnit.MILLISECONDS);
  }

  private void stopTimer() {
    if (timerHandle != null) {
      timerHandle.cancel(false);
    }
    if (scheduler != null) {
      scheduler.shutdown();
    }
  }

  private void broadcastTime(Race race) {
    race.broadcastTime();
  }

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("NotStarted.onCallbutton() called. Starting race.");
    race.startRace();
  }

  @Override
  public boolean canChangeLane(Race race) {
    if (race == null || race.getRaceModel() == null) return false;
    HeatRotationType type = race.getRaceModel().getHeatRotationType();
    return type == HeatRotationType.SingleHeat || type == HeatRotationType.SingleHeatSolo;
  }
}
