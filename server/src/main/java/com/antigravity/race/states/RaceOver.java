package com.antigravity.race.states;

import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.Race;
import java.time.OffsetDateTime;

public class RaceOver implements IRaceState {

  @Override
  public RaceFlag getFlagType(Race race) {
    return RaceFlag.RED;
  }

  @Override
  public void enter(Race race) {
    System.out.println("RaceOver state entered.");
    race.setMainPower(false);

    race.getStatistics().setEndTime(OffsetDateTime.now().toString());
    long raceStart = race.getStatistics().getStartMillis();
    if (raceStart > 0) {
      race.getStatistics().setDurationMillis(System.currentTimeMillis() - raceStart);
    }

    if (race.getCurrentHeat() != null
        && race.getCurrentHeat().getStatistics().getEndTime() == null) {
      race.getCurrentHeat().getStatistics().setEndTime(OffsetDateTime.now().toString());
      long heatStart = race.getCurrentHeat().getStatistics().getStartMillis();
      if (heatStart > 0) {
        race.getCurrentHeat()
            .getStatistics()
            .setDurationMillis(System.currentTimeMillis() - heatStart);
      }
    }
  }

  @Override
  public void exit(Race race) {
    System.out.println("RaceOver state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    throw new IllegalStateException(
        "Cannot start race: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void pause(Race race) {
    throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
  }

  @Override
  public void restartHeat(Race race) {
    throw new IllegalStateException(
        "Cannot restart heat from state: " + this.getClass().getSimpleName());
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
  public void onLap(int lane, double lapTime, int interfaceId) {}

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {}

  @Override
  public void onCarData(CarData carData) {}

  @Override
  public void onCallbutton(Race race, int lane) {
    System.out.println("RaceOver: Ignored onCallbutton - Race is over");
  }
}
