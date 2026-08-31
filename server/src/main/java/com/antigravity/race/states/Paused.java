package com.antigravity.race.states;

import com.antigravity.proto.RaceData;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Paused implements IRaceState {
  private static final Logger logger = LoggerFactory.getLogger(Paused.class);

  @Override
  public RaceFlag getFlagType(Race race) {
    return race != null && race.getTheme() != null
        ? race.getTheme()
            .resolveFlag("flag.heat_paused", RaceFlag.YELLOW, race.getDatabaseContext())
        : RaceFlag.YELLOW;
  }

  private Race race;
  private long pauseStartTimeMillis;

  @Override
  public void enter(Race race) {
    this.race = race;
    logger.info("Paused state entered. Race paused.");
    race.broadcastFlag(getFlagType(race));
    this.pauseStartTimeMillis = System.currentTimeMillis();
  }

  @Override
  public void exit(Race race) {
    long duration = System.currentTimeMillis() - pauseStartTimeMillis;
    race.getStatistics().addPausedTime(duration);
    logger.info("Paused state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    logger.info("Paused.start() called. Resuming from Paused state.");
    race.changeState(new Starting());
  }

  @Override
  public void pause(Race race) {
    throw new IllegalStateException("Cannot pause race: Race is already in Paused state.");
  }

  @Override
  public void restartHeat(Race race) {
    logger.info("Paused.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.setAutoStartFired(false);
    race.setAutoAdvanceFired(false);
    race.changeState(new NotStarted());
  }

  @Override
  public void skipHeat(Race race) {
    logger.info("Paused.skipHeat() called. Skipping current heat and auto-advancing.");
    Common.advanceToNextHeat(race);
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    return Common.handleDriftLap(
        race, pauseStartTimeMillis, "Paused", lane, lapTime, interfaceId, null);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    // Not while paused
  }

  @Override
  public void onCarData(CarData carData) {
    if (this.race == null) {
      return;
    }

    int lane = carData.getLane();
    // Broadcast the CarData to clients
    com.antigravity.proto.CarData.Builder dataBuilder = // fqn-collision
        com.antigravity.proto.CarData.newBuilder() // fqn-collision
            .setLane(carData.getLane())
            .setControllerThrottlePct(carData.getControllerThrottlePCT())
            .setCarThrottlePct(carData.getCarThrottlePCT())
            .setLocation(carData.getLocation().getValue())
            .setLocationId(carData.getLocationId());

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

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("Paused.onCallbutton() called. Resuming race.");
    race.startRace();
  }
}
