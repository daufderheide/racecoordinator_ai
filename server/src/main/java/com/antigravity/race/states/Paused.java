package com.antigravity.race.states;

import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.Race;

public class Paused implements IRaceState {

  @Override
  public RaceFlag getFlagType(Race race) {
    return RaceFlag.YELLOW;
  }

  private long pauseStartTimeMillis;

  @Override
  public void enter(Race race) {
    System.out.println("Paused state entered. Race paused.");
    race.setMainPower(false);
    this.pauseStartTimeMillis = System.currentTimeMillis();
  }

  @Override
  public void exit(Race race) {
    long duration = System.currentTimeMillis() - pauseStartTimeMillis;
    race.getStatistics().addPausedTime(duration);
    System.out.println("Paused state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    System.out.println("Paused.start() called. Resuming from Paused state.");
    race.changeState(new Starting());
  }

  @Override
  public void pause(Race race) {
    throw new IllegalStateException("Cannot pause race: Race is already in Paused state.");
  }

  @Override
  public void restartHeat(Race race) {
    System.out.println("Paused.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.changeState(new NotStarted());
  }

  @Override
  public void skipHeat(Race race) {
    System.out.println("Paused.skipHeat() called. Advancing to HeatOver.");
    race.changeState(new HeatOver());
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    // Not while paused
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    // Not while paused
  }

  @Override
  public void onCarData(CarData carData) {}

  @Override
  public void onCallbutton(Race race, int lane) {
    System.out.println("Paused.onCallbutton() called. Resuming race.");
    start(race);
  }
}
